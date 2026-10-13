-- Owner-managed category-dependent subcategories. Existing product assignments are kept.
begin;
create table if not exists public.product_subcategories (
  category_id text not null references public.categories(id) on update cascade on delete restrict,
  id text not null check (id ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name text not null check (length(trim(name)) between 1 and 80),
  filter_ids text[] not null,
  sort_order integer not null default 100 check (sort_order between 0 and 9999),
  primary key (category_id, id),
  check (id = any(filter_ids))
);
create unique index if not exists product_subcategories_name_key on public.product_subcategories(category_id, lower(trim(name)));

create or replace function public.catalog_category_key(category_id text)
returns text language sql immutable set search_path = public as $function$
 select case when category_id in ('air-conditioners','fans') then 'cooling'
 when category_id in ('televisions','audio') then 'entertainment' else category_id end;
$function$;

-- Seed shipped groups once under an existing real parent, including legacy parent IDs.
with parents as (
 select distinct on (public.catalog_category_key(id)) id, public.catalog_category_key(id) as category_key
 from public.categories order by public.catalog_category_key(id), (id = public.catalog_category_key(id)) desc, sort_order, id
), defaults as (
 select value as item from jsonb_array_elements($seed$[{"id":"air-conditioners","name":"Standard split / other ACs","filters":["air-conditioners"],"category":"cooling","sortOrder":0},{"id":"inverter-split","name":"Inverter split AC","filters":["air-conditioners","inverter-split"],"category":"cooling","sortOrder":1},{"id":"portable","name":"Portable AC","filters":["air-conditioners","portable"],"category":"cooling","sortOrder":2},{"id":"floor-standing","name":"Floor-standing AC","filters":["air-conditioners","floor-standing"],"category":"cooling","sortOrder":3},{"id":"cassette","name":"Cassette AC","filters":["air-conditioners","cassette"],"category":"cooling","sortOrder":4},{"id":"fans","name":"Fans","filters":["fans"],"category":"cooling","sortOrder":5},{"id":"televisions","name":"Televisions","filters":["televisions"],"category":"entertainment","sortOrder":0},{"id":"audio","name":"Speakers & soundbars","filters":["audio"],"category":"entertainment","sortOrder":1},{"id":"cooking","name":"Cookers & burners","filters":["cooking"],"category":"kitchen","sortOrder":0},{"id":"small-appliances","name":"Kitchen essentials","filters":["small-appliances"],"category":"kitchen","sortOrder":1},{"id":"front-load","name":"Front load","filters":["front-load"],"category":"laundry","sortOrder":0},{"id":"top-load","name":"Top load","filters":["top-load"],"category":"laundry","sortOrder":1},{"id":"semi-automatic","name":"Semi-automatic","filters":["semi-automatic","top-load"],"category":"laundry","sortOrder":2},{"id":"dryers","name":"Dryers","filters":["dryers","front-load"],"category":"laundry","sortOrder":3},{"id":"washer-dryers","name":"Washer-dryers","filters":["washer-dryers","front-load"],"category":"laundry","sortOrder":4},{"id":"refrigerators","name":"Other refrigerators","filters":["refrigerators"],"category":"refrigeration","sortOrder":0},{"id":"single-door","name":"Single door","filters":["refrigerators","single-door"],"category":"refrigeration","sortOrder":1},{"id":"two-door","name":"Two door","filters":["refrigerators","two-door"],"category":"refrigeration","sortOrder":2},{"id":"top-freezer","name":"Top freezer","filters":["refrigerators","two-door","top-freezer"],"category":"refrigeration","sortOrder":3},{"id":"bottom-freezer","name":"Bottom freezer","filters":["refrigerators","two-door","bottom-freezer"],"category":"refrigeration","sortOrder":4},{"id":"side-by-side","name":"Side-by-side","filters":["refrigerators","side-by-side"],"category":"refrigeration","sortOrder":5},{"id":"four-door","name":"Four door","filters":["refrigerators","four-door"],"category":"refrigeration","sortOrder":6},{"id":"mini","name":"Mini refrigerators","filters":["refrigerators","single-door","mini"],"category":"refrigeration","sortOrder":7},{"id":"water-dispenser","name":"Refrigerator with water dispenser","filters":["refrigerators","water-dispenser"],"category":"refrigeration","sortOrder":8},{"id":"freezers","name":"Standalone freezers","filters":["freezers"],"category":"refrigeration","sortOrder":9},{"id":"indoor","name":"Indoor lighting","filters":["indoor"],"category":"lighting","sortOrder":0},{"id":"outdoor","name":"Outdoor & decorative","filters":["outdoor"],"category":"lighting","sortOrder":1},{"id":"cables","name":"Wires & cables","filters":["cables"],"category":"electrical-materials","sortOrder":0},{"id":"fittings","name":"Switches & fittings","filters":["fittings"],"category":"electrical-materials","sortOrder":1}]$seed$::jsonb)
)
insert into public.product_subcategories(category_id,id,name,filter_ids,sort_order)
 select parents.id,item->>'id',item->>'name',array(select jsonb_array_elements_text(item->'filters')),(item->>'sortOrder')::integer
 from defaults join parents on parents.category_key = item->>'category'
 on conflict(category_id,id) do nothing;

-- Preserve valid legacy "general" assignments too; never change any products.
insert into public.product_subcategories(category_id,id,name,filter_ids,sort_order)
 select distinct p.category_id,p.subcategory_id,initcap(replace(p.subcategory_id,'-',' ')),array[p.subcategory_id],100
 from public.products p where p.subcategory_id is not null
 and not exists(select 1 from public.product_subcategories s where public.catalog_category_key(s.category_id)=public.catalog_category_key(p.category_id) and s.id=p.subcategory_id)
 on conflict(category_id,id) do nothing;

alter table public.product_subcategories enable row level security;
grant select on public.product_subcategories to anon, authenticated;
grant insert, update, delete on public.product_subcategories to authenticated;
drop policy if exists "Public reads subcategories" on public.product_subcategories;
create policy "Public reads subcategories" on public.product_subcategories for select to anon, authenticated using(true);
drop policy if exists "Owners manage subcategories" on public.product_subcategories;
create policy "Owners manage subcategories" on public.product_subcategories for all to authenticated using(public.is_owner()) with check(public.is_owner());
-- Reuse approved catalogue-admin access only when the team migration is already installed.
do $block$ begin
 if to_regprocedure('public.is_catalog_admin()') is not null then
  execute 'drop policy if exists "Approved admins manage subcategories" on public.product_subcategories';
  execute 'create policy "Approved admins manage subcategories" on public.product_subcategories for all to authenticated using(public.is_catalog_admin()) with check(public.is_catalog_admin())';
 end if;
end $block$;

create or replace function public.product_subcategory_valid(category_id text, subcategory_id text)
returns boolean language sql stable set search_path = public as $function$
 select exists(select 1 from public.product_subcategories s
 where public.catalog_category_key(s.category_id)=public.catalog_category_key($1) and s.id=$2);
$function$;
revoke all on function public.catalog_category_key(text) from public;
grant execute on function public.catalog_category_key(text) to anon, authenticated, service_role;

-- Prevent a deleted group from leaving assigned products dangling, including hidden products.
create or replace function public.guard_product_subcategory()
returns trigger language plpgsql security definer set search_path = public as $function$
begin
 if TG_OP = 'UPDATE' and (NEW.category_id <> OLD.category_id or NEW.id <> OLD.id) then
  raise exception 'Category and key cannot be changed. Create a new subcategory and reassign products instead.';
 end if;
 if TG_OP = 'DELETE' and exists(select 1 from public.products p
  where public.catalog_category_key(p.category_id)=public.catalog_category_key(OLD.category_id) and p.subcategory_id=OLD.id) then
  raise exception 'Move all assigned products to another subcategory before deleting this one.';
 end if;
 if TG_OP = 'INSERT' and exists(select 1 from public.product_subcategories s
  where public.catalog_category_key(s.category_id)=public.catalog_category_key(NEW.category_id)
  and (s.id=NEW.id or lower(trim(s.name))=lower(trim(NEW.name)))) then
  raise exception 'This subcategory already exists under the selected main category.';
 end if;
 if TG_OP = 'DELETE' then return OLD; end if;
 return NEW;
end;
$function$;
revoke all on function public.guard_product_subcategory() from public;
drop trigger if exists guard_product_subcategory on public.product_subcategories;
create trigger guard_product_subcategory before insert or update or delete on public.product_subcategories for each row execute function public.guard_product_subcategory();

do $block$ begin
 if not exists(select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='product_subcategories') then
  alter publication supabase_realtime add table public.product_subcategories;
 end if;
end $block$;
commit;

