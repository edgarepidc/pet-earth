import { cookies } from 'next/headers';

import { createAdminClient } from '@petearth/supabase/admin';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export const PE_ORG_COOKIE = 'pe_org';
export const PE_BRANCH_COOKIE = 'pe_branch';

export interface TenantContext {
  organizationId: string;
  organizationName: string;
  branchId: string;
  branchName: string;
  branchSlug: string;
}

export interface BranchOption {
  id: string;
  name: string;
  slug: string;
  address: string | null;
}

export function tenantCookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 14,
  };
}

export async function writeTenantCookies(tenant: { organizationId: string; branchId: string }) {
  const store = await cookies();
  const options = tenantCookieOptions();
  store.set(PE_ORG_COOKIE, tenant.organizationId, options);
  store.set(PE_BRANCH_COOKIE, tenant.branchId, options);
}

export async function clearTenantCookies() {
  const store = await cookies();
  store.delete(PE_ORG_COOKIE);
  store.delete(PE_BRANCH_COOKIE);
}

export async function resolveTenantByIds(
  organizationId: string,
  branchId: string,
): Promise<TenantContext | null> {
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', organizationId)
    .maybeSingle();
  if (!org) return null;
  const { data: branch } = await supabase
    .from('branches')
    .select('id, name, slug, organization_id')
    .eq('id', branchId)
    .eq('organization_id', organizationId)
    .maybeSingle();
  if (!branch) return null;
  return {
    organizationId: org.id,
    organizationName: org.name,
    branchId: branch.id,
    branchName: branch.name,
    branchSlug: branch.slug,
  };
}

export async function listOrgBranches(organizationId: string): Promise<BranchOption[]> {
  const supabase = createAdminClient();
  const { data } = await supabase
    .from('branches')
    .select('id, name, slug, address')
    .eq('organization_id', organizationId)
    .eq('is_active', true)
    .order('created_at', { ascending: true });
  return data ?? [];
}

export async function resolveTenantForUser(userId: string): Promise<TenantContext | null> {
  return resolveWorkingTenant(userId, null);
}

export async function resolveWorkingTenant(
  userId: string,
  preferred: { organizationId: string; branchId: string } | null,
): Promise<TenantContext | null> {
  const supabase = createAdminClient();
  const { data: memberships } = await supabase
    .from('staff_memberships')
    .select('organization_id, branch_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  const membership = memberships?.[0];
  if (!membership) return null;

  if (preferred?.organizationId === membership.organization_id) {
    const fromCookie = await resolveTenantByIds(preferred.organizationId, preferred.branchId);
    if (fromCookie) return fromCookie;
  }

  if (membership.branch_id) {
    const home = await resolveTenantByIds(membership.organization_id, membership.branch_id);
    if (home) return home;
  }

  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('organization_id', membership.organization_id)
    .eq('is_active', true)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!branch) return null;
  return resolveTenantByIds(membership.organization_id, branch.id);
}

export async function readTenantCookies(): Promise<{
  organizationId: string;
  branchId: string;
} | null> {
  const store = await cookies();
  const organizationId = store.get(PE_ORG_COOKIE)?.value;
  const branchId = store.get(PE_BRANCH_COOKIE)?.value;
  if (!organizationId || !branchId) return null;
  return { organizationId, branchId };
}

export async function getDefaultTenant(): Promise<TenantContext> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) {
    const tenant = await resolveTenantForUser(user.id);
    if (tenant) return tenant;
  }
  throw new Error('No se encontró la clínica activa.');
}
