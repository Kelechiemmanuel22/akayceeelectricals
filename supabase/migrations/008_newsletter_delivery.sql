begin;
alter table public.newsletter_subscribers add column if not exists unsubscribe_token uuid not null default gen_random_uuid();
create unique index if not exists newsletter_unsubscribe_token_unique on public.newsletter_subscribers(unsubscribe_token);
alter table public.newsletter_campaigns add column if not exists recipient_ids uuid[] not null default '{}';
alter table public.newsletter_campaigns add column if not exists accepted_count integer not null default 0;
alter table public.newsletter_campaigns add column if not exists last_error text not null default '';

-- Addresses alone must not authorize changing another person's preferences.
revoke execute on function public.unsubscribe_newsletter(text) from public, anon, authenticated;
drop policy if exists "Visitors subscribe" on public.newsletter_subscribers;
create or replace function public.unsubscribe_newsletter_token(subscriber_token uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update public.newsletter_subscribers set status = 'unsubscribed', unsubscribed_at = now()
  where unsubscribe_token = subscriber_token and status <> 'suppressed';
end; $$;
revoke all on function public.unsubscribe_newsletter_token(uuid) from public;
grant execute on function public.unsubscribe_newsletter_token(uuid) to anon, authenticated;

-- POST RPC avoids placing a large selected audience in a GET query string.
-- Invoker security retains the owner-only subscriber RLS policy.
create or replace function public.newsletter_campaign_recipients(selected_ids uuid[])
returns table(id uuid, email text, unsubscribe_token uuid)
language sql security invoker set search_path = public as $$
  select s.id, s.email, s.unsubscribe_token from public.newsletter_subscribers s
  where s.id = any(selected_ids) and s.status = 'confirmed' order by s.id;
$$;
revoke all on function public.newsletter_campaign_recipients(uuid[]) from public;
grant execute on function public.newsletter_campaign_recipients(uuid[]) to authenticated;

create or replace function public.subscribe_newsletter(subscriber_email text)
returns void language plpgsql security definer set search_path = public as $$
begin
  if subscriber_email is null or length(trim(subscriber_email)) > 254 or trim(subscriber_email) !~* '^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$' then
    raise exception 'Please enter a valid email address.';
  end if;
  insert into public.newsletter_subscribers(email, status, consent_at)
  values (lower(trim(subscriber_email)), 'confirmed', now())
  on conflict (lower(email)) do update set status = 'confirmed', consent_at = now(), unsubscribed_at = null,
    unsubscribe_token = case when newsletter_subscribers.status = 'unsubscribed' then gen_random_uuid() else newsletter_subscribers.unsubscribe_token end
  where newsletter_subscribers.status <> 'suppressed';
end; $$;
commit;
