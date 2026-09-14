import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    clientId?: string;
    name?: string;
    species?: 'dog' | 'cat' | 'other';
    breed?: string;
    sex?: 'male' | 'female' | 'unknown';
    neutered?: boolean;
    birthDate?: string;
    microchip?: string;
    allergies?: string;
    alerts?: string;
  };
  if (!body.clientId || !body.name?.trim()) {
    return NextResponse.json({ error: 'Tutor y nombre de la mascota son obligatorios.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: client } = await supabase
    .from('clients')
    .select('id')
    .eq('id', body.clientId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!client) return NextResponse.json({ error: 'Tutor no encontrado' }, { status: 404 });

  const { data, error } = await supabase
    .from('patients')
    .insert({
      organization_id: auth.organizationId,
      client_id: body.clientId,
      name: body.name.trim(),
      species: body.species ?? 'dog',
      breed: body.breed?.trim() || null,
      sex: body.sex ?? 'unknown',
      neutered: Boolean(body.neutered),
      birth_date: body.birthDate || null,
      microchip: body.microchip?.trim() || null,
      allergies: body.allergies?.trim() || null,
      alerts: body.alerts?.trim() || null,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
