-- Old SKU callbacks are retained for review, never automatically credited.
-- Apply to the isolated sandbox first. No customer IDs or order IDs belong here.
begin;

create table public.deskbub_historical_orders (
  order_id text primary key,
  product_id text not null check (product_id in ('prod_6tpK7rYSe4qOn0Gkwu5orH','prod_3plVm23uj3TPfXW0XpdaMo')),
  user_id text,
  classification text not null default 'unknown' check (classification in ('unknown','real_customer','owner_test')),
  source text not null check (source in ('inventory','verified_webhook')),
  created_at timestamptz not null default now()
);
create table public.deskbub_historical_deliveries (
  event_id text primary key,
  order_id text not null references public.deskbub_historical_orders(order_id),
  user_id text,
  received_at timestamptz not null default now()
);

create function public.deskbub_quarantine_purchase(p_event_id text, p_order_id text, p_user_id text, p_product_id text)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare historical deskbub_historical_orders%rowtype; delivery deskbub_historical_deliveries%rowtype;
begin
  if coalesce(p_event_id,'') = '' or coalesce(p_order_id,'') = ''
    or p_product_id is null or p_product_id not in ('prod_6tpK7rYSe4qOn0Gkwu5orH','prod_3plVm23uj3TPfXW0XpdaMo')
    or p_user_id = '' then raise exception 'Invalid historical purchase'; end if;
  -- Same lock as grants: a concurrent callback cannot bypass the order guard.
  perform pg_advisory_xact_lock(hashtext('deskbub_order:' || p_order_id));
  select * into historical from deskbub_historical_orders where order_id = p_order_id;
  if found then
    if historical.product_id <> p_product_id or
      (historical.user_id is not null and p_user_id is not null and historical.user_id <> p_user_id) then
      raise exception 'Historical order identity conflict';
    end if;
    if historical.user_id is null and p_user_id is not null then
      update deskbub_historical_orders set user_id = p_user_id where order_id = p_order_id;
    end if;
  else
    insert into deskbub_historical_orders(order_id,product_id,user_id,source)
      values(p_order_id,p_product_id,p_user_id,'verified_webhook');
  end if;
  select * into delivery from deskbub_historical_deliveries where event_id = p_event_id;
  if found then
    if delivery.order_id <> p_order_id or delivery.user_id is distinct from p_user_id then
      raise exception 'Historical event identity conflict';
    end if;
    return jsonb_build_object('quarantined',true,'duplicate',true);
  end if;
  insert into deskbub_historical_deliveries(event_id,order_id,user_id) values(p_event_id,p_order_id,p_user_id);
  -- No readiness gate: a verified old callback can be retained during maintenance.
  -- This records receipt of a delivery, not successful historical credit processing.
  return jsonb_build_object('quarantined',true,'duplicate',false);
end;
$$;

create or replace function public.deskbub_grant_purchase(p_event_id text, p_order_id text, p_user_id text, p_tier text, p_credits integer)
returns jsonb language plpgsql security definer set search_path = public, pg_temp as $$
declare receipt deskbub_purchase_receipts%rowtype;
begin
  if not coalesce((select ready from deskbub_migration_state where id),false) then raise exception 'Migration inventory is not ready'; end if;
  if (p_tier = 'basic' and p_credits <> 1) or (p_tier = 'plus' and p_credits <> 8)
    or p_tier not in ('basic','plus') then raise exception 'Invalid purchase'; end if;
  perform pg_advisory_xact_lock(hashtext('deskbub_order:' || p_order_id));
  if exists(select 1 from deskbub_historical_orders where order_id = p_order_id) then
    raise exception 'Historical order requires review';
  end if;
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

alter table public.deskbub_historical_orders enable row level security;
alter table public.deskbub_historical_deliveries enable row level security;
revoke all on public.deskbub_historical_orders, public.deskbub_historical_deliveries from public, anon, authenticated;
grant all on public.deskbub_historical_orders, public.deskbub_historical_deliveries to service_role;
revoke all on function public.deskbub_quarantine_purchase(text,text,text,text) from public, anon, authenticated;
grant execute on function public.deskbub_quarantine_purchase(text,text,text,text) to service_role;
revoke all on function public.deskbub_grant_purchase(text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.deskbub_grant_purchase(text,text,text,text,integer) to service_role;
commit;
