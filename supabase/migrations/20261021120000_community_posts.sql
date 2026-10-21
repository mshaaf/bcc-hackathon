-- Block Ops B1: one shared community, memberships, posts and one-level replies.
-- Clients never write tables directly: every write is a SECURITY DEFINER function that derives the
-- actor from auth.uid() (never from client input) and validates bounds. Tables only grant SELECT.

create schema if not exists private;
grant usage on schema private to authenticated;

-- btrim() only strips spaces; this also strips tabs, newlines and Unicode spaces so a blank-looking post counts as empty.
create function private.trim_text(p_text text) returns text
language sql immutable parallel safe set search_path = '' as $$
  select regexp_replace(coalesce(p_text, ''), '^[\s\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]+|[\s\u00a0\u1680\u2000-\u200b\u2028\u2029\u202f\u205f\u3000\ufeff]+$', '', 'g');
$$;
grant execute on function private.trim_text(text) to authenticated;

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) between 1 and 120),
  description text not null check (char_length(description) between 1 and 1000),
  is_demo boolean not null default true,
  moderator_id uuid references auth.users (id) on delete set null,
  -- Bumped on join/leave. Realtime does not apply row security to DELETE events, so members learn about departures
  -- from this row's (RLS-checked, filterable) UPDATE event instead.
  activity_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create table public.community_members (
  community_id uuid not null references public.communities (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (community_id, user_id)
);

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  parent_id uuid,
  author_id uuid not null references auth.users (id) on delete cascade,
  author_name text not null check (char_length(author_name) between 1 and 40),
  body text not null check (char_length(body) <= 2000),
  kind text not null default 'discussion' check (kind in ('discussion', 'update', 'observation')),
  operation_id uuid not null,
  hidden_at timestamptz,
  hidden_by uuid references auth.users (id) on delete set null,
  edited_at timestamptz,
  created_at timestamptz not null default now(),
  unique (id, community_id),
  unique (author_id, operation_id),
  foreign key (parent_id, community_id) references public.posts (id, community_id) on delete cascade,
  check ((hidden_at is null and char_length(private.trim_text(body)) >= 1) or (hidden_at is not null and body = ''))
);
create index posts_feed_idx on public.posts (community_id, created_at, id);

-- Original text of a moderator-hidden post. Not exposed through the API and not in any realtime payload.
create table private.post_removed (
  post_id uuid primary key references public.posts (id) on delete cascade,
  body_original text not null
);

-- ---------- helpers used by RLS and functions ----------

create function private.is_member(p_community uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.community_members m where m.community_id = p_community and m.user_id = auth.uid());
$$;

create function private.is_moderator(p_community uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.communities c where c.id = p_community and c.moderator_id = auth.uid())
     and private.is_member(p_community);
$$;

-- ---------- row-level security: members read their own community only ----------

alter table public.communities enable row level security;
alter table public.community_members enable row level security;
alter table public.posts enable row level security;

create policy communities_member_read on public.communities for select to authenticated using (private.is_member(id));
create policy members_member_read on public.community_members for select to authenticated using (private.is_member(community_id));
create policy posts_member_read on public.posts for select to authenticated using (private.is_member(community_id));

revoke all on public.communities, public.community_members, public.posts from anon, authenticated;
revoke all on private.post_removed from anon, authenticated;
grant select (id, title, description, is_demo, moderator_id, activity_at, created_at) on public.communities to authenticated;
grant select (community_id, user_id, display_name, joined_at) on public.community_members to authenticated;
grant select (id, community_id, parent_id, author_id, author_name, body, kind, hidden_at, edited_at, created_at) on public.posts to authenticated;
grant execute on function private.is_member(uuid), private.is_moderator(uuid) to authenticated;

-- ---------- public join preview: whitelisted fields only, no session needed ----------

create function public.community_preview(p_id uuid)
returns table (id uuid, title text, description text, is_demo boolean, member_count integer)
language sql stable security definer set search_path = '' as $$
  select c.id, c.title, c.description, c.is_demo,
         (select count(*)::integer from public.community_members m where m.community_id = c.id)
  from public.communities c where c.id = p_id;
$$;

-- ---------- writes ----------

create function public.join_community(p_community uuid, p_display_name text)
returns public.community_members
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  name text := private.trim_text(p_display_name);
  result public.community_members;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if char_length(name) not between 1 and 40 or name ~ '[[:cntrl:]]' then raise exception 'invalid_display_name'; end if;
  -- Serializes joins (so the member cap cannot be raced) and leaves the row lock compatible with membership foreign keys.
  perform 1 from public.communities where id = p_community for no key update;
  if not found then raise exception 'community_not_found'; end if;
  if not private.is_member(p_community)
     and (select count(*) from public.community_members where community_id = p_community) >= 500 then
    raise exception 'community_full';
  end if;
  insert into public.community_members (community_id, user_id, display_name) values (p_community, actor, name)
  on conflict (community_id, user_id) do update set display_name = excluded.display_name
  returning * into result;
  update public.communities set activity_at = now() where id = p_community;
  return result;
end $$;

create function public.leave_community(p_community uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  delete from public.community_members where community_id = p_community and user_id = auth.uid();
  if found then update public.communities set activity_at = now() where id = p_community; end if;
end $$;

create function public.create_post(p_community uuid, p_parent uuid, p_body text, p_operation uuid)
returns public.posts
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  text_body text := private.trim_text(p_body);
  member_name text;
  parent public.posts;
  result public.posts;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if p_operation is null then raise exception 'invalid_operation'; end if;
  -- A retried send returns the post it already created.
  select * into result from public.posts where author_id = actor and operation_id = p_operation;
  if found then return result; end if;
  select display_name into member_name from public.community_members where community_id = p_community and user_id = actor;
  if member_name is null then raise exception 'not_member'; end if;
  if char_length(text_body) not between 1 and 2000 then raise exception 'invalid_body'; end if;
  if p_parent is not null then
    select * into parent from public.posts where id = p_parent and community_id = p_community;
    if not found then raise exception 'parent_not_found'; end if;
    if parent.parent_id is not null then raise exception 'reply_depth'; end if;
    if parent.hidden_at is not null then raise exception 'post_hidden'; end if;
  end if;
  if (select count(*) from public.posts where author_id = actor and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited';
  end if;
  insert into public.posts (community_id, parent_id, author_id, author_name, body, operation_id)
  values (p_community, p_parent, actor, member_name, text_body, p_operation)
  on conflict (author_id, operation_id) do nothing
  returning * into result;
  if result.id is null then
    select * into result from public.posts where author_id = actor and operation_id = p_operation;
  end if;
  return result;
end $$;

create function public.edit_post(p_post uuid, p_body text) returns public.posts
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  text_body text := private.trim_text(p_body);
  target public.posts;
  result public.posts;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into target from public.posts where id = p_post for update;
  if not found or not private.is_member(target.community_id) then raise exception 'post_not_found'; end if;
  if target.author_id <> actor then raise exception 'forbidden'; end if;
  if target.hidden_at is not null then raise exception 'post_hidden'; end if;
  if char_length(text_body) not between 1 and 2000 then raise exception 'invalid_body'; end if;
  update public.posts set body = text_body, edited_at = now() where id = p_post returning * into result;
  return result;
end $$;

create function public.hide_post(p_post uuid) returns public.posts
language plpgsql security definer set search_path = '' as $$
declare
  target public.posts;
  result public.posts;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into target from public.posts where id = p_post for update;
  if not found or not private.is_member(target.community_id) then raise exception 'post_not_found'; end if;
  if not private.is_moderator(target.community_id) then raise exception 'forbidden'; end if;
  if target.hidden_at is not null then return target; end if;
  insert into private.post_removed (post_id, body_original) values (p_post, target.body);
  update public.posts set body = '', hidden_at = now(), hidden_by = auth.uid() where id = p_post returning * into result;
  return result;
end $$;

revoke execute on function public.community_preview(uuid), public.join_community(uuid, text), public.leave_community(uuid),
  public.create_post(uuid, uuid, text, uuid), public.edit_post(uuid, text), public.hide_post(uuid) from public, anon;
grant execute on function public.community_preview(uuid) to anon, authenticated;
grant execute on function public.join_community(uuid, text), public.leave_community(uuid),
  public.create_post(uuid, uuid, text, uuid), public.edit_post(uuid, text), public.hide_post(uuid) to authenticated;

alter publication supabase_realtime add table public.posts, public.community_members, public.communities;
