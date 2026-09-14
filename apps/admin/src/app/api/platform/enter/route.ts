import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { resolveTenantByIds, writeTenantCookies } from '@/lib/tenant';

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

  await writeTenantCookies(tenant);
  return NextResponse.json({ ok: true, redirect: '/' });
}
