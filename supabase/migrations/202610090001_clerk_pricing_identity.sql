-- Clerk Production identity recovery and payment receipts only. No generation or storage migration.
begin;
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

do $$ declare t text; f record; begin
 foreach t in array array['deskbub_accounts','deskbub_identity_links','deskbub_legacy_claims','deskbub_migration_state','deskbub_purchase_receipts'] loop
  execute format('alter table public.%I enable row level security',t);
  execute format('revoke all on public.%I from public, anon, authenticated',t);
  execute format('grant all on public.%I to service_role',t);
 end loop;
 for f in select oid::regprocedure as signature from pg_proc where pronamespace='public'::regnamespace and proname in ('deskbub_old_pairing_code','deskbub_resolve_identity') loop
  execute format('revoke all on function %s from public, anon, authenticated',f.signature);
  execute format('grant execute on function %s to service_role',f.signature);
 end loop;
end $$;
notify pgrst, 'reload schema';
commit;
