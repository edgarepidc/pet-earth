import { NextResponse } from 'next/server';

import { SEXES, SPECIES, type Sex, type Species } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

function blankToNull(value?: string | null) {
  const trimmed = value?.trim();
  return trimmed ? trimmed : null;
}

function parseSpecies(value: unknown): Species {
  return SPECIES.includes(value as Species) ? (value as Species) : 'dog';
}

function parseSex(value: unknown): Sex {
  return SEXES.includes(value as Sex) ? (value as Sex) : 'unknown';
}

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
      species: parseSpecies(body.species),
      breed: blankToNull(body.breed),
      sex: parseSex(body.sex),
      neutered: Boolean(body.neutered),
      birth_date: blankToNull(body.birthDate),
      microchip: blankToNull(body.microchip),
      allergies: blankToNull(body.allergies),
      alerts: blankToNull(body.alerts),
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    species?: Species;
    breed?: string;
    sex?: Sex;
    neutered?: boolean;
    birthDate?: string;
    microchip?: string;
    color?: string;
    allergies?: string;
    alerts?: string;
    isActive?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: 'Falta el paciente.' }, { status: 400 });
  if (!body.name?.trim()) {
    return NextResponse.json({ error: 'El nombre de la mascota es obligatorio.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('id')
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: 'Paciente no encontrado.' }, { status: 404 });

  const { error } = await supabase
    .from('patients')
    .update({
      name: body.name.trim(),
      species: parseSpecies(body.species),
      breed: blankToNull(body.breed),
      sex: parseSex(body.sex),
      neutered: Boolean(body.neutered),
      birth_date: blankToNull(body.birthDate),
      microchip: blankToNull(body.microchip),
      color: blankToNull(body.color),
      allergies: blankToNull(body.allergies),
      alerts: blankToNull(body.alerts),
      is_active: body.isActive !== false,
      updated_at: new Date().toISOString(),
    })
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
