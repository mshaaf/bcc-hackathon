-- B2: shared missions, tasks and atomic claims, mission-scoped posts, plus the confirmed B1 repairs.
-- Applied on top of 20261021120000_community_posts.sql; never edits it.

-- ---------- B1 repair 2: stop publishing membership changes ----------
-- DELETE events carry the primary key, and Realtime does not apply row security to them, so an outsider could read
-- (community_id, user_id) pairs of departed members. Membership changes bump communities.activity_at / missions.activity_at
-- instead (an RLS-checked UPDATE). Every table published below has a single-uuid primary key.
alter publication supabase_realtime drop table public.community_members;

-- ---------- missions, members, tasks ----------

create table public.missions (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  organizer_id uuid not null references auth.users (id) on delete cascade,
  organizer_name text not null check (char_length(organizer_name) between 1 and 40),
  title text not null check (char_length(title) between 1 and 120),
  objective text not null check (char_length(objective) between 1 and 1000),
  location_text text not null check (char_length(location_text) between 1 and 200),
  starts_at timestamptz,
  status text not null default 'planning' check (status in ('planning', 'scheduled', 'in_progress', 'follow_up', 'archived')),
  origin text not null check (origin in ('discussion', 'local_campaign')),
  source_post_id uuid,
  source jsonb,
  evidence jsonb not null default '[]'::jsonb,
  version integer not null default 1,
  operation_id uuid not null,
  activity_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  unique (id, community_id),
  unique (organizer_id, operation_id),
  foreign key (source_post_id, community_id) references public.posts (id, community_id),
  check (jsonb_typeof(evidence) = 'array' and jsonb_array_length(evidence) <= 200 and pg_column_size(evidence) <= 262144),
  check (origin = 'local_campaign' or (jsonb_array_length(evidence) = 0 and source is null))
);
create index missions_community_idx on public.missions (community_id, created_at, id);

create table public.mission_members (
  mission_id uuid not null,
  community_id uuid not null,
  user_id uuid not null references auth.users (id) on delete cascade,
  display_name text not null check (char_length(display_name) between 1 and 40),
  joined_at timestamptz not null default now(),
  primary key (mission_id, user_id),
  foreign key (mission_id, community_id) references public.missions (id, community_id) on delete cascade
);

create table public.mission_tasks (
  id uuid primary key default gen_random_uuid(),
  mission_id uuid not null,
  community_id uuid not null,
  description text not null check (char_length(description) between 1 and 200),
  due_date date,
  position integer not null default 0,
  claimed_by uuid references auth.users (id) on delete set null,
  claimed_name text check (claimed_name is null or char_length(claimed_name) between 1 and 40),
  claimed_at timestamptz,
  done boolean not null default false,
  done_at timestamptz,
  imported boolean not null default false,
  created_at timestamptz not null default now(),
  foreign key (mission_id, community_id) references public.missions (id, community_id) on delete cascade,
  check ((claimed_by is null and claimed_name is null) or claimed_name is not null),
  check (not done or claimed_name is not null)
);
create index mission_tasks_mission_idx on public.mission_tasks (mission_id, position, created_at);

-- ---------- posts: mission scope, update/observation kinds ----------

alter table public.posts
  add column mission_id uuid,
  add column observed_on date,
  add column fictional boolean not null default false,
  add column imported boolean not null default false,
  add constraint posts_mission_fk foreign key (mission_id, community_id) references public.missions (id, community_id) on delete cascade,
  add constraint posts_observation_shape check ((kind = 'observation') = (observed_on is not null)),
  add constraint posts_flags_shape check ((not fictional and not imported) or kind = 'observation');
create index posts_mission_idx on public.posts (mission_id, created_at, id);

-- ---------- row security: community members read, nobody writes directly ----------

alter table public.missions enable row level security;
alter table public.mission_members enable row level security;
alter table public.mission_tasks enable row level security;
create policy missions_member_read on public.missions for select to authenticated using (private.is_member(community_id));
create policy mission_members_member_read on public.mission_members for select to authenticated using (private.is_member(community_id));
create policy mission_tasks_member_read on public.mission_tasks for select to authenticated using (private.is_member(community_id));
revoke all on public.missions, public.mission_members, public.mission_tasks from anon, authenticated;
grant select on public.missions, public.mission_members, public.mission_tasks to authenticated;
grant select (mission_id, observed_on, fictional, imported) on public.posts to authenticated;

-- ---------- helpers ----------

create function private.is_organizer(p_mission uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.missions m where m.id = p_mission and m.organizer_id = auth.uid());
$$;
grant execute on function private.is_organizer(uuid) to authenticated;

-- A bounded, validated task list from client JSON: [{description, due?}]
create function private.clean_tasks(p_tasks jsonb) returns table (description text, due_date date)
language plpgsql immutable set search_path = '' as $$
declare item jsonb; d text; due text;
begin
  if p_tasks is null or p_tasks = 'null'::jsonb then return; end if;
  if jsonb_typeof(p_tasks) <> 'array' or jsonb_array_length(p_tasks) > 30 then raise exception 'invalid_tasks'; end if;
  for item in select * from jsonb_array_elements(p_tasks) loop
    if jsonb_typeof(item) <> 'object' or jsonb_typeof(item -> 'description') is distinct from 'string' then raise exception 'invalid_tasks'; end if;
    d := private.trim_text(item ->> 'description');
    if char_length(d) not between 1 and 200 then raise exception 'invalid_tasks'; end if;
    due := nullif(item ->> 'due', '');
    if due is not null then
      begin
        if to_char(due::date, 'YYYY-MM-DD') <> due then raise exception 'invalid_tasks'; end if;
      exception when others then raise exception 'invalid_tasks';
      end;
    end if;
    description := d; due_date := due::date;
    return next;
  end loop;
end $$;

-- ---------- posts: replace create_post (B1 repair 3 + mission scope) ----------

drop function public.create_post(uuid, uuid, text, uuid);

create function public.create_post(
  p_community uuid, p_parent uuid, p_body text, p_operation uuid,
  p_mission uuid default null, p_kind text default 'discussion', p_observed_on date default null, p_fictional boolean default false
) returns public.posts
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  text_body text := private.trim_text(p_body);
  member_name text;
  existing public.posts;
  parent public.posts;
  mission public.missions;
  result public.posts;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if p_operation is null then raise exception 'invalid_operation'; end if;
  -- Authorize first: a departed member cannot replay an old operation to read its post back.
  select display_name into member_name from public.community_members where community_id = p_community and user_id = actor;
  if member_name is null then raise exception 'not_member'; end if;
  select * into existing from public.posts where author_id = actor and operation_id = p_operation;
  if found then
    if existing.community_id <> p_community or existing.mission_id is distinct from p_mission or existing.parent_id is distinct from p_parent then
      raise exception 'operation_conflict';
    end if;
    return existing;
  end if;
  if char_length(text_body) not between 1 and 2000 then raise exception 'invalid_body'; end if;
  if p_kind not in ('discussion', 'update', 'observation') then raise exception 'invalid_kind'; end if;
  if (p_kind = 'observation') <> (p_observed_on is not null) then raise exception 'invalid_kind'; end if;
  if p_fictional and p_kind <> 'observation' then raise exception 'invalid_kind'; end if;
  if p_kind <> 'discussion' and (p_mission is null or p_parent is not null) then raise exception 'invalid_kind'; end if;
  if p_mission is not null then
    select * into mission from public.missions where id = p_mission and community_id = p_community;
    if not found then raise exception 'mission_not_found'; end if;
    if mission.status = 'archived' then raise exception 'mission_archived'; end if;
    if p_kind <> 'discussion' and not exists (select 1 from public.mission_members mm where mm.mission_id = p_mission and mm.user_id = actor) then
      raise exception 'not_mission_member';
    end if;
  end if;
  if p_parent is not null then
    select * into parent from public.posts where id = p_parent and community_id = p_community;
    if not found or parent.mission_id is distinct from p_mission then raise exception 'parent_not_found'; end if;
    if parent.parent_id is not null then raise exception 'reply_depth'; end if;
    if parent.hidden_at is not null then raise exception 'post_hidden'; end if;
  end if;
  if (select count(*) from public.posts where author_id = actor and created_at > now() - interval '1 minute') >= 20 then
    raise exception 'rate_limited';
  end if;
  insert into public.posts (community_id, mission_id, parent_id, author_id, author_name, body, kind, observed_on, fictional, operation_id)
  values (p_community, p_mission, p_parent, actor, member_name, text_body, p_kind, p_observed_on, p_fictional, p_operation)
  on conflict (author_id, operation_id) do nothing
  returning * into result;
  if result.id is null then
    select * into result from public.posts where author_id = actor and operation_id = p_operation;
  end if;
  return result;
end $$;

revoke execute on function public.create_post(uuid, uuid, text, uuid, uuid, text, date, boolean) from public, anon;
grant execute on function public.create_post(uuid, uuid, text, uuid, uuid, text, date, boolean) to authenticated;

-- hide_post: the community moderator, or the organizer for posts in their mission
create or replace function public.hide_post(p_post uuid) returns public.posts
language plpgsql security definer set search_path = '' as $$
declare
  target public.posts;
  result public.posts;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into target from public.posts where id = p_post for update;
  if not found or not private.is_member(target.community_id) then raise exception 'post_not_found'; end if;
  if not (private.is_moderator(target.community_id) or (target.mission_id is not null and private.is_organizer(target.mission_id))) then
    raise exception 'forbidden';
  end if;
  if target.hidden_at is not null then return target; end if;
  insert into private.post_removed (post_id, body_original) values (p_post, target.body);
  update public.posts set body = '', hidden_at = now(), hidden_by = auth.uid() where id = p_post returning * into result;
  return result;
end $$;

-- ---------- missions ----------

create function public.create_mission(
  p_community uuid, p_title text, p_objective text, p_location text, p_starts_at timestamptz, p_source_post uuid,
  p_origin text, p_source jsonb, p_evidence jsonb, p_tasks jsonb, p_observations jsonb, p_operation uuid
) returns public.missions
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  member_name text;
  existing public.missions;
  mission public.missions;
  title text := private.trim_text(p_title);
  objective text := private.trim_text(p_objective);
  location text := private.trim_text(p_location);
  evidence jsonb := coalesce(p_evidence, '[]'::jsonb);
  item jsonb;
  obs_text text;
  obs_date text;
  position integer := 0;
  task record;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if p_operation is null then raise exception 'invalid_operation'; end if;
  select display_name into member_name from public.community_members where community_id = p_community and user_id = actor;
  if member_name is null then raise exception 'not_member'; end if;
  select * into existing from public.missions where organizer_id = actor and operation_id = p_operation;
  if found then
    if existing.community_id <> p_community then raise exception 'operation_conflict'; end if;
    return existing;
  end if;
  if char_length(title) not between 1 and 120 then raise exception 'invalid_title'; end if;
  if char_length(objective) not between 1 and 1000 then raise exception 'invalid_objective'; end if;
  if char_length(location) not between 1 and 200 then raise exception 'invalid_location'; end if;
  if p_origin not in ('discussion', 'local_campaign') then raise exception 'invalid_origin'; end if;
  if p_source_post is not null and not exists (select 1 from public.posts where id = p_source_post and community_id = p_community and mission_id is null) then
    raise exception 'source_post_not_found';
  end if;
  if p_origin = 'discussion' then
    if jsonb_array_length(evidence) <> 0 or p_source is not null or (p_observations is not null and p_observations <> 'null'::jsonb and jsonb_array_length(p_observations) <> 0) then
      raise exception 'invalid_origin';
    end if;
  else
    if jsonb_typeof(evidence) <> 'array' or jsonb_array_length(evidence) not between 1 and 200 then raise exception 'invalid_evidence'; end if;
    if p_source is null or jsonb_typeof(p_source) <> 'object' or (p_source ->> 'mode') not in ('live', 'recorded', 'demo') then raise exception 'invalid_evidence'; end if;
    for item in select * from jsonb_array_elements(evidence) loop
      if jsonb_typeof(item) <> 'object' or jsonb_typeof(item -> 'key') is distinct from 'string' then raise exception 'invalid_evidence'; end if;
    end loop;
  end if;
  insert into public.missions (community_id, organizer_id, organizer_name, title, objective, location_text, starts_at, origin, source_post_id, source, evidence, operation_id)
  values (p_community, actor, member_name, title, objective, location, p_starts_at, p_origin, p_source_post, p_source, evidence, p_operation)
  returning * into mission;
  insert into public.mission_members (mission_id, community_id, user_id, display_name) values (mission.id, p_community, actor, member_name);
  for task in select * from private.clean_tasks(p_tasks) loop
    position := position + 1;
    insert into public.mission_tasks (mission_id, community_id, description, due_date, position, imported)
    values (mission.id, p_community, task.description, task.due_date, position, p_origin = 'local_campaign');
  end loop;
  if p_origin = 'local_campaign' and p_observations is not null and jsonb_typeof(p_observations) = 'array' then
    if jsonb_array_length(p_observations) > 50 then raise exception 'invalid_observations'; end if;
    for item in select * from jsonb_array_elements(p_observations) loop
      obs_text := private.trim_text(item ->> 'text');
      obs_date := item ->> 'date';
      if char_length(obs_text) not between 1 and 2000 or obs_date is null then raise exception 'invalid_observations'; end if;
      begin
        if to_char(obs_date::date, 'YYYY-MM-DD') <> obs_date then raise exception 'invalid_observations'; end if;
      exception when others then raise exception 'invalid_observations';
      end;
      insert into public.posts (community_id, mission_id, author_id, author_name, body, kind, observed_on, fictional, imported, operation_id)
      values (p_community, mission.id, actor, member_name, obs_text, 'observation', obs_date::date, coalesce((item ->> 'fictional')::boolean, false), true, gen_random_uuid());
    end loop;
  end if;
  return mission;
end $$;

create function public.update_mission(p_mission uuid, p_expected_version integer, p_changes jsonb) returns public.missions
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  mission public.missions;
  key text;
  v text;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into mission from public.missions where id = p_mission for update;
  if not found or not private.is_member(mission.community_id) then raise exception 'mission_not_found'; end if;
  if mission.organizer_id <> actor then raise exception 'forbidden'; end if;
  if p_changes is null or jsonb_typeof(p_changes) <> 'object' then raise exception 'invalid_changes'; end if;
  if mission.version <> p_expected_version then raise exception 'version_conflict'; end if;
  for key in select jsonb_object_keys(p_changes) loop
    if key not in ('title', 'objective', 'location', 'starts_at', 'status') then raise exception 'invalid_changes'; end if;
  end loop;
  if p_changes ? 'title' then
    v := private.trim_text(p_changes ->> 'title');
    if char_length(v) not between 1 and 120 then raise exception 'invalid_title'; end if;
    mission.title := v;
  end if;
  if p_changes ? 'objective' then
    v := private.trim_text(p_changes ->> 'objective');
    if char_length(v) not between 1 and 1000 then raise exception 'invalid_objective'; end if;
    mission.objective := v;
  end if;
  if p_changes ? 'location' then
    v := private.trim_text(p_changes ->> 'location');
    if char_length(v) not between 1 and 200 then raise exception 'invalid_location'; end if;
    mission.location_text := v;
  end if;
  if p_changes ? 'starts_at' then
    mission.starts_at := nullif(p_changes ->> 'starts_at', '')::timestamptz;
  end if;
  if p_changes ? 'status' then
    if (p_changes ->> 'status') not in ('planning', 'scheduled', 'in_progress', 'follow_up', 'archived') then raise exception 'invalid_status'; end if;
    mission.status := p_changes ->> 'status';
  end if;
  update public.missions
     set title = mission.title, objective = mission.objective, location_text = mission.location_text, starts_at = mission.starts_at,
         status = mission.status, version = version + 1, activity_at = now()
   where id = p_mission returning * into mission;
  return mission;
end $$;

create function public.join_mission(p_mission uuid) returns public.mission_members
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  mission public.missions;
  name text;
  result public.mission_members;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into mission from public.missions where id = p_mission for no key update;
  if not found then raise exception 'mission_not_found'; end if;
  select display_name into name from public.community_members where community_id = mission.community_id and user_id = actor;
  if name is null then raise exception 'not_member'; end if;
  select * into result from public.mission_members where mission_id = p_mission and user_id = actor;
  if found then return result; end if;
  if mission.status = 'archived' then raise exception 'mission_archived'; end if;
  insert into public.mission_members (mission_id, community_id, user_id, display_name) values (p_mission, mission.community_id, actor, name) returning * into result;
  update public.missions set activity_at = now() where id = p_mission;
  return result;
end $$;

-- Leaving removes the membership first (taking its row lock, which a concurrent claim also needs), then releases
-- unfinished claims. Finished jobs keep their attribution.
create function public.leave_mission(p_mission uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  mission public.missions;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into mission from public.missions where id = p_mission for no key update;
  if not found or not private.is_member(mission.community_id) then raise exception 'mission_not_found'; end if;
  if mission.organizer_id = actor and mission.status <> 'archived' then raise exception 'organizer_active'; end if;
  delete from public.mission_members where mission_id = p_mission and user_id = actor;
  if found then
    update public.mission_tasks set claimed_by = null, claimed_name = null, claimed_at = null
     where mission_id = p_mission and claimed_by = actor and not done;
    update public.missions set activity_at = now() where id = p_mission;
  end if;
end $$;

create function public.add_task(p_mission uuid, p_description text, p_due text default null) returns public.mission_tasks
language plpgsql security definer set search_path = '' as $$
declare
  mission public.missions;
  task record;
  result public.mission_tasks;
begin
  if auth.uid() is null then raise exception 'not_authenticated'; end if;
  select * into mission from public.missions where id = p_mission for update;
  if not found or not private.is_member(mission.community_id) then raise exception 'mission_not_found'; end if;
  if mission.organizer_id <> auth.uid() then raise exception 'forbidden'; end if;
  if mission.status = 'archived' then raise exception 'mission_archived'; end if;
  if (select count(*) from public.mission_tasks where mission_id = p_mission) >= 30 then raise exception 'too_many_tasks'; end if;
  select * into task from private.clean_tasks(jsonb_build_array(jsonb_build_object('description', p_description, 'due', p_due)));
  insert into public.mission_tasks (mission_id, community_id, description, due_date, position)
  values (p_mission, mission.community_id, task.description, task.due_date, coalesce((select max(position) from public.mission_tasks where mission_id = p_mission), 0) + 1)
  returning * into result;
  return result;
end $$;

-- Exactly one claimant wins: the task row is locked, and the claimant's mission-membership row is locked
-- FOR SHARE so a concurrent leave cannot slip between the membership check and the claim.
create function public.claim_task(p_task uuid) returns public.mission_tasks
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  task public.mission_tasks;
  mission public.missions;
  name text;
  result public.mission_tasks;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into task from public.mission_tasks where id = p_task;
  if not found or not private.is_member(task.community_id) then raise exception 'task_not_found'; end if;
  select display_name into name from public.mission_members where mission_id = task.mission_id and user_id = actor for share;
  if name is null then raise exception 'not_mission_member'; end if;
  select * into task from public.mission_tasks where id = p_task for update;
  if task.claimed_by = actor then return task; end if;
  if task.claimed_by is not null or task.claimed_name is not null then raise exception 'already_claimed'; end if;
  select * into mission from public.missions where id = task.mission_id;
  if mission.status = 'archived' then raise exception 'mission_archived'; end if;
  update public.mission_tasks set claimed_by = actor, claimed_name = name, claimed_at = now() where id = p_task returning * into result;
  return result;
end $$;

create function public.release_task(p_task uuid) returns public.mission_tasks
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  task public.mission_tasks;
  result public.mission_tasks;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into task from public.mission_tasks where id = p_task for update;
  if not found or not private.is_member(task.community_id) then raise exception 'task_not_found'; end if;
  if task.claimed_name is null then return task; end if;
  if task.claimed_by is distinct from actor and not private.is_organizer(task.mission_id) then raise exception 'forbidden'; end if;
  if task.done then raise exception 'task_done'; end if;
  update public.mission_tasks set claimed_by = null, claimed_name = null, claimed_at = null where id = p_task returning * into result;
  return result;
end $$;

create function public.set_task_done(p_task uuid, p_done boolean) returns public.mission_tasks
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  task public.mission_tasks;
  result public.mission_tasks;
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into task from public.mission_tasks where id = p_task for update;
  if not found or not private.is_member(task.community_id) then raise exception 'task_not_found'; end if;
  if task.claimed_name is null then raise exception 'not_claimed'; end if;
  if task.claimed_by is distinct from actor and not private.is_organizer(task.mission_id) then raise exception 'forbidden'; end if;
  update public.mission_tasks set done = coalesce(p_done, false), done_at = case when coalesce(p_done, false) then now() else null end where id = p_task returning * into result;
  return result;
end $$;

-- leave_community also leaves missions atomically (B2): organizers of active missions must archive first.
create or replace function public.leave_community(p_community uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare actor uuid := auth.uid();
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  if exists (select 1 from public.missions where community_id = p_community and organizer_id = actor and status <> 'archived') then
    raise exception 'organizer_active';
  end if;
  delete from public.mission_members where community_id = p_community and user_id = actor;
  update public.mission_tasks set claimed_by = null, claimed_name = null, claimed_at = null
   where community_id = p_community and claimed_by = actor and not done;
  delete from public.community_members where community_id = p_community and user_id = actor;
  if found then
    update public.missions set activity_at = now() where community_id = p_community;
    update public.communities set activity_at = now() where id = p_community;
  end if;
end $$;

revoke execute on function
  public.create_mission(uuid, text, text, text, timestamptz, uuid, text, jsonb, jsonb, jsonb, jsonb, uuid),
  public.update_mission(uuid, integer, jsonb), public.join_mission(uuid), public.leave_mission(uuid),
  public.add_task(uuid, text, text), public.claim_task(uuid), public.release_task(uuid), public.set_task_done(uuid, boolean),
  private.clean_tasks(jsonb)
  from public, anon;
grant execute on function
  public.create_mission(uuid, text, text, text, timestamptz, uuid, text, jsonb, jsonb, jsonb, jsonb, uuid),
  public.update_mission(uuid, integer, jsonb), public.join_mission(uuid), public.leave_mission(uuid),
  public.add_task(uuid, text, text), public.claim_task(uuid), public.release_task(uuid), public.set_task_done(uuid, boolean)
  to authenticated;

alter publication supabase_realtime add table public.missions, public.mission_tasks;
