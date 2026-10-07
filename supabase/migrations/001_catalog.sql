-- A Kaycee Electricals catalogue and owner-admin foundation.
-- Public visitors can read active catalogue content. Only users whose profile
-- role is "owner" can create, update, upload, or delete content.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text,
  role text not null default 'staff' check (role in ('owner', 'staff')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.categories (
  id text primary key,
  name text not null,
  short_name text not null,
  description text not null default '',
  image_url text not null default '',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.brands (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  logo_url text not null default '',
  logo_dark_url text,
  tagline text not null default '',
  category_tags text[] not null default '{}',
  sort_order integer not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  category_id text not null references public.categories(id) on update cascade,
  brand_name text not null,
  description text not null default '',
  specs text[] not null default '{}',
  image_url text not null default '',
  featured boolean not null default false,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.site_settings (
  id smallint primary key default 1 check (id = 1),
  site_name text not null default 'A KAYCEE',
  tagline text not null default 'ELECTRICALS',
  logo_url text not null default '/assets/business/instagram-logo.jpg',
  phone text not null default '08085565004',
  whatsapp text not null default '2348085565004',
  email text not null default 'kelechiemmanuel999@gmail.com',
  address text not null default '12 Ajayi Road, Ogba Okeira, Lagos State, Nigeria',
  instagram_url text not null default 'https://www.instagram.com/a_kaycee_electricals/',
  updated_at timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute function public.set_updated_at();

drop trigger if exists categories_set_updated_at on public.categories;
create trigger categories_set_updated_at before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists brands_set_updated_at on public.brands;
create trigger brands_set_updated_at before update on public.brands
for each row execute function public.set_updated_at();

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at before update on public.products
for each row execute function public.set_updated_at();

drop trigger if exists site_settings_set_updated_at on public.site_settings;
create trigger site_settings_set_updated_at before update on public.site_settings
for each row execute function public.set_updated_at();

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data ->> 'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Backfill users created before this migration, then approve the initial store owner.
insert into public.profiles (id, email, full_name)
select id, email, coalesce(raw_user_meta_data ->> 'full_name', '')
from auth.users
on conflict (id) do update set email = excluded.email;

update public.profiles
set role = 'owner'
where lower(email) = 'kelechiemmanuel999@gmail.com';

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'owner'
  );
$$;

revoke all on function public.is_owner() from public;
grant execute on function public.is_owner() to anon, authenticated;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.brands enable row level security;
alter table public.products enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "Users can read their profile" on public.profiles;
create policy "Users can read their profile" on public.profiles
for select to authenticated using (id = auth.uid() or public.is_owner());

drop policy if exists "Owners manage profiles" on public.profiles;
create policy "Owners manage profiles" on public.profiles
for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public reads active categories" on public.categories;
create policy "Public reads active categories" on public.categories
for select to anon, authenticated using (active or public.is_owner());

drop policy if exists "Owners manage categories" on public.categories;
create policy "Owners manage categories" on public.categories
for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public reads active brands" on public.brands;
create policy "Public reads active brands" on public.brands
for select to anon, authenticated using (active or public.is_owner());

drop policy if exists "Owners manage brands" on public.brands;
create policy "Owners manage brands" on public.brands
for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public reads active products" on public.products;
create policy "Public reads active products" on public.products
for select to anon, authenticated using (active or public.is_owner());

drop policy if exists "Owners manage products" on public.products;
create policy "Owners manage products" on public.products
for all to authenticated using (public.is_owner()) with check (public.is_owner());

drop policy if exists "Public reads site settings" on public.site_settings;
create policy "Public reads site settings" on public.site_settings
for select to anon, authenticated using (true);

drop policy if exists "Owners manage site settings" on public.site_settings;
create policy "Owners manage site settings" on public.site_settings
for all to authenticated using (public.is_owner()) with check (public.is_owner());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'catalog-images',
  'catalog-images',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "Public reads catalogue images" on storage.objects;
create policy "Public reads catalogue images" on storage.objects
for select to anon, authenticated using (bucket_id = 'catalog-images');

drop policy if exists "Owners upload catalogue images" on storage.objects;
create policy "Owners upload catalogue images" on storage.objects
for insert to authenticated with check (bucket_id = 'catalog-images' and public.is_owner());

drop policy if exists "Owners update catalogue images" on storage.objects;
create policy "Owners update catalogue images" on storage.objects
for update to authenticated using (bucket_id = 'catalog-images' and public.is_owner())
with check (bucket_id = 'catalog-images' and public.is_owner());

drop policy if exists "Owners delete catalogue images" on storage.objects;
create policy "Owners delete catalogue images" on storage.objects
for delete to authenticated using (bucket_id = 'catalog-images' and public.is_owner());

insert into public.site_settings (id) values (1)
on conflict (id) do nothing;

insert into public.categories (id, name, short_name, description, image_url, sort_order) values
('air-conditioners', 'Air Conditioners', 'Cooling', 'Split, standing, inverter and low-voltage cooling solutions.', '/assets/products/hisense-1-5hp-ac.jpg', 1),
('televisions', 'Televisions & Home Theater', 'Viewing', 'Smart 4K UHD, QLED TVs and immersive home entertainment.', '/assets/products/samsung-65-qled-clean.jpg', 2),
('refrigeration', 'Refrigerators & Freezers', 'Freshness', 'Energy-efficient cooling for homes, offices, and shops.', '/assets/products/hisense-fridge-1.jpg', 3),
('laundry', 'Washing Machines', 'Laundry', 'Front-load, top-load and twin-tub automatic washers.', '/assets/products/midea-washing-machine.jpg', 4),
('fans', 'Rechargeable & Standing Fans', 'Airflow', 'Heavy-duty standing, ceiling, and rechargeable mist fans.', '/assets/products/royal-standing-fan.jpg', 5),
('lighting', 'Lighting & Fixtures', 'Lighting', 'Energy-saving LED panel lights, spotlights and ceiling fixtures.', '/assets/products/led-ceiling-light.jpg', 6),
('electrical-materials', 'Electrical Materials & Wiring', 'Wiring', 'Cables, switches, sockets, changeovers and installation essentials.', '/assets/products/copper-cable-coil.jpg', 7),
('kitchen', 'Kitchen Appliances', 'Kitchen', 'Gas cookers, microwave ovens, blenders and dispensers.', '/assets/products/bruhm-microwave.jpg', 8),
('audio', 'Audio Systems & Electronics', 'Audio', 'Bluetooth soundbars, home theater sets and stabilizers.', '/assets/products/dolby-soundbar.jpg', 9)
on conflict (id) do update set
  name = excluded.name,
  short_name = excluded.short_name,
  description = excluded.description,
  image_url = excluded.image_url,
  sort_order = excluded.sort_order;

insert into public.brands (name, logo_url, logo_dark_url, tagline, category_tags, sort_order) values
('Hisense', '/assets/brands/hisense logo.png', null, 'Cooling, television and refrigeration options', array['Inverter Split ACs','Smart TVs','Refrigerators','Chest Freezers'], 1),
('LG', '/assets/brands/LG logo.png', null, 'Television, laundry and home-entertainment options', array['Smart UHD TVs','InstaView Fridges','Direct Drive Washers','Soundbars'], 2),
('Samsung', '/assets/brands/Samsung logo.png', null, 'Televisions, refrigeration and audio options', array['QLED 4K TVs','Double Door Fridges','Dolby Soundbars','WindFree ACs'], 3),
('Midea', '/assets/brands/Midea logo.png', null, 'Cooling, laundry and water-dispenser options', array['Inverter Split ACs','Front Load Washers','Bottom Loading Dispensers'], 4),
('Royal', '/assets/brands/royal logo.png', '/assets/brands/royal-dark.png', 'Fans, freezers and cooking-appliance options', array['Rechargeable Fans','Standing Fans','Deep Freezers','Gas Cookers'], 5),
('Bruhm', '/assets/brands/bruhm logo.png', '/assets/brands/bruhm-dark.png', 'Kitchen and household appliance options', array['Microwaves','Standing Cookers','Single Door Fridges'], 6),
('Polystar', '/assets/brands/polystar logo.png', null, 'Audio, television and appliance options', array['Bluetooth Audio','Smart TVs','Table Top Fridges'], 7)
on conflict (name) do update set
  logo_url = excluded.logo_url,
  logo_dark_url = excluded.logo_dark_url,
  tagline = excluded.tagline,
  category_tags = excluded.category_tags,
  sort_order = excluded.sort_order;

insert into public.products (slug, name, category_id, brand_name, description, specs, image_url, featured, sort_order) values
('hisense-1-5hp-inverter-split-ac', 'Hisense 1.5HP Inverter Split AC', 'air-conditioners', 'Hisense', 'A 1.5HP inverter split air-conditioner example for bedrooms and medium-sized rooms. Confirm the exact model and package with the store.', array['1.5HP capacity','Inverter model','Split-unit format','Confirm exact features on enquiry'], '/assets/products/hisense-1-5hp-ac.jpg', true, 1),
('midea-2hp-split-ac', 'Midea 2HP Split AC', 'air-conditioners', 'Midea', 'A 2HP split air-conditioner example for larger rooms and shared spaces. Confirm the exact model and specifications with the store.', array['2.0HP capacity','Split-unit format','For larger rooms','Confirm exact features on enquiry'], '/assets/products/midea-2hp-ac-set.png', true, 2),
('lg-55-smart-4k-uhd-tv', 'LG 55-inch Smart 4K UHD TV', 'televisions', 'LG', 'A 55-inch smart television example for living rooms and entertainment spaces. Confirm the exact model, software and accessories with the store.', array['55-inch screen','4K UHD class','Smart TV format','Confirm exact features on enquiry'], '/assets/products/lg-55-4k-tv.jpg', true, 3),
('samsung-65-qled-smart-tv', 'Samsung 65-inch QLED 4K Smart TV', 'televisions', 'Samsung', 'A 65-inch smart television example for larger home-entertainment spaces. Confirm the exact model and specifications with the store.', array['65-inch screen','4K QLED class','Smart TV format','Confirm exact features on enquiry'], '/assets/products/samsung-65-qled-clean.jpg', true, 4),
('hisense-double-door-refrigerator', 'Hisense Double Door Refrigerator', 'refrigeration', 'Hisense', 'A double-door refrigerator example for family homes and shared spaces. Confirm capacity, finish and features with the store.', array['Double-door format','For home use','Multiple capacity options','Confirm exact features on enquiry'], '/assets/products/hisense-fridge-1.jpg', true, 5),
('midea-front-load-washing-machine', 'Midea Front Load Automatic Washing Machine', 'laundry', 'Midea', 'A front-load washing-machine example for home laundry. Confirm capacity, programs and model features with the store.', array['Front-load format','Automatic washing machine','Multiple capacities may be available','Confirm exact features on enquiry'], '/assets/products/midea-washing-machine.jpg', true, 6),
('royal-standing-fan', 'Royal Standing Fan', 'fans', 'Royal', 'A standing-fan example for household and office use. Confirm fan size, controls and model features with the store.', array['Standing-fan format','For household or office use','Multiple sizes may be available','Confirm exact features on enquiry'], '/assets/products/royal-standing-fan.jpg', false, 7),
('led-ceiling-light', 'LED Ceiling Panel Light', 'lighting', 'Generic', 'An LED lighting example for indoor spaces. Ask the store about sizes, colour temperatures and suitable fittings.', array['LED lighting','Indoor-use example','Different sizes may be available','Confirm exact features on enquiry'], '/assets/products/led-ceiling-light.jpg', false, 8),
('electrical-cable', 'Single Core Electrical Cable (1.5mm / 2.5mm / 4mm)', 'electrical-materials', 'Generic', 'An electrical cable example for installation projects. Ask a qualified electrician and the store team to help identify a suitable size and type.', array['1.5mm, 2.5mm and 4mm options','For electrical installations','Confirm roll length and material on enquiry','Use qualified installation support'], '/assets/products/copper-cable-coil.jpg', true, 9),
('wall-socket', 'Double Gang Switched Wall Socket', 'electrical-materials', 'Generic', 'A switched wall-socket example for electrical installation work. Confirm ratings, finish and configuration with the store.', array['Double-gang format','For electrical installations','Different configurations may be available','Confirm exact features on enquiry'], '/assets/products/switched-wall-socket.jpg', false, 10),
('bruhm-microwave', 'Bruhm Microwave Oven', 'kitchen', 'Bruhm', 'A microwave-oven example for everyday kitchen use. Confirm capacity, functions and exact model with the store.', array['Kitchen appliance','Multiple capacities may be available','For reheating and food preparation','Confirm exact features on enquiry'], '/assets/products/bruhm-microwave.jpg', false, 11),
('soundbar', 'Bluetooth Soundbar', 'audio', 'Generic', 'A soundbar example for home-entertainment setups. Confirm audio inputs, included accessories and exact model with the store.', array['Home-entertainment audio','Bluetooth option','For TV setups','Confirm exact features on enquiry'], '/assets/products/dolby-soundbar.jpg', false, 12)
on conflict (slug) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  brand_name = excluded.brand_name,
  description = excluded.description,
  specs = excluded.specs,
  image_url = excluded.image_url,
  featured = excluded.featured,
  sort_order = excluded.sort_order;

do $$
declare
  table_name text;
begin
  foreach table_name in array array['categories', 'brands', 'products', 'site_settings']
  loop
    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = table_name
    ) then
      execute format('alter publication supabase_realtime add table public.%I', table_name);
    end if;
  end loop;
end;
$$;
