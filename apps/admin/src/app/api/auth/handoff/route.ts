import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { parseAuthHandoff } from '@petearth/shared/handoff';
import type { Database } from '@petearth/supabase';
import { createAdminClient } from '@petearth/supabase/admin';

import { resolveTenantForUser, writeTenantCookies } from '@/lib/tenant';

function loginRedirect(request: Request) {
  const url = new URL('/login', request.url);
  url.searchParams.set('error', 'handoff');
  return NextResponse.redirect(url, 303);
}

export async function POST(request: Request) {
  const form = await request.formData();
  const token = String(form.get('token') ?? '');
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  const payload = parseAuthHandoff(token, secret);
  if (!payload) return loginRedirect(request);

  const cookieStore = await cookies();
  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        },
      },
    },
  );

  const { data, error } = await supabase.auth.setSession({
    access_token: payload.access_token,
    refresh_token: payload.refresh_token,
  });
  if (error || !data.user) return loginRedirect(request);

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('is_platform_admin')
    .eq('id', data.user.id)
    .maybeSingle();
  const tenant = await resolveTenantForUser(data.user.id);
  if (tenant) {
    await writeTenantCookies(tenant);
  } else if (!profile?.is_platform_admin) {
    await supabase.auth.signOut();
    return loginRedirect(request);
  }

  return NextResponse.redirect(new URL(payload.redirect, request.url), 303);
}
