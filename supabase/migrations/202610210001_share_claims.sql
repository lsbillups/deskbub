begin;
create table public.deskbub_share_claims (
  id uuid primary key default gen_random_uuid(),
  campaign text not null default 'share-basic-v1' check(campaign='share-basic-v1'),
  user_id text not null references public.deskbub_accounts(user_id),
  email text not null,
  platform text not null check(platform in ('x','tiktok','instagram')),
  post_id text not null,
  post_url text not null,
  social_handle text not null check(length(social_handle) between 1 and 80),
  status text not null default 'pending' check(status in ('pending','changes_requested','approved')),
  review_note text, reviewed_by text, reviewed_at timestamptz,
  revision integer not null default 1,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  unique(campaign,user_id), unique(campaign,platform,post_id)
);
create table public.deskbub_share_rewards (
  claim_id uuid primary key references public.deskbub_share_claims(id),
  user_id text not null references public.deskbub_accounts(user_id),
  campaign text not null check(campaign='share-basic-v1'),
  credits integer not null default 1 check(credits=1),
  granted_by text not null, created_at timestamptz not null default now(),
  unique(campaign,user_id)
);
create table public.deskbub_share_review_log (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.deskbub_share_claims(id),
  actor text not null,
  action text not null check(action in ('submitted','resubmitted','changes_requested','approved')),
  note text, created_at timestamptz not null default now()
);
create index deskbub_share_review_queue on public.deskbub_share_claims(status,created_at);
create function public.deskbub_share_eligible(p_user_id text) returns boolean
language sql stable security definer set search_path=public,pg_temp as $$
  select exists(select 1 from subscriptions where user_id=p_user_id and tier='free'
    and coalesce(generations_used,0)=0 and coalesce(max_generations,0)=0)
    and not exists(select 1 from deskbub_purchase_receipts where user_id=p_user_id)
    and not exists(select 1 from generated_pets where user_id=p_user_id)
    and not exists(select 1 from pet_data where user_id=p_user_id)
    and not exists(select 1 from deskbub_animation_jobs where user_id=p_user_id)
    and not exists(select 1 from daily_unlocks where user_id=p_user_id);
$$;
create function public.deskbub_submit_share(p_user_id text,p_email text,p_platform text,p_post_id text,p_post_url text,p_handle text)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c deskbub_share_claims; s subscriptions; action_name text;
begin
  perform pg_advisory_xact_lock(hashtext('share:'||p_user_id));
  select * into s from subscriptions where user_id=p_user_id for update;
  if not deskbub_share_eligible(p_user_id) then raise exception 'This pilot is for accounts with no purchased plan or previous pet generation.'; end if;
  if p_email is null or length(p_email)>320 or length(trim(p_email))=0
    or p_platform not in ('x','tiktok','instagram') or p_platform is null
    or p_post_id is null or p_post_id !~ '^[A-Za-z0-9_-]{5,64}$'
    or p_post_url is null or length(p_post_url)>2048 or p_post_url !~ '^https://'
    or p_handle is null or length(trim(p_handle)) not between 1 and 80 then raise exception 'Invalid share submission'; end if;
  select * into c from deskbub_share_claims where user_id=p_user_id and campaign='share-basic-v1' for update;
  if found then
    if c.status='approved' then raise exception 'Your Basic reward has already been granted.'; end if;
    if c.status='pending' then raise exception 'Your post is already waiting for review.'; end if;
    if c.updated_at>now()-interval '30 seconds' then raise exception 'Wait a moment before submitting again.'; end if;
    update deskbub_share_claims set platform=p_platform,post_id=p_post_id,post_url=p_post_url,
      social_handle=trim(p_handle),email=p_email,status='pending',review_note=null,reviewed_by=null,reviewed_at=null,
      revision=revision+1,updated_at=now() where id=c.id returning * into c;
    action_name:='resubmitted';
  else
    insert into deskbub_share_claims(user_id,email,platform,post_id,post_url,social_handle)
      values(p_user_id,p_email,p_platform,p_post_id,p_post_url,trim(p_handle)) returning * into c;
    action_name:='submitted';
  end if;
  insert into deskbub_share_review_log(claim_id,actor,action,note)
    values(c.id,p_user_id,action_name,jsonb_build_object('platform',p_platform,'url',p_post_url,'handle',trim(p_handle))::text);
  return to_jsonb(c);
end;
$$;
-- Only the administrator-authorized server route can call this service-role RPC.
-- The subscription row lock also serializes against paid credit updates.
create function public.deskbub_review_share(p_id uuid,p_actor text,p_decision text,p_note text,p_revision integer)
returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare c deskbub_share_claims; s subscriptions;
begin
  if p_actor is null or length(trim(p_actor))=0 or p_decision is null
    or p_decision not in ('approved','changes_requested') then raise exception 'Invalid review'; end if;
  select * into c from deskbub_share_claims where id=p_id;
  if not found then raise exception 'Application not found'; end if;
  perform pg_advisory_xact_lock(hashtext('share:'||c.user_id));
  select * into s from subscriptions where user_id=c.user_id for update;
  select * into c from deskbub_share_claims where id=p_id for update;
  if c.status='approved' and p_decision='approved' then return to_jsonb(c); end if;
  if c.status<>'pending' or c.revision is distinct from p_revision then raise exception 'Application changed. Refresh before reviewing.'; end if;
  if p_decision='changes_requested' and (p_note is null or length(trim(p_note)) not between 1 and 500) then raise exception 'Add a short reason for the applicant.'; end if;
  if p_note is not null and length(p_note)>500 then raise exception 'Review note is too long'; end if;
  if p_decision='approved' then
    if not deskbub_share_eligible(c.user_id) then raise exception 'Account now has a plan or saved work. No reward was issued; purchased credits and pets are unchanged. Return the application with an explanation.'; end if;
    insert into deskbub_share_rewards(claim_id,user_id,campaign,granted_by)
      values(c.id,c.user_id,c.campaign,p_actor);
    update subscriptions set tier='basic',max_generations=coalesce(max_generations,0)+1 where user_id=c.user_id;
  end if;
  update deskbub_share_claims set status=p_decision,review_note=nullif(trim(p_note),''),
    reviewed_by=p_actor,reviewed_at=now(),updated_at=now() where id=p_id returning * into c;
  insert into deskbub_share_review_log(claim_id,actor,action,note) values(c.id,p_actor,p_decision,c.review_note);
  return to_jsonb(c);
end;
$$;
do $$ declare t text; f record; begin
  foreach t in array array['deskbub_share_claims','deskbub_share_rewards','deskbub_share_review_log'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public,anon,authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
  for f in select oid::regprocedure signature from pg_proc where pronamespace='public'::regnamespace
    and proname in ('deskbub_share_eligible','deskbub_submit_share','deskbub_review_share') loop
    execute format('revoke all on function %s from public,anon,authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
notify pgrst,'reload schema';
commit;
