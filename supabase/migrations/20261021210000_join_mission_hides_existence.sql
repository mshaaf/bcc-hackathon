-- A non-member must not learn whether a mission id exists: report "mission_not_found" for both cases.
create or replace function public.join_mission(p_mission uuid) returns public.mission_members
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
  if name is null then raise exception 'mission_not_found'; end if;
  select * into result from public.mission_members where mission_id = p_mission and user_id = actor;
  if found then return result; end if;
  if mission.status = 'archived' then raise exception 'mission_archived'; end if;
  insert into public.mission_members (mission_id, community_id, user_id, display_name) values (p_mission, mission.community_id, actor, name) returning * into result;
  update public.missions set activity_at = now() where id = p_mission;
  return result;
end $$;
