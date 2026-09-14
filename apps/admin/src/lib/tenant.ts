import { createAdminClient } from '@petearth/supabase/admin';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export interface TenantContext {
  organizationId: string;
  organizationName: string;
  branchId: string;
  branchName: string;
  branchSlug: string;
}

export async function resolveTenantForUser(userId: string): Promise<TenantContext | null> {
  const supabase = createAdminClient();
  const { data: memberships } = await supabase
    .from('staff_memberships')
    .select('organization_id, branch_id, role')
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('created_at', { ascending: true });

  const membership = memberships?.[0];
  if (!membership) return null;

  const { data: org } = await supabase
    .from('organizations')
    .select('id, name')
    .eq('id', membership.organization_id)
    .single();
  if (!org) return null;

  let branch: { id: string; name: string; slug: string } | null = null;
  if (membership.branch_id) {
    const { data } = await supabase
      .from('branches')
      .select('id, name, slug')
      .eq('id', membership.branch_id)
      .maybeSingle();
    branch = data;
  }
  if (!branch) {
    const { data } = await supabase
      .from('branches')
      .select('id, name, slug')
      .eq('organization_id', org.id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    branch = data;
  }
  if (!branch) return null;

  return {
    organizationId: org.id,
    organizationName: org.name,
    branchId: branch.id,
    branchName: branch.name,
    branchSlug: branch.slug,
  };
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
