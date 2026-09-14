import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { PE_BRANCH_COOKIE, PE_ORG_COOKIE, resolveTenantByIds, tenantCookieOptions } from '@/lib/tenant';

export async function POST(request: Request) {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as {
    organizationId?: string;
    branchId?: string;
  } | null;
  if (!body?.organizationId || !body.branchId) {
    return NextResponse.json({ error: 'Clínica y sucursal son obligatorias.' }, { status: 400 });
  }
  const tenant = await resolveTenantByIds(body.organizationId, body.branchId);
  if (!tenant) return NextResponse.json({ error: 'Sucursal no encontrada.' }, { status: 404 });

  const store = await cookies();
  const options = tenantCookieOptions();
  store.set(PE_ORG_COOKIE, tenant.organizationId, options);
  store.set(PE_BRANCH_COOKIE, tenant.branchId, options);
  return NextResponse.json({ ok: true, redirect: '/' });
}
