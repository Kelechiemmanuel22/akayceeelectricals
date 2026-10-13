begin;
alter table public.products add column if not exists price_is_estimate boolean not null default false;
alter table public.products add column if not exists price_note text not null default '';
comment on column public.products.price_is_estimate is 'True for researched guide prices, not confirmed store selling prices.';
commit;
