-- Apply after 001 and 002. No accounts are granted access automatically.
begin;
alter table public.profiles drop constraint if exists profiles_role_check;
alter table public.profiles add constraint profiles_role_check check (role in ('owner','admin','staff'));
-- Fail safely if multiple owners already exist; never silently demote an owner.
create unique index if not exists profiles_single_owner on public.profiles (role) where role = 'owner';

create or replace function public.is_catalog_admin()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.profiles where id = auth.uid() and role in ('owner','admin')); $$;
revoke all on function public.is_catalog_admin() from public;
grant execute on function public.is_catalog_admin() to anon, authenticated;

-- Access changes go through an authenticated owner-only Edge Function.
-- Nobody can promote themselves using a direct browser/database request.
revoke insert, update, delete on public.profiles from anon, authenticated;
drop policy if exists "Owners manage profiles" on public.profiles;

do $$ declare item text; begin
  foreach item in array array['products','categories','brands','site_settings','product_subcategories'] loop
    -- Also covers installations that enable team access after subcategories.
    if to_regclass('public.' || item) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', 'Owners manage ' || case when item = 'site_settings' then 'site settings' else item end, item);
    execute format('drop policy if exists %I on public.%I', 'Approved admins manage content', item);
    execute format('create policy %I on public.%I for all to authenticated using (public.is_catalog_admin()) with check (public.is_catalog_admin())', 'Approved admins manage content', item);
  end loop;
end $$;

drop policy if exists "Owners upload catalogue images" on storage.objects;
drop policy if exists "Owners update catalogue images" on storage.objects;
drop policy if exists "Owners delete catalogue images" on storage.objects;
create policy "Owners upload catalogue images" on storage.objects for insert to authenticated with check(bucket_id = 'catalog-images' and public.is_catalog_admin());
create policy "Owners update catalogue images" on storage.objects for update to authenticated using(bucket_id = 'catalog-images' and public.is_catalog_admin()) with check(bucket_id = 'catalog-images' and public.is_catalog_admin());
create policy "Owners delete catalogue images" on storage.objects for delete to authenticated using(bucket_id = 'catalog-images' and public.is_catalog_admin());
commit;
