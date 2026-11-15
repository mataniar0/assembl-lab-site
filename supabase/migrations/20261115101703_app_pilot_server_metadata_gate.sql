-- APP MVP-08: a JWT must carry a server-managed app_metadata pilot grant.
-- Only a trusted Supabase Auth administrator may set app_metadata.
-- Never use raw_user_meta_data / user_metadata for authorization.
-- Ownership and source_kind checks remain mandatory.
-- The new policy is deny-by-default: no app user is enabled yet.

alter policy al_app_project_select_own on public.al_app_projects
  using (
    owner_id = (select auth.uid())
    and (select coalesce(auth.jwt() #>> '{app_metadata,assembl_lab_pilot}', '')) = 'enabled'
  );

alter policy al_app_project_insert_own on public.al_app_projects
  with check (
    owner_id = (select auth.uid())
    and source_kind = 'synthetic'
    and (select coalesce(auth.jwt() #>> '{app_metadata,assembl_lab_pilot}', '')) = 'enabled'
  );

alter policy al_app_project_delete_own on public.al_app_projects
  using (
    owner_id = (select auth.uid())
    and (select coalesce(auth.jwt() #>> '{app_metadata,assembl_lab_pilot}', '')) = 'enabled'
  );

alter policy al_app_job_select_own on public.al_app_visualization_jobs
  using (
    owner_id = (select auth.uid())
    and (select coalesce(auth.jwt() #>> '{app_metadata,assembl_lab_pilot}', '')) = 'enabled'
  );

alter policy al_app_job_insert_own on public.al_app_visualization_jobs
  with check (
    owner_id = (select auth.uid())
    and source_kind = 'synthetic'
    and (select coalesce(auth.jwt() #>> '{app_metadata,assembl_lab_pilot}', '')) = 'enabled'
  );
