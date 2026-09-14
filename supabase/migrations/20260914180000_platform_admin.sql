-- Super admin de plataforma: puede ver y crear cualquier clínica/sucursal.
-- El personal de una clínica sigue limitado a su organization_id.

create or replace function public.is_platform_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_platform_admin
  );
$$;

create or replace function public.is_staff_of_org(target_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.staff_memberships sm
      where sm.user_id = auth.uid()
        and sm.organization_id = target_org_id
        and sm.status = 'active'
    );
$$;

create or replace function public.is_staff_of_branch(target_branch_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_platform_admin()
    or exists (
      select 1
      from public.staff_memberships sm
      join public.branches b on b.id = target_branch_id
      where sm.user_id = auth.uid()
        and sm.status = 'active'
        and sm.organization_id = b.organization_id
    );
$$;

drop policy if exists "platform read orgs" on public.organizations;
create policy "platform read orgs" on public.organizations
  for select to authenticated using (public.is_platform_admin());

drop policy if exists "platform write orgs" on public.organizations;
create policy "platform write orgs" on public.organizations
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "platform read branches" on public.branches;
create policy "platform read branches" on public.branches
  for select to authenticated using (public.is_platform_admin());

drop policy if exists "platform write branches" on public.branches;
create policy "platform write branches" on public.branches
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

drop policy if exists "platform manage memberships" on public.staff_memberships;
create policy "platform manage memberships" on public.staff_memberships
  for all to authenticated
  using (public.is_platform_admin())
  with check (public.is_platform_admin());

grant execute on function public.is_platform_admin() to authenticated;
