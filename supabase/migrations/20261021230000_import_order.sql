-- Imported observations get distinct, increasing created_at values (now() is constant within a transaction), so the
-- organizer's order survives the (created_at, id) sort instead of falling back to random ids.
create or replace function public.create_mission(
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
      insert into public.posts (community_id, mission_id, author_id, author_name, body, kind, observed_on, fictional, imported, operation_id, created_at)
      values (p_community, mission.id, actor, member_name, obs_text, 'observation', obs_date::date, coalesce((item ->> 'fictional')::boolean, false), true, gen_random_uuid(), clock_timestamp());
    end loop;
  end if;
  return mission;
end $$;
