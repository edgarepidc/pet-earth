import { NextResponse } from 'next/server';

import { DEFAULT_SPECIES_OPTIONS } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { getTutorContext } from '@/lib/tutor';

export async function POST(request: Request) {
  const tutor = await getTutorContext();
  if (!tutor) return NextResponse.json({ error: 'Inicia sesión para registrar a tu mascota.' }, { status: 401 });

  const body = (await request.json().catch(() => null)) as { name?: string; species?: string } | null;
  const name = body?.name?.trim() ?? '';
  const species = body?.species?.trim() || 'dog';
  if (!name) return NextResponse.json({ error: 'El nombre de la mascota es obligatorio.' }, { status: 400 });

  const admin = createAdminClient();
  const { data: speciesRows } = await admin
    .from('clinic_lists')
    .select('slug')
    .eq('organization_id', tutor.organizationId)
    .eq('list_key', 'species')
    .eq('is_active', true);
  const allowed = new Set([
    ...DEFAULT_SPECIES_OPTIONS.map((item) => item.slug),
    ...(speciesRows ?? []).map((row) => row.slug),
  ]);
  if (!allowed.has(species)) {
    return NextResponse.json({ error: 'Esa especie no está en la lista del consultorio.' }, { status: 400 });
  }

  const { data, error } = await admin
    .from('patients')
    .insert({
      organization_id: tutor.organizationId,
      client_id: tutor.clientId,
      name,
      species,
    })
    .select('id')
    .single();
  if (error || !data) return NextResponse.json({ error: error?.message ?? 'No se pudo guardar la mascota.' }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
