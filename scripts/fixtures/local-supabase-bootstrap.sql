-- SANDBOX ONLY: minimal legacy schema using synthetic data.
-- Never add this fixture to production migrations.
begin;
create table public.subscriptions (
  user_id text primary key, tier text default 'free',
  generations_used integer default 0, max_generations integer default 0,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.pet_data (
  id uuid primary key default gen_random_uuid(), user_id text not null,
  pairing_code text not null, video_url text, processed_url text, action_label text,
  created_at timestamptz default now(), updated_at timestamptz default now()
);
create table public.generated_pets (
  id uuid primary key default gen_random_uuid(), user_id text,
  original_url text, processed_url text, created_at timestamptz default now()
);
create table public.daily_unlocks (
  id uuid primary key default gen_random_uuid(), user_id text,
  created_at timestamptz default now()
);
do $$ declare t text; begin
  foreach t in array array['subscriptions','pet_data','generated_pets','daily_unlocks'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;
-- The desktop pairing endpoint currently reads these rows via its public key.
grant select on public.pet_data to anon;
create policy sandbox_pairing_read on public.pet_data for select to anon using (true);
commit;
