import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { createAuthHandoff } from '@petearth/shared/handoff';
import type { Database } from '@petearth/supabase';
import { createAdminClient } from '@petearth/supabase/admin';

function adminOrigin() {
  const fromEnv = process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, '');
  if (fromEnv) return fromEnv;
  return process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : 'https://pet-earth-admin.vercel.app';
}

export async function POST(request: Request) {
  let email = '';
  let password = '';
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    email = String(body.email ?? '').trim();
    password = String(body.password ?? '');
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }
  if (!email || !password) {
    return NextResponse.json({ error: 'Correo y contraseña son obligatorios.' }, { status: 400 });
  }

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
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    },
  );

  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error || !data.user) {
    return NextResponse.json({ error: 'Correo o contraseña incorrectos.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const [{ data: client }, { data: profile }, { data: membership }] = await Promise.all([
    admin.from('clients').select('id').eq('user_id', data.user.id).maybeSingle(),
    admin.from('profiles').select('is_platform_admin').eq('id', data.user.id).maybeSingle(),
    admin
      .from('staff_memberships')
      .select('id')
      .eq('user_id', data.user.id)
      .eq('status', 'active')
      .limit(1)
      .maybeSingle(),
  ]);

  if (client) {
    return NextResponse.json({ ok: true });
  }

  const isPlatformAdmin = Boolean(profile?.is_platform_admin);
  if (!membership && !isPlatformAdmin) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'Esta cuenta no tiene acceso al consultorio.' }, { status: 403 });
  }

  const session = data.session;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';
  if (!session?.access_token || !session.refresh_token || !secret) {
    await supabase.auth.signOut();
    return NextResponse.json({ error: 'No se pudo abrir el panel.' }, { status: 500 });
  }

  const token = createAuthHandoff(
    {
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      redirect: isPlatformAdmin && !membership ? '/plataforma' : '/',
    },
    secret,
  );
  cookieStore.getAll().forEach((cookie) => {
    if (cookie.name.startsWith('sb-')) cookieStore.delete(cookie.name);
  });
  return NextResponse.json({
    ok: true,
    role: 'staff',
    handoff: {
      action: `${adminOrigin()}/api/auth/handoff`,
      token,
    },
  });
}
