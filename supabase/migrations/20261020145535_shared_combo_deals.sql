-- Shared deal publishing. Public reads are filtered by RLS; only approved staff can save.
create table public.deal_settings (
  id smallint primary key default 1 check (id = 1),
  enabled boolean not null default false,
  revision bigint not null default 0 check (revision >= 0),
  updated_at timestamptz not null default now()
);
insert into public.deal_settings (id) values (1);

create table public.deal_collections (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 120),
  name text not null check (length(trim(name)) between 1 and 80),
  eyebrow text not null check (length(eyebrow) between 1 and 100),
  description text not null check (length(description) between 1 and 500),
  image_url text not null check (length(image_url) <= 2048 and (image_url ~ '^https?://' or image_url ~ '^/[^/]')),
  theme text not null check (theme in ('student', 'odogwu', 'seasonal')),
  active boolean not null default false,
  featured boolean not null default false,
  sort_order integer not null default 100,
  starts_at timestamptz,
  ends_at timestamptz,
  updated_at timestamptz not null default now(),
  check (starts_at is null or ends_at is null or ends_at > starts_at)
);
create table public.combo_deals (
  id text primary key check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$' and length(id) <= 120),
  collection_id text not null references public.deal_collections(id) on update cascade on delete restrict,
  name text not null check (length(trim(name)) between 1 and 100),
  description text not null check (length(description) between 1 and 500),
  price numeric(12,2) check (price >= 0 and price <= 9999999999),
  price_is_estimate boolean not null default false,
  active boolean not null default false,
  updated_at timestamptz not null default now()
);
create index combo_deals_collection_id_idx on public.combo_deals(collection_id);
create table public.combo_deal_items (
  combo_id text not null references public.combo_deals(id) on update cascade on delete cascade,
  product_slug text not null references public.products(slug) on update cascade on delete restrict,
  quantity integer not null check (quantity between 1 and 99),
  position integer not null check (position >= 0),
  primary key (combo_id, product_slug)
);
create index combo_deal_items_product_slug_idx on public.combo_deal_items(product_slug);

create function public.can_manage_deals() returns boolean
language sql stable security invoker set search_path = '' as $$
  select exists (select 1 from public.profiles where id = (select auth.uid()) and role in ('owner', 'admin'));
$$;
revoke all on function public.can_manage_deals() from public, anon;
grant execute on function public.can_manage_deals() to authenticated;

alter table public.deal_settings enable row level security;
alter table public.deal_collections enable row level security;
alter table public.combo_deals enable row level security;
alter table public.combo_deal_items enable row level security;
revoke all on public.deal_settings, public.deal_collections, public.combo_deals, public.combo_deal_items from anon, authenticated;
grant select on public.deal_settings, public.deal_collections, public.combo_deals, public.combo_deal_items to anon, authenticated;
grant update on public.deal_settings to authenticated;
grant insert, update on public.deal_collections, public.combo_deals to authenticated;
grant insert, update, delete on public.combo_deal_items to authenticated;

create policy "Read deal availability" on public.deal_settings for select to anon, authenticated using (true);
create policy "Staff update deal availability" on public.deal_settings for update to authenticated
  using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Read live deal collections" on public.deal_collections for select to anon, authenticated using (
  active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
  and (select enabled from public.deal_settings where id = 1)
);
create policy "Staff manage deal collections" on public.deal_collections for all to authenticated
  using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Read live combo packages" on public.combo_deals for select to anon, authenticated using (
  active and exists (select 1 from public.deal_collections c where c.id = collection_id)
);
create policy "Staff manage combo packages" on public.combo_deals for all to authenticated
  using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Read live package contents" on public.combo_deal_items for select to anon, authenticated using (
  exists (select 1 from public.combo_deals c where c.id = combo_id)
);
create policy "Staff manage package contents" on public.combo_deal_items for all to authenticated
  using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));

-- One consistent snapshot, with the caller's RLS applied to every nested table.
create function public.read_deals_catalog() returns jsonb
language sql stable security invoker set search_path = '' as $$
  select jsonb_build_object(
    'enabled', s.enabled, 'revision', s.revision,
    'collections', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'name', c.name, 'eyebrow', c.eyebrow, 'description', c.description,
      'image', c.image_url, 'theme', c.theme, 'active', c.active, 'featured', c.featured,
      'order', c.sort_order, 'startsAt', coalesce(c.starts_at::text, ''), 'endsAt', coalesce(c.ends_at::text, '')
    ) order by c.sort_order, c.id) from public.deal_collections c), '[]'::jsonb),
    'combos', coalesce((select jsonb_agg(jsonb_build_object(
      'id', c.id, 'collectionId', c.collection_id, 'name', c.name, 'description', c.description,
      'price', c.price, 'priceIsEstimate', c.price_is_estimate, 'active', c.active,
      'items', coalesce((select jsonb_agg(jsonb_build_object('slug', i.product_slug, 'quantity', i.quantity)
        order by i.position, i.product_slug) from public.combo_deal_items i where i.combo_id = c.id), '[]'::jsonb)
    ) order by c.id) from public.combo_deals c), '[]'::jsonb)
  ) from public.deal_settings s where s.id = 1;
$$;
revoke all on function public.read_deals_catalog() from public;
grant execute on function public.read_deals_catalog() to anon, authenticated;

-- Entire catalogue saves are atomic and revision-checked, not last-writer-wins.
create function public.save_deals_catalog(payload jsonb, expected_revision bigint) returns bigint
language plpgsql security invoker set search_path = '' as $$
declare
  current_revision bigint;
  entry jsonb;
  line jsonb;
  line_position integer;
begin
  if not public.can_manage_deals() then
    raise exception 'Only approved store administrators can publish deals.' using errcode = '42501';
  end if;
  select revision into current_revision from public.deal_settings where id = 1 for update;
  if expected_revision is null or current_revision is null or current_revision <> expected_revision then
    raise exception 'Deals changed since you opened this editor. Reload and review before saving.' using errcode = '40001';
  end if;
  if jsonb_typeof(payload) is distinct from 'object'
    or jsonb_typeof(payload->'enabled') is distinct from 'boolean'
    or jsonb_typeof(payload->'collections') is distinct from 'array'
    or jsonb_typeof(payload->'combos') is distinct from 'array' then
    raise exception 'Invalid deal catalogue format.' using errcode = '22023';
  end if;
  if jsonb_array_length(payload->'collections') > 200 or jsonb_array_length(payload->'combos') > 2000 then
    raise exception 'Too many deal collections or packages.' using errcode = '22023';
  end if;
  if (select count(*) <> count(distinct x->>'id') from jsonb_array_elements(payload->'collections') x)
    or (select count(*) <> count(distinct x->>'id') from jsonb_array_elements(payload->'combos') x) then
    raise exception 'Collection and package identifiers must be unique.' using errcode = '22023';
  end if;
  -- A partial/stale client snapshot must never silently erase other saved deals.
  if exists (select 1 from public.deal_collections c where not exists (
      select 1 from jsonb_array_elements(payload->'collections') x where x->>'id' = c.id))
    or exists (select 1 from public.combo_deals c where not exists (
      select 1 from jsonb_array_elements(payload->'combos') x where x->>'id' = c.id)) then
    raise exception 'Some saved deals are missing. Reload before publishing; use Pause to hide deals.' using errcode = '40001';
  end if;
  for entry in select value from jsonb_array_elements(payload->'collections') loop
    if jsonb_typeof(entry->'active') is distinct from 'boolean'
      or jsonb_typeof(entry->'featured') is distinct from 'boolean'
      or jsonb_typeof(entry->'order') is distinct from 'number'
      or (entry->>'order') !~ '^-?[0-9]+$' then
      raise exception 'Check collection visibility and display order.' using errcode = '22023';
    end if;
    insert into public.deal_collections(id, name, eyebrow, description, image_url, theme, active, featured, sort_order, starts_at, ends_at)
    values (entry->>'id', trim(entry->>'name'), entry->>'eyebrow', entry->>'description', entry->>'image', entry->>'theme',
      (entry->>'active')::boolean, (entry->>'featured')::boolean, (entry->>'order')::integer,
      nullif(entry->>'startsAt', '')::timestamptz, nullif(entry->>'endsAt', '')::timestamptz)
    on conflict (id) do update set name = excluded.name, eyebrow = excluded.eyebrow, description = excluded.description,
      image_url = excluded.image_url, theme = excluded.theme, active = excluded.active, featured = excluded.featured,
      sort_order = excluded.sort_order, starts_at = excluded.starts_at, ends_at = excluded.ends_at, updated_at = now();
  end loop;
  for entry in select value from jsonb_array_elements(payload->'combos') loop
    if jsonb_typeof(entry->'active') is distinct from 'boolean'
      or (entry ? 'priceIsEstimate' and jsonb_typeof(entry->'priceIsEstimate') is distinct from 'boolean')
      or (jsonb_typeof(entry->'price') is distinct from 'null' and jsonb_typeof(entry->'price') is distinct from 'number')
      or jsonb_typeof(entry->'items') is distinct from 'array' then
      raise exception 'Check package price, visibility and products.' using errcode = '22023';
    end if;
    if jsonb_array_length(entry->'items') not between 2 and 50
      or (select count(*) <> count(distinct x->>'slug') from jsonb_array_elements(entry->'items') x)
      or not exists (select 1 from jsonb_array_elements(payload->'collections') x where x->>'id' = entry->>'collectionId') then
      raise exception 'Choose a collection and between two and fifty distinct products per package.' using errcode = '22023';
    end if;
    insert into public.combo_deals(id, collection_id, name, description, price, price_is_estimate, active)
    values (entry->>'id', entry->>'collectionId', trim(entry->>'name'), entry->>'description',
      (entry->>'price')::numeric, coalesce((entry->>'priceIsEstimate')::boolean, false), (entry->>'active')::boolean)
    on conflict (id) do update set collection_id = excluded.collection_id, name = excluded.name,
      description = excluded.description, price = excluded.price, price_is_estimate = excluded.price_is_estimate,
      active = excluded.active, updated_at = now();
    delete from public.combo_deal_items where combo_id = entry->>'id';
    line_position := 0;
    for line in select value from jsonb_array_elements(entry->'items') loop
      if jsonb_typeof(line->'quantity') is distinct from 'number' or (line->>'quantity') !~ '^[1-9][0-9]?$' then
        raise exception 'Product quantities must be whole numbers between one and ninety-nine.' using errcode = '22023';
      end if;
      insert into public.combo_deal_items(combo_id, product_slug, quantity, position)
      values (entry->>'id', line->>'slug', (line->>'quantity')::integer, line_position);
      line_position := line_position + 1;
    end loop;
  end loop;
  update public.deal_settings set enabled = (payload->>'enabled')::boolean, revision = current_revision + 1, updated_at = now() where id = 1;
  return current_revision + 1;
end;
$$;
revoke all on function public.save_deals_catalog(jsonb, bigint) from public, anon;
grant execute on function public.save_deals_catalog(jsonb, bigint) to authenticated;

-- Only availability/revision broadcasts are needed; clients re-fetch their RLS-filtered snapshot.
do $$ begin
  if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deal_settings') then
    alter publication supabase_realtime add table public.deal_settings;
  end if;
end $$;
notify pgrst, 'reload schema';
