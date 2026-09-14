import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { PE_BRANCH_COOKIE, PE_ORG_COOKIE } from '@/lib/tenant';

export async function POST() {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const store = await cookies();
  store.delete(PE_ORG_COOKIE);
  store.delete(PE_BRANCH_COOKIE);
  return NextResponse.json({ ok: true, redirect: '/plataforma' });
}
