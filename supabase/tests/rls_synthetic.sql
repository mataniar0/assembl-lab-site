-- MVP-06 / Supabase local-only metadata validation.
-- Execute ONLY after migrations are applied to a local disposable database.
-- These assertions do not replace two-user behavioral RLS testing.

begin;
create extension if not exists pgtap with schema extensions;
select plan(14);

select has_table('public','al_app_projects','project table exists');
select has_table('public','al_app_visualization_jobs','job table exists');

select ok((select relrowsecurity from pg_catalog.pg_class
  where oid='public.al_app_projects'::regclass),'RLS is enabled for projects');
select ok((select relrowsecurity from pg_catalog.pg_class
  where oid='public.al_app_visualization_jobs'::regclass),'RLS is enabled for jobs');

select ok(not has_table_privilege('anon','public.al_app_projects','select'),
  'anonymous cannot select project rows');
select ok(not has_table_privilege('anon','public.al_app_visualization_jobs','select'),
  'anonymous cannot select job rows');
select ok(not has_table_privilege('authenticated','public.al_app_projects','update'),
  'authenticated cannot update project rows');
select ok(not has_table_privilege('authenticated','public.al_app_visualization_jobs','update'),
  'authenticated cannot update job rows');
select ok(not has_table_privilege('authenticated','public.al_app_visualization_jobs','delete'),
  'authenticated cannot delete individual job rows');

select ok((select count(*)=3 from pg_catalog.pg_policies
  where schemaname='public' and tablename='al_app_projects'
    and roles @> array['authenticated']::name[]),
  'project select insert delete policies exist for authenticated only');
select ok((select count(*)=2 from pg_catalog.pg_policies
  where schemaname='public' and tablename='al_app_visualization_jobs'
    and roles @> array['authenticated']::name[]),
  'job select insert policies exist for authenticated only');

select ok((select count(*)=2 from storage.buckets
  where id in ('al-app-room-inputs','al-app-room-previews') and public=false),
  'both image buckets are private');
select ok((select count(*)=0 from pg_catalog.pg_policies
  where schemaname='storage' and tablename='objects'
    and (policyname like 'al_app%' or policyname like 'al-app%')),
  'our migration has not granted storage object policies');

select ok((select count(*)=2 from pg_catalog.pg_trigger
  where tgrelid in ('public.al_app_projects'::regclass,'public.al_app_visualization_jobs'::regclass)
    and tgname in ('al_app_projects_quota','al_app_jobs_quota')
    and not tgisinternal),
  'both transaction-serialized quota triggers exist');

select * from finish();
rollback;
