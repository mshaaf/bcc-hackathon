-- With community_members no longer published (B1 repair), a join must announce itself like a leave does:
-- bump communities.activity_at so members receive an RLS-checked UPDATE event and re-fetch the member list.
create or replace function public.join_community(p_community uuid, p_display_name text)
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
