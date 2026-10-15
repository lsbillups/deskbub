begin;

create table public.deskbub_animation_jobs (
  id uuid primary key,
  user_id text not null,
  kind text not null check (kind in ('image','video')),
  fingerprint text not null check (fingerprint ~ '^[0-9a-f]{64}$'),
  payload jsonb not null,
  state jsonb not null default '{"phase":"new"}',
  status text not null default 'pending' check (status in ('pending','succeeded','failed','uncertain')),
  reserved_credit boolean not null default false,
  result jsonb,
  acknowledged_at timestamptz,
  lease_token uuid,
  lease_until timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deskbub_animation_jobs_pending on public.deskbub_animation_jobs(user_id) where reserved_credit;
alter table public.deskbub_animation_jobs enable row level security;
revoke all on public.deskbub_animation_jobs from public, anon, authenticated;
grant all on public.deskbub_animation_jobs to service_role;

-- The same account lock is shared by start/finish: pending work reserves capacity,
-- and only the first successful finish consumes one generation.
create function public.deskbub_start_generation(p_user_id text,p_id uuid,p_kind text,p_fingerprint text,p_payload jsonb)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j deskbub_animation_jobs; s subscriptions; pending integer;
begin
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  select * into j from deskbub_animation_jobs where id=p_id;
  if found then
    if j.user_id<>p_user_id then raise exception 'Job belongs to another account'; end if;
    if j.kind<>p_kind or j.fingerprint<>p_fingerprint then raise exception 'Job request changed'; end if;
    return to_jsonb(j);
  end if;
  select * into s from subscriptions where user_id=p_user_id for update;
  if not found or s.tier not in ('basic','plus') then raise exception 'No generation allowance'; end if;
  if p_kind='video' then
    if s.tier='basic' and (p_payload->>'action_index')::integer<>0 then raise exception 'Basic default action only'; end if;
    select count(*) into pending from deskbub_animation_jobs where user_id=p_user_id and reserved_credit;
    if coalesce(s.generations_used,0)+pending>=coalesce(s.max_generations,0) then raise exception 'No generations remaining'; end if;
  end if;
  insert into deskbub_animation_jobs(id,user_id,kind,fingerprint,payload,reserved_credit)
    values(p_id,p_user_id,p_kind,p_fingerprint,p_payload,p_kind='video') returning * into j;
  return to_jsonb(j);
end;
$$;

create function public.deskbub_lease_generation(p_user_id text,p_id uuid,p_token uuid)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j deskbub_animation_jobs;
begin
  update deskbub_animation_jobs set lease_token=p_token,lease_until=now()+interval '90 seconds',updated_at=now()
    where id=p_id and user_id=p_user_id and status='pending' and (lease_until is null or lease_until<now()) returning * into j;
  if not found then return null; end if;
  return to_jsonb(j);
end;
$$;

create function public.deskbub_save_generation(p_user_id text,p_id uuid,p_token uuid,p_state jsonb,p_status text,p_result jsonb,p_release boolean)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare j deskbub_animation_jobs;
begin
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  select * into j from deskbub_animation_jobs where id=p_id and user_id=p_user_id for update;
  if not found then raise exception 'Job unavailable'; end if;
  if j.status='succeeded' then return to_jsonb(j); end if;
  if j.lease_token is distinct from p_token or j.lease_until<now() then raise exception 'Job lease expired'; end if;
  if p_status='succeeded' and j.reserved_credit then
    update subscriptions set generations_used=coalesce(generations_used,0)+1 where user_id=p_user_id;
    if not found then raise exception 'Account unavailable'; end if;
  end if;
  if p_status='succeeded' and j.kind='image' then
    insert into generated_pets(user_id,original_url,processed_url)
      select p_user_id,j.payload->>'imageUrl',p_result->>'processedUrl'
      where not exists(select 1 from generated_pets where user_id=p_user_id and processed_url=p_result->>'processedUrl');
  end if;
  if p_status='succeeded' and j.kind='video' then
    update deskbub_animation_jobs set acknowledged_at=now()
      where user_id=p_user_id and kind='image' and status='succeeded'
      and result->>'processedUrl'=j.payload->>'imageUrl';
  end if;
  update deskbub_animation_jobs set state=p_state,status=p_status,result=p_result,
    reserved_credit=case when p_status in ('succeeded','failed') then false else j.reserved_credit end,
    lease_token=case when p_release or p_status<>'pending' then null else p_token end,
    lease_until=case when p_release or p_status<>'pending' then null else now()+interval '90 seconds' end,
    updated_at=now() where id=p_id returning * into j;
  return to_jsonb(j);
end;
$$;

-- Synchronization is one transaction, so failed delivery cannot erase old pets.
create function public.deskbub_sync_pet_videos(p_user_id text,p_pairing_code text,p_videos jsonb)
returns void language plpgsql security definer set search_path=public,pg_temp as $$
begin
  if p_user_id is null or p_pairing_code !~ '^[0-9]{6}$' or p_pairing_code is null
    or jsonb_typeof(p_videos) is distinct from 'array' then raise exception 'Invalid pet sync'; end if;
  if jsonb_array_length(p_videos)>8 then raise exception 'Too many videos'; end if;
  if exists(select 1 from jsonb_array_elements(p_videos) v where
      jsonb_typeof(v->'url') is distinct from 'string' or coalesce(v->>'url','') !~ '^(https://|http://127[.]0[.]0[.]1:54321/)'
      or length(v->>'url')>8192
      or (v ? 'label' and (jsonb_typeof(v->'label') is distinct from 'string' or length(v->>'label')>160)))
    then raise exception 'Invalid video entry'; end if;
  perform pg_advisory_xact_lock(hashtext('generation:'||p_user_id));
  delete from pet_data where user_id=p_user_id;
  insert into pet_data(user_id,pairing_code,video_url,action_label,processed_url)
    select p_user_id,p_pairing_code,v->>'url',coalesce(v->>'label',''),'' from jsonb_array_elements(p_videos) v;
end;
$$;

do $$ declare f record; begin
  for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace
    and proname in ('deskbub_start_generation','deskbub_lease_generation','deskbub_save_generation','deskbub_sync_pet_videos') loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
