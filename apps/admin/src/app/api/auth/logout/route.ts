import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { clearTenantCookies } from '@/lib/tenant';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  await clearTenantCookies();
  return NextResponse.json({ ok: true });
}
