begin;

-- Candidate videos stay private until the user confirms their final selection.
create table public.deskbub_animation_collections (
  user_id text primary key,
  status text not null default 'draft' check(status in ('draft','finalized')),
  videos jsonb not null default '[]' check(jsonb_typeof(videos)='array'),
  updated_at timestamptz not null default now()
);
alter table public.deskbub_animation_collections enable row level security;
revoke all on public.deskbub_animation_collections from public,anon,authenticated;
grant all on public.deskbub_animation_collections to service_role;

alter function public.deskbub_start_generation(text,uuid,text,text,jsonb) rename to deskbub_start_generation_core;
revoke all on function public.deskbub_start_generation_core(text,uuid,text,text,jsonb) from service_role;
create function public.deskbub_start_generation(p_user_id text,p_id uuid,p_kind text,p_fingerprint text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
begin
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  -- Existing task IDs remain readable after confirmation; new tasks are blocked.
  if not exists(select 1 from deskbub_animation_jobs where id=p_id) then
    if exists(select 1 from deskbub_animation_collections where user_id=p_user_id and status='finalized')
      or (exists(select 1 from pet_data where user_id=p_user_id)
          and not exists(select 1 from deskbub_animation_collections where user_id=p_user_id))
    then raise exception 'Your selection is already locked'; end if;
  end if;
  return deskbub_start_generation_core(p_user_id,p_id,p_kind,p_fingerprint,p_payload);
end;
$$;

-- Reserve every selected action before running any model. All or nothing.
create function public.deskbub_start_animation_batch(p_user_id text,p_requests jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare r jsonb; result jsonb:='[]';
begin
  if jsonb_typeof(p_requests) is distinct from 'array' then raise exception 'Invalid batch'; end if;
  if jsonb_array_length(p_requests) not between 1 and 5 then raise exception 'Invalid batch size'; end if;
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  for r in select value from jsonb_array_elements(p_requests) loop
    result:=result||jsonb_build_array(deskbub_start_generation(p_user_id,(r->>'id')::uuid,'video',r->>'fingerprint',r->'payload'));
  end loop;
  return result;
end;
$$;

alter function public.deskbub_save_generation(text,uuid,uuid,jsonb,text,jsonb,boolean) rename to deskbub_save_generation_core;
revoke all on function public.deskbub_save_generation_core(text,uuid,uuid,jsonb,text,jsonb,boolean) from service_role;
create function public.deskbub_save_generation(p_user_id text,p_id uuid,p_token uuid,p_state jsonb,p_status text,p_result jsonb,p_release boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare saved jsonb; collection deskbub_animation_collections;
begin
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  saved:=deskbub_save_generation_core(p_user_id,p_id,p_token,p_state,p_status,p_result,p_release);
  if saved->>'kind'='video' and saved->>'status'='succeeded' then
    -- Preserve historical locked work; never silently turn it back into a draft.
    if exists(select 1 from pet_data where user_id=p_user_id)
      and not exists(select 1 from deskbub_animation_collections where user_id=p_user_id) then return saved; end if;
    insert into deskbub_animation_collections(user_id) values(p_user_id) on conflict do nothing;
    select * into collection from deskbub_animation_collections where user_id=p_user_id for update;
    if collection.status='finalized' then return saved; end if;
    if not exists(select 1 from jsonb_array_elements(collection.videos) v where v->>'url'=saved->'result'->>'videoUrl') then
      update deskbub_animation_collections set videos=videos||jsonb_build_array(jsonb_build_object(
        'url',saved->'result'->>'videoUrl','label',saved->'result'->>'actionLabel')),updated_at=now() where user_id=p_user_id;
    end if;
  end if;
  return saved;
end;
$$;

create function public.deskbub_confirm_animation_selection(p_user_id text,p_pairing_code text,p_videos jsonb,p_finalize boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare collection deskbub_animation_collections; limit_count integer; prior jsonb;
begin
  if p_pairing_code is null or p_pairing_code !~ '^[0-9]{6}$' or p_finalize is null
    or jsonb_typeof(p_videos) is distinct from 'array' then raise exception 'Invalid selection'; end if;
  if jsonb_array_length(p_videos)>8 then raise exception 'Too many videos'; end if;
  if exists(select 1 from jsonb_array_elements(p_videos) v where jsonb_typeof(v->'url') is distinct from 'string')
    or (select count(*) from jsonb_array_elements(p_videos))<>(select count(distinct v->>'url') from jsonb_array_elements(p_videos) v)
    then raise exception 'Invalid or duplicate videos'; end if;
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  select * into collection from deskbub_animation_collections where user_id=p_user_id for update;
  if not found then
    select coalesce(jsonb_agg(jsonb_build_object('url',video_url,'label',action_label)),'[]') into prior from pet_data where user_id=p_user_id and video_url is not null;
    if jsonb_array_length(prior)>0 and p_finalize and jsonb_array_length(prior)=jsonb_array_length(p_videos)
      and not exists(select 1 from jsonb_array_elements(p_videos) v where not exists(select 1 from jsonb_array_elements(prior) x where x->>'url'=v->>'url'))
      then return jsonb_build_object('status','finalized','videos',prior); end if;
    raise exception 'Selection unavailable';
  end if;
  if collection.status='finalized' then
    if p_finalize and jsonb_array_length(collection.videos)=jsonb_array_length(p_videos)
      and not exists(select 1 from jsonb_array_elements(p_videos) v where not exists(select 1 from jsonb_array_elements(collection.videos) x where x->>'url'=v->>'url')) then return to_jsonb(collection); end if;
    raise exception 'Your selection is already locked';
  end if;
  if exists(select 1 from jsonb_array_elements(p_videos) v where not exists(select 1 from jsonb_array_elements(collection.videos) x where x->>'url'=v->>'url'))
    then raise exception 'Video does not belong to this account'; end if;
  if not p_finalize then return to_jsonb(collection); end if;
  if exists(select 1 from deskbub_animation_jobs where user_id=p_user_id and kind='video' and reserved_credit)
    then raise exception 'Wait for the saved generation tasks to finish'; end if;
  select case when tier='basic' then 1 else 5 end into limit_count from subscriptions where user_id=p_user_id and tier in ('basic','plus');
  if limit_count is null or jsonb_array_length(p_videos) not between 1 and limit_count then raise exception 'Invalid final selection size'; end if;
  delete from pet_data where user_id=p_user_id;
  insert into pet_data(user_id,pairing_code,video_url,action_label,processed_url)
    select p_user_id,p_pairing_code,v->>'url',coalesce(v->>'label',''),'' from jsonb_array_elements(p_videos) v;
  update deskbub_animation_collections set status='finalized',videos=p_videos,updated_at=now() where user_id=p_user_id returning * into collection;
  return to_jsonb(collection);
end;
$$;

do $$ declare f record; begin
  for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace
    and proname in ('deskbub_start_generation','deskbub_start_animation_batch','deskbub_save_generation','deskbub_confirm_animation_selection') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
