import { NextResponse } from 'next/server';

import { addMexicoDays, parseClockToIso, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { loadAppointmentsInRange, loadDayAppointments } from '@/lib/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const view = url.searchParams.get('view') ?? 'day';
  const ymd = url.searchParams.get('date') ?? todayMexicoYmd();

  try {
    if (view === 'day') {
      const rows = await loadDayAppointments(auth.branchId, ymd);
      return NextResponse.json({ appointments: rows });
    }
    const start = url.searchParams.get('start') ?? ymd;
    const end = url.searchParams.get('end') ?? addMexicoDays(ymd, 7);
    const rows = await loadAppointmentsInRange(
      auth.branchId,
      `${start}T00:00:00-06:00`,
      `${end}T00:00:00-06:00`,
    );
    return NextResponse.json({ appointments: rows });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 400 });
  }
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;

  const body = (await request.json()) as {
    patientId?: string;
    date?: string;
    time?: string;
    durationMin?: number;
    reason?: string;
  };
  if (!body.patientId || !body.date || !body.time) {
    return NextResponse.json({ error: 'Paciente, fecha y hora son obligatorios.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('id, client_id, organization_id')
    .eq('id', body.patientId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!patient) return NextResponse.json({ error: 'Paciente no encontrado' }, { status: 404 });

  const startsAt = parseClockToIso(body.date, body.time);
  const duration = body.durationMin ?? 30;
  const ends = new Date(startsAt);
  ends.setMinutes(ends.getMinutes() + duration);

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: auth.organizationId,
      branch_id: auth.branchId,
      client_id: patient.client_id,
      patient_id: patient.id,
      vet_id: auth.role === 'vet' ? auth.userId : null,
      starts_at: startsAt,
      ends_at: ends.toISOString(),
      reason: body.reason?.trim() || null,
      status: 'scheduled',
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  await supabase.from('reminders').insert({
    organization_id: auth.organizationId,
    client_id: patient.client_id,
    patient_id: patient.id,
    appointment_id: data.id,
    kind: 'appointment',
    title: 'Cita clínica',
    due_on: body.date,
  });

  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    id?: string;
    action?: string;
    date?: string;
    time?: string;
  };
  if (!body.id || !body.action) {
    return NextResponse.json({ error: 'Falta la acción' }, { status: 400 });
  }

  const userClient = await createSupabaseServerClient();
  if (body.action === 'check-in') {
    const { error } = await userClient.rpc('pe_check_in_appointment', { p_appointment_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'start-visit') {
    const { data, error } = await userClient.rpc('pe_start_visit', { p_appointment_id: body.id });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ visitId: data });
  }
  if (body.action === 'cancel' || body.action === 'no_show') {
    const admin = createAdminClient();
    const { error } = await admin
      .from('appointments')
      .update({ status: body.action === 'cancel' ? 'cancelled' : 'no_show' })
      .eq('id', body.id)
      .eq('organization_id', auth.organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'reschedule') {
    if (!body.date || !body.time) {
      return NextResponse.json({ error: 'Fecha y hora son obligatorias para reagendar.' }, { status: 400 });
    }
    const admin = createAdminClient();
    const { data: appointment } = await admin
      .from('appointments')
      .select('id, starts_at, ends_at, client_id, patient_id')
      .eq('id', body.id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!appointment) return NextResponse.json({ error: 'Cita no encontrada.' }, { status: 404 });
    const durationMs = new Date(appointment.ends_at).getTime() - new Date(appointment.starts_at).getTime();
    const startsAt = parseClockToIso(body.date, body.time);
    const ends = new Date(new Date(startsAt).getTime() + Math.max(durationMs, 15 * 60 * 1000));
    const { error } = await admin
      .from('appointments')
      .update({ starts_at: startsAt, ends_at: ends.toISOString(), status: 'scheduled' })
      .eq('id', appointment.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await admin
      .from('reminders')
      .update({ due_on: body.date, status: 'pending', title: 'Cita clínica (reagendada)' })
      .eq('appointment_id', appointment.id);
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
}
