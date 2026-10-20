-- Run with a database administrator connection. All writes are rolled back.
-- Existing approved-owner identity is looked up internally, never embedded in the file.
begin;
do $$ begin
  if not exists (select 1 from public.profiles where role = 'owner') then
    raise exception 'Create an approved owner before running deal integration tests.';
  end if;
  perform set_config('request.jwt.claims', jsonb_build_object(
    'sub', (select id from public.profiles where role = 'owner' limit 1), 'role', 'authenticated')::text, true);
end $$;
set local role authenticated;
do $$
declare snapshot jsonb; test_payload jsonb; rev bigint;
begin
  if not public.can_manage_deals() then raise exception 'Owner cannot manage deals'; end if;
  snapshot := public.read_deals_catalog(); rev := (snapshot->>'revision')::bigint;
  if jsonb_array_length(snapshot->'collections') = 0 or jsonb_array_length(snapshot->'combos') = 0 then
    raise exception 'Publish the approved initial deals before running these integration tests.';
  end if;
  begin
    perform public.save_deals_catalog(snapshot, rev - 1);
    raise exception 'Stale save was incorrectly accepted';
  exception when serialization_failure then null;
  end;
  begin
    perform public.save_deals_catalog(jsonb_set(snapshot, '{combos,0,items,0,quantity}', '0'::jsonb), rev);
    raise exception 'Invalid quantity was incorrectly accepted';
  exception when invalid_parameter_value then null;
  end;
  begin
    perform public.save_deals_catalog(jsonb_set(snapshot, '{combos,0,items,0,slug}', '"nonexistent-product-slug-test"'::jsonb), rev);
    raise exception 'Missing product was incorrectly accepted';
  exception when foreign_key_violation then null;
  end;
  if (public.read_deals_catalog()->>'revision')::bigint <> rev then raise exception 'Rejected save partially changed deals'; end if;

  test_payload := jsonb_set(snapshot, '{collections}', (snapshot->'collections') || jsonb_build_array(
    (snapshot->'collections'->0) || '{"id":"integration-test-collection","name":"Integration test","active":false,"featured":false}'::jsonb));
  test_payload := jsonb_set(test_payload, '{combos}', (snapshot->'combos') || jsonb_build_array(
    (snapshot->'combos'->0) || '{"id":"integration-test-package","collectionId":"integration-test-collection","name":"Integration test","active":false,"price":null,"priceIsEstimate":false}'::jsonb));
  if public.save_deals_catalog(test_payload, rev) <> rev + 1 then raise exception 'Create did not confirm revision'; end if;
  if not exists (select 1 from public.combo_deals where id = 'integration-test-package' and price is null) then
    raise exception 'Owner could not create a package with an enquiry price';
  end if;
  if (select count(*) from public.combo_deal_items where combo_id = 'integration-test-package') < 2 then
    raise exception 'New package contents were not saved';
  end if;
end $$;

-- Anonymous callers must not see the paused test records.
set local role anon;
do $$ begin
  if exists (select 1 from public.deal_collections where id = 'integration-test-collection')
    or exists (select 1 from public.combo_deals where id = 'integration-test-package')
    or exists (select 1 from public.combo_deal_items where combo_id = 'integration-test-package') then
    raise exception 'Paused test deal leaked to anonymous caller';
  end if;
end $$;

-- A signed-in account with no approved profile has no publishing privileges.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000000","role":"authenticated"}', true);
do $$ begin
  if public.can_manage_deals() then raise exception 'Unapproved account gained staff privileges'; end if;
  if exists (select 1 from public.combo_deals where id = 'integration-test-package') then
    raise exception 'Paused package leaked to unapproved signed-in account';
  end if;
  begin
    perform public.save_deals_catalog('{"enabled":true,"collections":[],"combos":[]}'::jsonb, 0);
    raise exception 'Unapproved account published deals';
  exception when insufficient_privilege then null;
  end;
  update public.deal_settings set enabled = false where id = 1;
  if found then raise exception 'Unapproved account directly changed settings'; end if;
  insert into public.deal_collections(id,name,eyebrow,description,image_url,theme)
    values ('forbidden-test','Forbidden test','Test','Test','/assets/test.jpg','student');
  raise exception 'Unapproved account directly inserted a collection';
exception when insufficient_privilege then null;
end $$;
rollback;
