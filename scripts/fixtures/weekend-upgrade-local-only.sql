-- Additive migration. Apply to an isolated sandbox first, never automatically at build time.
begin;

alter table public.generated_pets add column video_input_url text;
create table public.deskbub_uploaded_photos (
  id uuid primary key, user_id text not null, url text not null unique, created_at timestamptz not null default now()
);

create table public.deskbub_accounts (
  user_id text primary key,
  pairing_code text not null unique check (pairing_code ~ '^[0-9]{6}$'),
  created_at timestamptz not null default now()
);
create table public.deskbub_identity_links (
  instance text not null,
  clerk_user_id text not null,
  user_id text not null references public.deskbub_accounts(user_id),
  primary key (instance, clerk_user_id),
  unique (instance, user_id)
);
create table public.deskbub_legacy_claims (
  email_key text primary key check (email_key ~ '^[0-9a-f]{64}$'),
  user_id text not null
);
create table public.deskbub_migration_state (
  id boolean primary key default true check (id),
  ready boolean not null default false
);
insert into public.deskbub_migration_state(id, ready) values (true, false);

create table public.deskbub_purchase_receipts (
  order_id text primary key,
  event_id text not null unique,
  user_id text not null,
  credits integer not null check (credits > 0),
  created_at timestamptz not null default now()
);
create table public.deskbub_generation_jobs (
  id uuid primary key,
  user_id text not null,
  request_hash text not null,
  status text not null check (status in ('pending', 'succeeded', 'failed')),
  prompt_version text not null,
  model_version text not null,
  action_label text not null,
  video_prediction_id text,
  matte_prediction_id text,
  video_url text,
  failure_code text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index deskbub_jobs_user_idx on public.deskbub_generation_jobs(user_id, created_at);

-- Exact compatibility with the old JavaScript ID hash (Clerk IDs are ASCII).
create function public.deskbub_old_pairing_code(p_user_id text) returns text
language plpgsql immutable set search_path = public, pg_temp as $$
declare h bigint := 0; i integer;
begin
  for i in 1..length(p_user_id) loop
    h := ((h * 31 + ascii(substr(p_user_id, i, 1))) % 4294967296 + 4294967296) % 4294967296;
    if h >= 2147483648 then h := h - 4294967296; end if;
  end loop;
  return lpad((abs(h) % 1000000)::text, 6, '0');
end;
$$;

create function public.deskbub_resolve_identity(p_instance text, p_clerk_id text, p_email_keys text[], p_legacy boolean)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare uid text; code text; matches integer; tries integer := 0;
begin
  -- Serializes claims, including two first logins trying to claim the same legacy account.
  perform pg_advisory_xact_lock(hashtext('deskbub_identity'));
  select user_id into uid from deskbub_identity_links where instance = p_instance and clerk_user_id = p_clerk_id;
  if uid is null then
    if p_legacy then uid := p_clerk_id;
    else
      if not coalesce((select ready from deskbub_migration_state where id), false) then
        raise exception 'Migration inventory is not ready';
      end if;
      select count(distinct user_id), min(user_id) into matches, uid
        from deskbub_legacy_claims where email_key = any(p_email_keys);
      if matches > 1 then raise exception 'Identity claim conflict'; end if;
      if uid is null then uid := p_clerk_id; end if;
    end if;
    if exists(select 1 from deskbub_identity_links where instance = p_instance and user_id = uid and clerk_user_id <> p_clerk_id) then
      raise exception 'Legacy account already claimed';
    end if;
    select pairing_code into code from deskbub_accounts where user_id = uid;
    if code is null then
      select count(distinct pairing_code), min(pairing_code) into matches, code
        from pet_data where user_id = uid and pairing_code ~ '^[0-9]{6}$';
      if matches > 1 then raise exception 'Legacy pairing conflict'; end if;
      if code is null then code := deskbub_old_pairing_code(uid); end if;
      while exists(select 1 from deskbub_accounts where pairing_code = code and user_id <> uid)
        or exists(select 1 from pet_data where pairing_code = code and user_id <> uid) loop
        if matches > 0 then raise exception 'Legacy pairing collision'; end if;
        tries := tries + 1;
        if tries > 50 then raise exception 'Cannot allocate pairing code'; end if;
        code := lpad(floor(random() * 1000000)::integer::text, 6, '0');
      end loop;
      insert into deskbub_accounts(user_id, pairing_code) values (uid, code);
    end if;
    insert into deskbub_identity_links(instance, clerk_user_id, user_id) values (p_instance, p_clerk_id, uid);
  end if;
  -- Restoration precedes initialization; never upsert over an existing paid row.
  insert into subscriptions(user_id, tier, generations_used, max_generations)
    values (uid, 'free', 0, 0) on conflict (user_id) do nothing;
  select pairing_code into code from deskbub_accounts where user_id = uid;
  return jsonb_build_object('userId', uid, 'pairingCode', code);
end;
$$;

create function public.deskbub_grant_purchase(p_event_id text, p_order_id text, p_user_id text, p_tier text, p_credits integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare receipt deskbub_purchase_receipts%rowtype;
begin
  if not coalesce((select ready from deskbub_migration_state where id),false) then raise exception 'Migration inventory is not ready'; end if;
  if (p_tier = 'basic' and p_credits <> 1) or (p_tier = 'plus' and p_credits <> 8)
    or p_tier not in ('basic','plus') then raise exception 'Invalid purchase'; end if;
  perform pg_advisory_xact_lock(hashtext('deskbub_order:' || p_order_id));
  select * into receipt from deskbub_purchase_receipts where order_id = p_order_id;
  if found then
    if receipt.user_id <> p_user_id or receipt.credits <> p_credits then raise exception 'Order identity conflict'; end if;
    return jsonb_build_object('duplicate', true);
  end if;
  if not exists(select 1 from subscriptions where user_id = p_user_id) then raise exception 'Unknown purchase account'; end if;
  insert into deskbub_purchase_receipts(order_id, event_id, user_id, credits)
    values (p_order_id, p_event_id, p_user_id, p_credits);
  update subscriptions set
    tier = case when tier = 'plus' or p_tier = 'plus' then 'plus' else 'basic' end,
    max_generations = coalesce(max_generations, 0) + p_credits, updated_at = now()
    where user_id = p_user_id;
  return jsonb_build_object('duplicate', false);
end;
$$;

create function public.deskbub_reserve_generation(p_id uuid, p_user_id text, p_request_hash text, p_prompt_version text, p_model_version text, p_action_label text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare job deskbub_generation_jobs%rowtype; sub subscriptions%rowtype;
begin
  if not coalesce((select ready from deskbub_migration_state where id),false) then raise exception 'Migration inventory is not ready'; end if;
  perform pg_advisory_xact_lock(hashtext('deskbub_job:' || p_id::text));
  select * into job from deskbub_generation_jobs where id = p_id;
  if found then
    if job.user_id <> p_user_id or job.request_hash <> p_request_hash then raise exception 'Generation request conflict'; end if;
    return jsonb_build_object('created', false, 'status', job.status, 'videoUrl', job.video_url);
  end if;
  select * into sub from subscriptions where user_id = p_user_id for update;
  if not found or coalesce(sub.generations_used,0) >= coalesce(sub.max_generations,0) then
    raise exception 'No generations remaining';
  end if;
  update subscriptions set generations_used = coalesce(generations_used,0) + 1, updated_at = now() where user_id = p_user_id;
  insert into deskbub_generation_jobs(id, user_id, request_hash, status, prompt_version, model_version, action_label)
    values(p_id, p_user_id, p_request_hash, 'pending', p_prompt_version, p_model_version, p_action_label);
  return jsonb_build_object('created', true, 'status', 'pending');
end;
$$;

create function public.deskbub_finish_generation(p_id uuid, p_user_id text, p_video_url text, p_failure_code text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare job deskbub_generation_jobs%rowtype;
begin
  select * into job from deskbub_generation_jobs where id = p_id and user_id = p_user_id for update;
  if not found then raise exception 'Unknown generation'; end if;
  if job.status <> 'pending' then return jsonb_build_object('status', job.status); end if;
  if p_video_url is null then
    update subscriptions set generations_used = greatest(coalesce(generations_used,0) - 1,0), updated_at = now() where user_id = p_user_id;
    update deskbub_generation_jobs set status = 'failed', failure_code = p_failure_code, updated_at = now() where id = p_id;
    return jsonb_build_object('status','failed');
  end if;
  update deskbub_generation_jobs set status = 'succeeded', video_url = p_video_url, updated_at = now() where id = p_id;
  return jsonb_build_object('status','succeeded');
end;
$$;

create function public.deskbub_sync_pet_data(p_user_id text, p_videos jsonb)
returns integer language plpgsql security definer set search_path = public, pg_temp as $$
declare code text; v jsonb;
begin
  select pairing_code into code from deskbub_accounts where user_id = p_user_id for update;
  if not found then raise exception 'Unknown account'; end if;
  if jsonb_typeof(p_videos) <> 'array' or jsonb_array_length(p_videos) > 8 then raise exception 'Invalid videos'; end if;
  -- Do not let clients import another customer's URL into their account.
  for v in select value from jsonb_array_elements(p_videos) loop
    if not exists(select 1 from deskbub_generation_jobs where user_id = p_user_id and status = 'succeeded' and video_url = v->>'url')
      and not exists(select 1 from pet_data where user_id = p_user_id and video_url = v->>'url') then
      raise exception 'Video does not belong to account';
    end if;
  end loop;
  delete from pet_data where user_id = p_user_id;
  insert into pet_data(user_id,pairing_code,video_url,action_label,processed_url)
    select p_user_id,code,value->>'url',left(coalesce(value->>'label','Pet action'),100),'' from jsonb_array_elements(p_videos);
  return jsonb_array_length(p_videos);
end;
$$;

create function public.deskbub_unlock_basic(p_user_id text) returns void
language plpgsql security definer set search_path = public, pg_temp as $$
declare sub subscriptions%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('deskbub_daily_unlock'));
  select * into sub from subscriptions where user_id = p_user_id for update;
  if not found or sub.tier <> 'free' or exists(select 1 from daily_unlocks where user_id = p_user_id) then
    raise exception 'Already unlocked';
  end if;
  if (select count(*) from daily_unlocks where created_at >= date_trunc('day',now() at time zone 'UTC') at time zone 'UTC') >= 10 then
    raise exception 'Daily limit reached';
  end if;
  insert into daily_unlocks(user_id) values(p_user_id);
  update subscriptions set tier = 'basic', max_generations = coalesce(max_generations,0) + 1, updated_at = now() where user_id = p_user_id;
end;
$$;

-- Every new table and RPC is server-only. No client may claim identities or grant credits.
do $$ declare t text; f record; begin
  foreach t in array array['deskbub_accounts','deskbub_identity_links','deskbub_legacy_claims','deskbub_migration_state','deskbub_purchase_receipts','deskbub_generation_jobs','deskbub_uploaded_photos'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
  for f in select oid::regprocedure as signature from pg_proc where pronamespace = 'public'::regnamespace and proname like 'deskbub_%' loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
commit;
