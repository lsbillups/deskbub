-- Store checkout ownership before contacting Creem; no entitlement changes.
begin;

create table public.deskbub_checkouts (
  request_id uuid primary key,
  user_id text not null,
  product_id text not null check (length(product_id) > 0 and product_id not in ('prod_6tpK7rYSe4qOn0Gkwu5orH','prod_3plVm23uj3TPfXW0XpdaMo')),
  plan text not null check (plan in ('basic','plus')),
  mode text not null check (mode in ('test','prod')),
  amount integer not null,
  currency text not null default 'USD' check (currency = 'USD'),
  status text not null default 'pending' check (status in ('pending','created')),
  checkout_id text unique,
  checkout_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check ((plan = 'basic' and amount = 299) or (plan = 'plus' and amount = 999)),
  check ((status = 'pending' and checkout_id is null and checkout_url is null) or
    (status = 'created' and checkout_id is not null and length(checkout_id) > 0
      and checkout_url is not null and checkout_url like 'https://%'))
);
create index deskbub_checkouts_user_idx on public.deskbub_checkouts(user_id, created_at);

create function public.deskbub_begin_checkout(p_request_id uuid, p_user_id text, p_product_id text, p_plan text, p_mode text, p_amount integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare checkout deskbub_checkouts%rowtype;
begin
  if not coalesce((select ready from deskbub_migration_state where id),false) then raise exception 'Migration inventory is not ready'; end if;
  if not exists(select 1 from subscriptions where user_id = p_user_id) then raise exception 'Unknown checkout account'; end if;
  perform pg_advisory_xact_lock(hashtext('deskbub_checkout:' || p_request_id::text));
  select * into checkout from deskbub_checkouts where request_id = p_request_id;
  if found then
    if checkout.user_id is distinct from p_user_id or checkout.product_id is distinct from p_product_id
      or checkout.plan is distinct from p_plan or checkout.mode is distinct from p_mode or checkout.amount is distinct from p_amount then
      raise exception 'Checkout identity conflict';
    end if;
    return jsonb_build_object('created', false);
  end if;
  insert into deskbub_checkouts(request_id,user_id,product_id,plan,mode,amount)
    values(p_request_id,p_user_id,p_product_id,p_plan,p_mode,p_amount);
  return jsonb_build_object('created', true);
end;
$$;

create function public.deskbub_complete_checkout(p_request_id uuid, p_user_id text, p_checkout_id text, p_checkout_url text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare checkout deskbub_checkouts%rowtype;
begin
  perform pg_advisory_xact_lock(hashtext('deskbub_checkout:' || p_request_id::text));
  select * into checkout from deskbub_checkouts where request_id = p_request_id;
  if not found or checkout.user_id is distinct from p_user_id then raise exception 'Checkout identity conflict'; end if;
  if checkout.status = 'created' then
    if checkout.checkout_id is distinct from p_checkout_id or checkout.checkout_url is distinct from p_checkout_url then
      raise exception 'Checkout identity conflict';
    end if;
    return jsonb_build_object('recorded', true);
  end if;
  if p_checkout_id is null or length(p_checkout_id) = 0 or p_checkout_url is null or p_checkout_url not like 'https://%' then
    raise exception 'Invalid checkout response';
  end if;
  update deskbub_checkouts set checkout_id=p_checkout_id, checkout_url=p_checkout_url,
    status='created', updated_at=now() where request_id=p_request_id;
  return jsonb_build_object('recorded', true);
end;
$$;

alter table public.deskbub_checkouts enable row level security;
revoke all on table public.deskbub_checkouts from public, anon, authenticated;
grant all on table public.deskbub_checkouts to service_role;
revoke all on function public.deskbub_begin_checkout(uuid,text,text,text,text,integer) from public,anon,authenticated;
revoke all on function public.deskbub_complete_checkout(uuid,text,text,text) from public,anon,authenticated;
grant execute on function public.deskbub_begin_checkout(uuid,text,text,text,text,integer) to service_role;
grant execute on function public.deskbub_complete_checkout(uuid,text,text,text) to service_role;
notify pgrst, 'reload schema';
commit;
