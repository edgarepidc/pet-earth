import { NextResponse } from 'next/server';

import { parseClockToIso, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { PUBLIC_BRANCH_ID } from '@/lib/clinic';
import { getTutorContext } from '@/lib/tutor';

export async function POST(request: Request) {
  const tutor = await getTutorContext();
  if (!tutor) return NextResponse.json({ error: 'Inicia sesión para agendar.' }, { status: 401 });

  const body = (await request.json()) as {
    patientId?: string;
    date?: string;
    time?: string;
    reason?: string;
  };
  if (!body.patientId || !body.date || !body.time) {
    return NextResponse.json({ error: 'Mascota, fecha y hora son obligatorios.' }, { status: 400 });
  }
  if (body.date < todayMexicoYmd()) {
    return NextResponse.json({ error: 'Elige un día de hoy en adelante.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('id, client_id, organization_id, name')
    .eq('id', body.patientId)
    .eq('client_id', tutor.clientId)
    .eq('is_active', true)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: 'Mascota no encontrada.' }, { status: 404 });

  let branchId = tutor.preferredBranchId;
  if (branchId) {
    const { data: allowed } = await supabase
      .from('branches')
      .select('id')
      .eq('id', branchId)
      .eq('organization_id', patient.organization_id)
      .eq('is_active', true)
      .maybeSingle();
    if (!allowed) branchId = null;
  }
  if (!branchId) {
    const { data: fallback } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', patient.organization_id)
      .eq('is_active', true)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    branchId = fallback?.id ?? PUBLIC_BRANCH_ID;
  }

  const reason = body.reason?.trim() || 'Consulta';
  const startsAt = parseClockToIso(body.date, body.time);
  const ends = new Date(startsAt);
  ends.setMinutes(ends.getMinutes() + 60);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: patient.organization_id,
      branch_id: branchId,
      client_id: patient.client_id,
      patient_id: patient.id,
      starts_at: startsAt,
      ends_at: ends.toISOString(),
      reason,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('reminders').insert({
    organization_id: patient.organization_id,
    client_id: patient.client_id,
    patient_id: patient.id,
    appointment_id: data.id,
    kind: 'appointment',
    title: reason,
    due_on: body.date,
  });

  return NextResponse.json({ id: data.id });
}
