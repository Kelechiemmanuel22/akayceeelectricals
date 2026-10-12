-- Optional owner-entered prices only. Never seed invented prices.
begin;
alter table public.products add column if not exists price numeric(12,2);
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price is null or price >= 0);
comment on column public.products.price is 'Optional catalogue price in NGN. Null means enquire with the store.';
commit;
