-- Optional promotional artwork on individual packages, independent of collection imagery.
alter table public.combo_deals
  add column cover_image_url text not null default '' check (
    length(cover_image_url) <= 2048 and (cover_image_url = '' or cover_image_url ~ '^https?://' or cover_image_url ~ '^/[^/]')
  ),
  add column cover_alt text not null default '' check (length(cover_alt) <= 180);

-- These are public marketing assets, not private documents. Uploading does not
-- attach an image to a package until the owner saves that package.
insert into storage.buckets(id, name, public, file_size_limit, allowed_mime_types)
values ('deal-covers', 'deal-covers', true, 5242880, array['image/jpeg','image/png','image/webp','image/avif']);
create policy "Public read deal covers" on storage.objects for select to anon, authenticated
  using (bucket_id = 'deal-covers');
create policy "Approved staff upload deal covers" on storage.objects for insert to authenticated
  with check (bucket_id = 'deal-covers' and (storage.foldername(name))[1] = 'combos' and (select public.can_manage_deals()));
-- Uploads use immutable unique names; no public or staff overwrite/delete policy is needed.

create or replace function public.read_deals_catalog() returns jsonb
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
      'coverImage', c.cover_image_url, 'coverAlt', c.cover_alt,
      'items', coalesce((select jsonb_agg(jsonb_build_object('slug', i.product_slug, 'quantity', i.quantity)
        order by i.position, i.product_slug) from public.combo_deal_items i where i.combo_id = c.id), '[]'::jsonb)
    ) order by c.id) from public.combo_deals c), '[]'::jsonb)
  ) from public.deal_settings s where s.id = 1;
$$;
revoke all on function public.read_deals_catalog() from public;
grant execute on function public.read_deals_catalog() to anon, authenticated;

-- Entire catalogue saves are atomic and revision-checked, not last-writer-wins.
create or replace function public.save_deals_catalog(payload jsonb, expected_revision bigint) returns bigint
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
    if (entry ? 'coverImage' and jsonb_typeof(entry->'coverImage') is distinct from 'string')
      or (entry ? 'coverAlt' and jsonb_typeof(entry->'coverAlt') is distinct from 'string') then
      raise exception 'Cover image URL and description must be text.' using errcode = '22023';
    end if;
    insert into public.combo_deals(id, collection_id, name, description, price, price_is_estimate, active, cover_image_url, cover_alt)
    values (entry->>'id', entry->>'collectionId', trim(entry->>'name'), entry->>'description',
      (entry->>'price')::numeric, coalesce((entry->>'priceIsEstimate')::boolean, false), (entry->>'active')::boolean,
      coalesce(trim(entry->>'coverImage'), ''), coalesce(trim(entry->>'coverAlt'), ''))
    on conflict (id) do update set collection_id = excluded.collection_id, name = excluded.name,
      description = excluded.description, price = excluded.price, price_is_estimate = excluded.price_is_estimate,
      active = excluded.active,
      -- An older client that omits cover fields must not erase an existing cover.
      cover_image_url = case when entry ? 'coverImage' then excluded.cover_image_url else public.combo_deals.cover_image_url end,
      cover_alt = case when entry ? 'coverAlt' then excluded.cover_alt else public.combo_deals.cover_alt end,
      updated_at = now();
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


notify pgrst, 'reload schema';
