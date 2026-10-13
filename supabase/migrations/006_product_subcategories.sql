-- Explicit subcategories for owner-managed product placement. No role changes.
begin;
alter table public.products add column if not exists subcategory_id text;
create or replace function public.product_subcategory_valid(category_id text, subcategory_id text)
returns boolean language sql immutable set search_path = public
as $function$
 select coalesce(
 ($taxonomy${"cooling":["air-conditioners","inverter-split","portable","floor-standing","cassette","fans"],"entertainment":["televisions","audio"],"kitchen":["cooking","small-appliances"],"laundry":["front-load","top-load","semi-automatic","dryers","washer-dryers"],"refrigeration":["refrigerators","single-door","two-door","top-freezer","bottom-freezer","side-by-side","four-door","mini","water-dispenser","freezers"],"lighting":["indoor","outdoor"],"electrical-materials":["cables","fittings"]}$taxonomy$::jsonb -> case
  when category_id in ('air-conditioners','fans') then 'cooling'
  when category_id in ('televisions','audio') then 'entertainment'
  else category_id end) ? subcategory_id,
 subcategory_id = 'general'
 );
$function$;
revoke all on function public.product_subcategory_valid(text,text) from public;
grant execute on function public.product_subcategory_valid(text,text) to anon, authenticated, service_role;
alter table public.products drop constraint if exists products_subcategory_check;
alter table public.products add constraint products_subcategory_check
 check (subcategory_id is null or public.product_subcategory_valid(category_id, subcategory_id));
comment on column public.products.subcategory_id is 'Owner-selected subcategory. Legacy null rows retain name/specification fallback.';
commit;
