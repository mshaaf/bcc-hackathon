-- B3 repairs from the independent B2 review.
--
-- 1. create_mission now validates every field of every shared evidence record, so a malformed record written by one member's
--    client can never reach another member's browser (the read side is also tolerant; this is the write boundary).
-- 2. set_task_done keeps the membership/assignment invariant when work is reopened: a job can only be unfinished while its
--    claimant is still a mission member. Reopening a departed claimant's finished job returns it to the open pool.
--
-- Forward-only: no existing row is changed. Rows written before this migration are handled by the tolerant read normalizer.

-- ---------- 1. evidence validation ----------

-- true when `item -> field` is absent, JSON null, or one of the allowed JSON types
create function private.json_field_is(item jsonb, field text, kinds text[]) returns boolean
language sql immutable set search_path = '' as $$
  select coalesce(jsonb_typeof(item -> field) = any (array_append(kinds, 'null')), true);
$$;

-- true when `item -> field` is absent/null or a string of at most `max_chars` characters
create function private.json_text_ok(item jsonb, field text, max_chars integer) returns boolean
language sql immutable set search_path = '' as $$
  select private.json_field_is(item, field, array['string'])
     and coalesce(char_length(item ->> field) <= max_chars, true);
$$;

create function private.valid_evidence_item(item jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(item) is distinct from 'object' then return false; end if;
  if jsonb_typeof(item -> 'key') is distinct from 'string' or char_length(item ->> 'key') not between 1 and 200 then return false; end if;
  -- request id / object id / date may be text or a number in the city's data; never an object, array or boolean
  if not private.json_field_is(item, 'id', array['string', 'number']) or coalesce(char_length(item ->> 'id') > 100, false) then return false; end if;
  if not private.json_field_is(item, 'objectId', array['string', 'number']) or coalesce(char_length(item ->> 'objectId') > 100, false) then return false; end if;
  if not private.json_field_is(item, 'date', array['string', 'number']) or coalesce(char_length(item ->> 'date') > 100, false) then return false; end if;
  if not (private.json_text_ok(item, 'category', 300) and private.json_text_ok(item, 'address', 500) and private.json_text_ok(item, 'status', 200)
          and private.json_text_ok(item, 'agency', 300) and private.json_text_ok(item, 'ward', 100) and private.json_text_ok(item, 'previousStatus', 200)) then return false; end if;
  if not private.json_field_is(item, 'outsideWard', array['boolean']) or not private.json_field_is(item, 'changedSinceReview', array['boolean']) then return false; end if;
  if not private.json_field_is(item, 'geo', array['object']) then return false; end if;
  if jsonb_typeof(item -> 'geo') = 'object' and not (coalesce(jsonb_typeof(item -> 'geo' -> 'lat') = 'number', false) and coalesce(jsonb_typeof(item -> 'geo' -> 'lon') = 'number', false)) then return false; end if;
  return true;
end $$;

create function private.valid_source(source jsonb) returns boolean
language plpgsql immutable set search_path = '' as $$
begin
  if jsonb_typeof(source) is distinct from 'object' then return false; end if;
  if source ->> 'mode' is null or (source ->> 'mode') not in ('live', 'recorded', 'demo') then return false; end if;
  if not (private.json_text_ok(source, 'sourceUrl', 1000) and private.json_text_ok(source, 'retrievedAt', 100)
          and private.json_text_ok(source, 'campaignName', 300) and private.json_text_ok(source, 'reviewedAt', 100)) then return false; end if;
  if not private.json_field_is(source, 'radiusM', array['number']) or not private.json_field_is(source, 'window', array['object']) then return false; end if;
  if jsonb_typeof(source -> 'window') = 'object' and not (private.json_text_ok(source -> 'window', 'start', 100) and private.json_text_ok(source -> 'window', 'endExclusive', 100)) then return false; end if;
  return true;
end $$;

-- Same body as 20261021230000_import_order.sql except for the evidence/source/observation validation.
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
  -- lengths are NULL for anything that is not a JSON array (CASE guarantees jsonb_array_length never sees a non-array)
  evidence_len integer := case when jsonb_typeof(coalesce(p_evidence, '[]'::jsonb)) = 'array' then jsonb_array_length(coalesce(p_evidence, '[]'::jsonb)) end;
  observations_len integer := case when jsonb_typeof(p_observations) = 'array' then jsonb_array_length(p_observations) end;
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
    if evidence_len is null or evidence_len <> 0 or p_source is not null
       or (p_observations is not null and p_observations <> 'null'::jsonb and (observations_len is null or observations_len <> 0)) then
      raise exception 'invalid_origin';
    end if;
  else
    if evidence_len is null or evidence_len not between 1 and 200 then raise exception 'invalid_evidence'; end if;
    if not private.valid_source(p_source) then raise exception 'invalid_evidence'; end if;
    -- the table's own check caps the stored size at 262,144 bytes; report it as invalid evidence instead of a raw constraint error
    if octet_length(evidence::text) > 262144 then raise exception 'invalid_evidence'; end if;
    for item in select * from jsonb_array_elements(evidence) loop
      if not private.valid_evidence_item(item) then raise exception 'invalid_evidence'; end if;
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
  if p_origin = 'local_campaign' and p_observations is not null and p_observations <> 'null'::jsonb then
    if observations_len is null or observations_len > 50 then raise exception 'invalid_observations'; end if;
    for item in select * from jsonb_array_elements(p_observations) loop
      if jsonb_typeof(item) is distinct from 'object' or jsonb_typeof(item -> 'text') is distinct from 'string' or jsonb_typeof(item -> 'date') is distinct from 'string'
         or not private.json_field_is(item, 'fictional', array['boolean']) then
        raise exception 'invalid_observations';
      end if;
      obs_text := private.trim_text(item ->> 'text');
      obs_date := item ->> 'date';
      if char_length(obs_text) not between 1 and 2000 then raise exception 'invalid_observations'; end if;
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

-- ---------- 2. reopening keeps the membership/assignment invariant ----------

-- Lock order matches claim_task and leave_mission (membership rows before the task row), so none of them can deadlock:
--   * a non-organizer actor must still belong to the mission (a departed claimant cannot touch a job any more);
--   * reopening a finished job whose claimant has left returns it to the open pool instead of leaving it assigned to a non-member.
-- Finished jobs keep their attribution while they stay finished.
create or replace function public.set_task_done(p_task uuid, p_done boolean) returns public.mission_tasks
language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  task public.mission_tasks;
  result public.mission_tasks;
  organizer boolean;
  claimant_present boolean := false;
  claimant uuid;
  reopening boolean := not coalesce(p_done, false);
begin
  if actor is null then raise exception 'not_authenticated'; end if;
  select * into task from public.mission_tasks where id = p_task;
  if not found or not private.is_member(task.community_id) then raise exception 'task_not_found'; end if;
  if task.claimed_name is null then raise exception 'not_claimed'; end if;
  organizer := private.is_organizer(task.mission_id);
  if task.claimed_by is distinct from actor and not organizer then raise exception 'forbidden'; end if;
  -- membership rows first (shared locks; a concurrent leave holds its row exclusively until it commits)
  if not organizer then
    perform 1 from public.mission_members where mission_id = task.mission_id and user_id = actor for share;
    if not found then raise exception 'not_mission_member'; end if;
  end if;
  claimant := task.claimed_by;
  if claimant is not null then
    perform 1 from public.mission_members where mission_id = task.mission_id and user_id = claimant for share;
    claimant_present := found;
  end if;
  select * into task from public.mission_tasks where id = p_task for update;
  if task.claimed_name is null then raise exception 'not_claimed'; end if;
  -- the job was released and claimed by someone else while we waited: authorization above was for the old claimant
  if task.claimed_by is distinct from claimant then raise exception 'task_changed'; end if;
  if task.done and not reopening then return task; end if;
  if reopening and task.done and not claimant_present then
    -- the claimant left after finishing: the job is open again, with no assignee
    update public.mission_tasks set done = false, done_at = null, claimed_by = null, claimed_name = null, claimed_at = null where id = p_task returning * into result;
  elsif not reopening and task.claimed_by is not null and not claimant_present then
    -- cannot happen while leave releases unfinished claims; refuse rather than finish a job nobody holds
    raise exception 'not_claimed';
  else
    update public.mission_tasks set done = not reopening, done_at = case when not reopening then now() else null end where id = p_task returning * into result;
  end if;
  return result;
end $$;

revoke execute on function private.json_field_is(jsonb, text, text[]), private.json_text_ok(jsonb, text, integer), private.valid_evidence_item(jsonb), private.valid_source(jsonb) from public, anon, authenticated;
