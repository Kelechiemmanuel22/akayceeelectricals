-- Keep one SELECT policy per role/table while retaining public visibility and staff drafts.
alter policy "Read live deal collections" on public.deal_collections to anon;
alter policy "Read live combo packages" on public.combo_deals to anon;
alter policy "Read live package contents" on public.combo_deal_items to anon;
drop policy "Staff manage deal collections" on public.deal_collections;
drop policy "Staff manage combo packages" on public.combo_deals;
drop policy "Staff manage package contents" on public.combo_deal_items;

create policy "Authenticated read deal collections" on public.deal_collections for select to authenticated using (
  (select public.can_manage_deals()) or (
    active and (starts_at is null or starts_at <= now()) and (ends_at is null or ends_at > now())
    and (select enabled from public.deal_settings where id = 1)
  )
);
create policy "Authenticated read combo packages" on public.combo_deals for select to authenticated using (
  (select public.can_manage_deals()) or (active and exists (select 1 from public.deal_collections c where c.id = collection_id))
);
create policy "Authenticated read package contents" on public.combo_deal_items for select to authenticated using (
  (select public.can_manage_deals()) or exists (select 1 from public.combo_deals c where c.id = combo_id)
);
create policy "Staff insert deal collections" on public.deal_collections for insert to authenticated with check ((select public.can_manage_deals()));
create policy "Staff update deal collections" on public.deal_collections for update to authenticated using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Staff insert combo packages" on public.combo_deals for insert to authenticated with check ((select public.can_manage_deals()));
create policy "Staff update combo packages" on public.combo_deals for update to authenticated using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Staff insert package contents" on public.combo_deal_items for insert to authenticated with check ((select public.can_manage_deals()));
create policy "Staff update package contents" on public.combo_deal_items for update to authenticated using ((select public.can_manage_deals())) with check ((select public.can_manage_deals()));
create policy "Staff delete package contents" on public.combo_deal_items for delete to authenticated using ((select public.can_manage_deals()));
