import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { clearTenantCookies } from '@/lib/tenant';

export async function POST() {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  await clearTenantCookies();
  return NextResponse.json({ ok: true, redirect: '/plataforma' });
}
