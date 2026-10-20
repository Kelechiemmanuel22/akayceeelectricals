-- Cover persistence, backward compatibility, input validation and Storage RLS.
-- All writes below are isolated and rolled back.
begin;
do $$ begin
  perform set_config('request.jwt.claims', jsonb_build_object('sub',
    (select id from public.profiles where role = 'owner' limit 1), 'role','authenticated')::text, true);
end $$;
set local role authenticated;
do $$
declare snapshot jsonb; legacy jsonb; rev bigint; test_id text;
begin
  if not public.can_manage_deals() then raise exception 'Owner access is required for this test'; end if;
  snapshot := public.read_deals_catalog(); rev := (snapshot->>'revision')::bigint;
  test_id := snapshot->'combos'->0->>'id';
  if test_id is null then raise exception 'Publish initial deals before running the cover test'; end if;
  snapshot := jsonb_set(snapshot, '{combos,0,coverImage}', '"/assets/deals/student-life-v1.jpg"'::jsonb);
  snapshot := jsonb_set(snapshot, '{combos,0,coverAlt}', '"Campus comfort cover"'::jsonb);
  perform public.save_deals_catalog(snapshot, rev);
  if not exists (select 1 from public.combo_deals where id = test_id
    and cover_image_url = '/assets/deals/student-life-v1.jpg' and cover_alt = 'Campus comfort cover') then
    raise exception 'Cover was not saved';
  end if;
  legacy := jsonb_set(snapshot, '{combos}', (select jsonb_agg(x - 'coverImage' - 'coverAlt') from jsonb_array_elements(snapshot->'combos') x));
  perform public.save_deals_catalog(legacy, rev + 1);
  if (select cover_image_url from public.combo_deals where id = test_id) <> '/assets/deals/student-life-v1.jpg' then
    raise exception 'Old client erased an existing cover';
  end if;
  begin
    perform public.save_deals_catalog(jsonb_set(snapshot, '{combos,0,coverImage}', '"javascript:alert(1)"'::jsonb), rev + 2);
    raise exception 'Unsafe cover URL was accepted';
  exception when check_violation then null;
  end;
  begin
    perform public.save_deals_catalog(jsonb_set(snapshot, '{combos,0,coverImage}', '123'::jsonb), rev + 2);
    raise exception 'Non-text cover was accepted';
  exception when invalid_parameter_value then null;
  end;
  snapshot := jsonb_set(snapshot, '{combos,0,coverImage}', '""'::jsonb);
  perform public.save_deals_catalog(snapshot, rev + 2);
  if (select cover_image_url from public.combo_deals where id = test_id) <> '' then raise exception 'Cover removal failed'; end if;
  insert into storage.objects(bucket_id, name) values ('deal-covers', 'combos/owner-policy-check.png');
end $$;

-- Storage API uses these same row policies: a non-admin cannot upload.
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"00000000-0000-4000-8000-000000000000","role":"authenticated"}', true);
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values ('deal-covers','combos/forbidden-policy-check.png');
    raise exception 'Non-admin uploaded a deal cover';
  exception when insufficient_privilege then null;
  end;
end $$;
set local role anon;
do $$ begin
  begin
    insert into storage.objects(bucket_id,name) values ('deal-covers','combos/anonymous-policy-check.png');
    raise exception 'Anonymous caller uploaded a deal cover';
  exception when insufficient_privilege then null;
  end;
end $$;
rollback;
