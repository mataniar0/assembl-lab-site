-- ASSEMBL LAB / MVP-06 — isolated synthetic-only schema.
-- NOT production photo storage or a paid AI pipeline.
-- Deploy only to a dedicated, inspected Supabase DEVELOPMENT project.
-- Never connect this migration directly to the installed PWA before auth/privacy review.

create schema if not exists app_private;
revoke all on schema app_private from public, anon, authenticated;

create table public.al_app_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  source_kind text not null default 'synthetic' check (source_kind = 'synthetic'),
  design_intent jsonb not null,
  created_at timestamptz not null default now(),
  constraint al_app_project_owner_unique unique (id, owner_id),
  constraint al_app_project_intent_shape check (
    coalesce(jsonb_typeof(design_intent) = 'object', false)
    and coalesce(design_intent->>'schema_version' = 'ASSEMBL-LAB.DESIGN-INTENT.0.1', false)
    and coalesce(design_intent->>'category' = 'freestanding_nightstand', false)
    and coalesce(jsonb_typeof(design_intent->'requested_dimensions_mm') = 'object', false)
    and coalesce(jsonb_typeof(design_intent #> '{requested_dimensions_mm,width}') = 'number', false)
    and coalesce(jsonb_typeof(design_intent #> '{requested_dimensions_mm,height}') = 'number', false)
    and coalesce(jsonb_typeof(design_intent #> '{requested_dimensions_mm,depth}') = 'number', false)
    and (design_intent #>> '{requested_dimensions_mm,width}')::numeric between 200 and 900
    and (design_intent #>> '{requested_dimensions_mm,height}')::numeric between 200 and 1000
    and (design_intent #>> '{requested_dimensions_mm,depth}')::numeric between 250 and 600
    and coalesce(design_intent->>'dimension_confidence' in ('measured','estimated','unknown'), false)
    and coalesce(design_intent #>> '{construction_preferences,material}' = 'birch_plywood', false)
    and coalesce((design_intent #>> '{construction_preferences,nominal_thickness_mm}')::integer in (4,6), false)
    and coalesce(design_intent #>> '{appearance,finish}' in ('natural','honey','walnut'), false)
    and coalesce((design_intent #>> '{appearance,drawers}')::integer in (1,2), false)
    and coalesce(design_intent #>> '{appearance,lower_section}' in ('shelf','closed'), false)
    and pg_catalog.octet_length(design_intent::text) <= 8192
  )
);

create index al_app_projects_owner_idx on public.al_app_projects (owner_id, created_at desc);

create table public.al_app_visualization_jobs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  project_id uuid not null,
  idempotency_key text not null,
  status text not null default 'MOCK_READY' check (status = 'MOCK_READY'),
  provider text not null default 'none' check (provider = 'none'),
  source_kind text not null default 'synthetic' check (source_kind = 'synthetic'),
  input_object_key text check (input_object_key is null),
  output_object_key text check (output_object_key is null),
  created_at timestamptz not null default now(),
  constraint al_app_job_project_owner_fk
    foreign key (project_id, owner_id)
    references public.al_app_projects(id, owner_id) on delete cascade,
  constraint al_app_job_idempotency_key_format
    check (idempotency_key ~ '^[A-Za-z0-9_-]{16,96}$'),
  constraint al_app_job_unique_request unique (owner_id, idempotency_key)
);

create index al_app_jobs_owner_created_idx
  on public.al_app_visualization_jobs (owner_id, created_at desc);
create index al_app_jobs_project_idx
  on public.al_app_visualization_jobs (project_id);

-- Quotas are transaction-serialized per owner; suitable only for synthetic POC.
-- A separate durable spending ledger is mandatory before a paid provider is enabled.
create function app_private.check_project_quota()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(101, pg_catalog.hashtext(new.owner_id::text));
  if (select count(*) from public.al_app_projects where owner_id = new.owner_id) >= 3 then
    raise exception 'SYNTHETIC_PROJECT_LIMIT' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger al_app_projects_quota before insert on public.al_app_projects
for each row execute function app_private.check_project_quota();

create function app_private.check_job_quota()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  perform pg_catalog.pg_advisory_xact_lock(102, pg_catalog.hashtext(new.owner_id::text));
  if (select count(*) from public.al_app_visualization_jobs where owner_id = new.owner_id) >= 5 then
    raise exception 'SYNTHETIC_JOB_LIMIT' using errcode = '23514';
  end if;
  return new;
end;
$$;

create trigger al_app_jobs_quota before insert on public.al_app_visualization_jobs
for each row execute function app_private.check_job_quota();

-- Supabase Data API is deny-by-default for anonymous users and read/write owner-scoped
-- for authenticated users. No service-role or Postgres credentials go in the PWA.
alter table public.al_app_projects enable row level security;
alter table public.al_app_visualization_jobs enable row level security;

revoke all on table public.al_app_projects from public, anon, authenticated;
revoke all on table public.al_app_visualization_jobs from public, anon, authenticated;
grant select, insert, delete on table public.al_app_projects to authenticated;
grant select, insert, delete on table public.al_app_visualization_jobs to authenticated;

create policy al_app_project_select_own
  on public.al_app_projects for select to authenticated
  using (owner_id = (select auth.uid()));

create policy al_app_project_insert_own
  on public.al_app_projects for insert to authenticated
  with check (owner_id = (select auth.uid()) and source_kind = 'synthetic');

create policy al_app_project_delete_own
  on public.al_app_projects for delete to authenticated
  using (owner_id = (select auth.uid()));

create policy al_app_job_select_own
  on public.al_app_visualization_jobs for select to authenticated
  using (owner_id = (select auth.uid()));

create policy al_app_job_insert_own
  on public.al_app_visualization_jobs for insert to authenticated
  with check (owner_id = (select auth.uid()) and source_kind = 'synthetic');

-- Job deletes are intentionally not exposed. Deleting its parent project
-- cascades jobs; future image deletion must also purge private storage.
-- No UPDATE grants or policies exist on either table.

-- Buckets are private and this migration adds ZERO storage.objects policies.
-- Verify that the dedicated project has no pre-existing permissive policies.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('al-app-room-inputs', 'al-app-room-inputs', false, 5242880, array['image/jpeg','image/png','image/webp']),
  ('al-app-room-previews', 'al-app-room-previews', false, 5242880, array['image/jpeg','image/png','image/webp'])
on conflict (id) do nothing;

-- No image uploads or downloads are possible via this application migration.
-- A later migration must add narrow owner/project policies after consent,
-- retention, access logging and deletion have been approved.
