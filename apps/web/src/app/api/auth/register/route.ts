import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { DEFAULT_SPECIES_OPTIONS } from '@petearth/shared';
import type { Database } from '@petearth/supabase';
import { createAdminClient } from '@petearth/supabase/admin';

import { PUBLIC_BRANCH_ID, PUBLIC_ORG_ID } from '@/lib/clinic';

export async function POST(request: Request) {
  let email = '';
  let password = '';
  let fullName = '';
  let phone = '';
  let petName = '';
  let petSpecies = 'dog';
  try {
    const body = (await request.json()) as {
      email?: string;
      password?: string;
      fullName?: string;
      phone?: string;
      petName?: string;
      petSpecies?: string;
    };
    email = String(body.email ?? '').trim().toLowerCase();
    password = String(body.password ?? '');
    fullName = String(body.fullName ?? '').trim();
    phone = String(body.phone ?? '').trim();
    petName = String(body.petName ?? '').trim();
    petSpecies = String(body.petSpecies ?? 'dog').trim();
  } catch {
    return NextResponse.json({ error: 'Datos inválidos.' }, { status: 400 });
  }
  if (!fullName || !email || !password) {
    return NextResponse.json({ error: 'Nombre, correo y contraseña son obligatorios.' }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 });
  }

  const admin = createAdminClient();
  const allowedSpecies = new Set(DEFAULT_SPECIES_OPTIONS.map((item) => item.slug));
  const { data: speciesRows } = await admin
    .from('clinic_lists')
    .select('slug')
    .eq('organization_id', PUBLIC_ORG_ID)
    .eq('list_key', 'species')
    .eq('is_active', true);
  for (const row of speciesRows ?? []) allowedSpecies.add(row.slug);
  if (petName && !allowedSpecies.has(petSpecies)) {
    return NextResponse.json({ error: 'Esa especie no está en la lista del consultorio.' }, { status: 400 });
  }

  const { data: created, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });
  if (createError || !created.user) {
    const message = createError?.message ?? '';
    if (/already|registered|exists/i.test(message)) {
      return NextResponse.json({ error: 'Ese correo ya tiene cuenta. Entra con tu contraseña.' }, { status: 409 });
    }
    return NextResponse.json({ error: 'No se pudo crear la cuenta.' }, { status: 400 });
  }

  const { data: existing } = await admin
    .from('clients')
    .select('id, user_id')
    .eq('organization_id', PUBLIC_ORG_ID)
    .ilike('email', email)
    .maybeSingle();

  let clientId = existing?.id ?? null;
  if (existing?.user_id && existing.user_id !== created.user.id) {
    return NextResponse.json({ error: 'Ese correo ya está ligado a otra cuenta.' }, { status: 409 });
  }
  if (existing && !existing.user_id) {
    const { error } = await admin
      .from('clients')
      .update({
        user_id: created.user.id,
        full_name: fullName,
        phone: phone || null,
        preferred_branch_id: PUBLIC_BRANCH_ID,
      })
      .eq('id', existing.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  } else if (!existing) {
    const { data: client, error } = await admin
      .from('clients')
      .insert({
        organization_id: PUBLIC_ORG_ID,
        user_id: created.user.id,
        full_name: fullName,
        phone: phone || null,
        email,
        preferred_branch_id: PUBLIC_BRANCH_ID,
      })
      .select('id')
      .single();
    if (error || !client) return NextResponse.json({ error: error?.message ?? 'No se pudo guardar el tutor.' }, { status: 400 });
    clientId = client.id;
  }

  if (petName && clientId) {
    const { error } = await admin.from('patients').insert({
      organization_id: PUBLIC_ORG_ID,
      client_id: clientId,
      name: petName,
      species: petSpecies,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
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
  const { error: signError } = await supabase.auth.signInWithPassword({ email, password });
  if (signError) {
    return NextResponse.json({ error: 'La cuenta se creó. Entra con tu correo y contraseña.' }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
