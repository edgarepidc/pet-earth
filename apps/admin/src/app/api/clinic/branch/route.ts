import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { listOrgBranches, resolveTenantByIds, writeTenantCookies } from '@/lib/tenant';

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json().catch(() => null)) as { branchId?: string } | null;
  if (!body?.branchId) {
    return NextResponse.json({ error: 'Elige una sucursal.' }, { status: 400 });
  }

  const allowed = await listOrgBranches(auth.organizationId);
  if (!allowed.some((branch) => branch.id === body.branchId)) {
    return NextResponse.json({ error: 'Esa sucursal no está en esta clínica.' }, { status: 403 });
  }

  const tenant = await resolveTenantByIds(auth.organizationId, body.branchId);
  if (!tenant) return NextResponse.json({ error: 'Sucursal no encontrada.' }, { status: 404 });

  await writeTenantCookies(tenant);

  if (!auth.viaPlatform) {
    const supabase = createAdminClient();
    await supabase
      .from('staff_memberships')
      .update({ branch_id: tenant.branchId })
      .eq('user_id', auth.userId)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active');
  }

  return NextResponse.json({
    ok: true,
    branchId: tenant.branchId,
    branchName: tenant.branchName,
  });
}
