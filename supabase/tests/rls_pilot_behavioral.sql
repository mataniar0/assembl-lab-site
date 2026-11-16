-- ASSEMBL LAB MVP-08-D: repeatable DEV-only SQL policy behavior checks.
-- WARNING: execute only against a dedicated development project after baseline
-- and app_pilot_server_metadata_gate migrations. Never use on production.
-- Test users/projects exist only within this transaction; ROLLBACK restores DB.
-- No real email deliveries, passwords, JWT issuance, storage uploads or AI calls.
-- Passing these assertions does NOT verify GoTrue login or browser end-to-end.

begin;

insert into auth.users(id,instance_id,aud,role,email,created_at,updated_at)
values
('714a921b-5556-4270-9662-0b4d006e0001','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-pilot-a@example.invalid',now(),now()),
('714a921b-5556-4270-9662-0b4d006e0002','00000000-0000-0000-0000-000000000000','authenticated','authenticated','rls-pilot-b@example.invalid',now(),now());

insert into public.al_app_projects(id,owner_id,source_kind,design_intent) values(
'714a921b-5556-4270-9662-0b4d006e0003',
'714a921b-5556-4270-9662-0b4d006e0001','synthetic',
'{"schema_version":"ASSEMBL-LAB.DESIGN-INTENT.0.1","category":"freestanding_nightstand","requested_dimensions_mm":{"width":500,"height":550,"depth":350},"dimension_confidence":"estimated","appearance":{"finish":"natural","drawers":1,"lower_section":"shelf"},"construction_preferences":{"material":"birch_plywood","nominal_thickness_mm":6}}'::jsonb);
insert into public.al_app_visualization_jobs(id,owner_id,project_id,idempotency_key)
values('714a921b-5556-4270-9662-0b4d006e0004',
'714a921b-5556-4270-9662-0b4d006e0001',
'714a921b-5556-4270-9662-0b4d006e0003','rls_pilot_idem_0001');

set local role authenticated;
-- Authorized owner: can read own rows and insert owner-scoped, synthetic data.
select set_config('request.jwt.claims',
'{"sub":"714a921b-5556-4270-9662-0b4d006e0001","role":"authenticated","app_metadata":{"assembl_lab_pilot":"enabled"}}',true);

do $$
declare j uuid;
begin
  if (select count(*) from public.al_app_projects where id='714a921b-5556-4270-9662-0b4d006e0003')<>1
    then raise exception 'FAIL authorized owner project read'; end if;
  if (select count(*) from public.al_app_visualization_jobs where id='714a921b-5556-4270-9662-0b4d006e0004')<>1
    then raise exception 'FAIL authorized owner job read'; end if;
  insert into public.al_app_visualization_jobs(owner_id,project_id,idempotency_key)
  values('714a921b-5556-4270-9662-0b4d006e0001','714a921b-5556-4270-9662-0b4d006e0003','rls_pilot_idem_0002')
  returning id into j;
  if j is null then raise exception 'FAIL authorized owner job insert'; end if;
end;
$$;

-- Missing server grant: even own rows are not visible, insert is denied.
select set_config('request.jwt.claims',
'{"sub":"714a921b-5556-4270-9662-0b4d006e0001","role":"authenticated","app_metadata":{}}',true);

do $$
declare denied boolean:=false;
begin
  if (select count(*) from public.al_app_projects where id='714a921b-5556-4270-9662-0b4d006e0003')<>0
    then raise exception 'FAIL unapproved project read'; end if;
  if (select count(*) from public.al_app_visualization_jobs where id='714a921b-5556-4270-9662-0b4d006e0004')<>0
    then raise exception 'FAIL unapproved job read'; end if;
  begin
    insert into public.al_app_visualization_jobs(owner_id,project_id,idempotency_key)
    values('714a921b-5556-4270-9662-0b4d006e0001',
    '714a921b-5556-4270-9662-0b4d006e0003','rls_pilot_idem_0003');
  exception when insufficient_privilege or check_violation then denied:=true;
  end;
  if not denied then raise exception 'FAIL unapproved job insert accepted'; end if;
end;
$$;

-- A user cannot self-authorize via editable user_metadata.
select set_config('request.jwt.claims',
'{"sub":"714a921b-5556-4270-9662-0b4d006e0001","role":"authenticated","app_metadata":{},"user_metadata":{"assembl_lab_pilot":"enabled"}}',true);

do $$
begin
  if (select count(*) from public.al_app_projects where id='714a921b-5556-4270-9662-0b4d006e0003')<>0
    then raise exception 'FAIL user_metadata spoofed pilot grant'; end if;
end;
$$;

-- Another authorized pilot still cannot read or delete another owner's data.
select set_config('request.jwt.claims',
'{"sub":"714a921b-5556-4270-9662-0b4d006e0002","role":"authenticated","app_metadata":{"assembl_lab_pilot":"enabled"}}',true);

do $$
declare n int;
declare denied boolean:=false;
begin
  if (select count(*) from public.al_app_projects where id='714a921b-5556-4270-9662-0b4d006e0003')<>0
    then raise exception 'FAIL other owner project read'; end if;
  if (select count(*) from public.al_app_visualization_jobs where id='714a921b-5556-4270-9662-0b4d006e0004')<>0
    then raise exception 'FAIL other owner job read'; end if;
  delete from public.al_app_projects where id='714a921b-5556-4270-9662-0b4d006e0003';
  get diagnostics n = row_count;
  if n<>0 then raise exception 'FAIL cross-owner delete'; end if;
  begin
    insert into public.al_app_visualization_jobs(owner_id,project_id,idempotency_key)
    values('714a921b-5556-4270-9662-0b4d006e0001',
    '714a921b-5556-4270-9662-0b4d006e0003','rls_pilot_idem_0004');
  exception when insufficient_privilege or check_violation then denied:=true;
  end;
  if not denied then raise exception 'FAIL cross-owner job insertion accepted'; end if;
end;
$$;

-- No user can escalate to UPDATE, even when they own a row.
do $$
declare denied boolean:=false;
begin
  begin
    update public.al_app_projects
    set source_kind='synthetic'
    where id='714a921b-5556-4270-9662-0b4d006e0003';
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'FAIL authenticated UPDATE allowed'; end if;
end;
$$;

-- Anonymous role has no direct Data API privileges.
set local role anon;
do $$
declare denied boolean:=false;
begin
  begin
    perform id from public.al_app_projects limit 1;
  exception when insufficient_privilege then denied:=true;
  end;
  if not denied then raise exception 'FAIL anonymous SELECT privilege'; end if;
end;
$$;
rollback;
