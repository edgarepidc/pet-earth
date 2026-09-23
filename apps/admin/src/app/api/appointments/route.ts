import { NextResponse } from 'next/server';

import { addMexicoDays, parseClockToIso, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { loadAppointmentPeek, loadAppointmentsInRange, loadDayAppointments } from '@/lib/queries';
import { createSupabaseServerClient } from '@/lib/supabase/server';

async function closeAppointmentReminder(
  appointmentId: string,
  status: 'done' | 'cancelled',
) {
  const admin = createAdminClient();
  await admin
    .from('reminders')
    .update({ status })
    .eq('appointment_id', appointmentId)
    .eq('kind', 'appointment')
    .eq('status', 'pending');
}

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;

  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  const view = url.searchParams.get('view') ?? 'day';
  const ymd = url.searchParams.get('date') ?? todayMexicoYmd();

  try {
    if (id) {
      const peek = await loadAppointmentPeek(auth.organizationId, auth.branchId, id);
      if (!peek) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });
      return NextResponse.json(peek);
    }
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
    vetId?: string | null;
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
  const duration = body.durationMin ?? 60;
  const ends = new Date(startsAt);
  ends.setMinutes(ends.getMinutes() + duration);

  let vetId: string | null = null;
  if (body.vetId) {
    const { data: membership } = await supabase
      .from('staff_memberships')
      .select('user_id')
      .eq('user_id', body.vetId)
      .eq('organization_id', auth.organizationId)
      .eq('status', 'active')
      .eq('role', 'vet')
      .maybeSingle();
    if (!membership) return NextResponse.json({ error: 'Veterinario no válido.' }, { status: 400 });
    vetId = membership.user_id;
  } else if (auth.role === 'vet') {
    vetId = auth.userId;
  }

  const { data, error } = await supabase
    .from('appointments')
    .insert({
      organization_id: auth.organizationId,
      branch_id: auth.branchId,
      client_id: patient.client_id,
      patient_id: patient.id,
      vet_id: vetId,
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

async function completeAppointmentVisit(
  userClient: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  appointmentId: string,
  organizationId: string,
) {
  const admin = createAdminClient();
  const { data: visit } = await admin
    .from('visits')
    .select(
      'id, status, subjective, objective, assessment, plan, weight_kg, temperature_c, heart_rate, respiratory_rate, followup_at',
    )
    .eq('appointment_id', appointmentId)
    .eq('organization_id', organizationId)
    .maybeSingle();

  let visitId = visit?.id ?? null;
  if (!visitId) {
    const started = await userClient.rpc('pe_start_visit', { p_appointment_id: appointmentId });
    if (started.error) return { error: started.error.message };
    visitId = started.data;
  }
  if (!visitId) return { error: 'No se pudo abrir la consulta' };

  if (!visit || visit.status === 'in_progress') {
    const completed = await userClient.rpc('pe_complete_visit', {
      p_visit_id: visitId,
      p_subjective: visit?.subjective ?? null,
      p_objective: visit?.objective ?? null,
      p_assessment: visit?.assessment ?? null,
      p_plan: visit?.plan ?? null,
      p_weight_kg: visit?.weight_kg ?? null,
      p_temperature_c: visit?.temperature_c ?? null,
      p_heart_rate: visit?.heart_rate ?? null,
      p_respiratory_rate: visit?.respiratory_rate ?? null,
      p_followup_on: visit?.followup_at ?? null,
    });
    if (completed.error) return { error: completed.error.message };
  } else {
    const { error } = await admin
      .from('appointments')
      .update({ status: 'completed' })
      .eq('id', appointmentId)
      .eq('organization_id', organizationId);
    if (error) return { error: error.message };
  }
  await closeAppointmentReminder(appointmentId, 'done');
  return { ok: true as const };
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    id?: string;
    action?: string;
    date?: string;
    time?: string;
    status?: string;
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
  if (body.action === 'move') {
    const status = body.status;
    if (!status) return NextResponse.json({ error: 'Falta la columna' }, { status: 400 });
    const admin = createAdminClient();
    const { data: appointment } = await admin
      .from('appointments')
      .select('id, status')
      .eq('id', body.id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!appointment) return NextResponse.json({ error: 'Cita no encontrada' }, { status: 404 });

    const alreadyThere =
      appointment.status === status ||
      (status === 'scheduled' && appointment.status === 'confirmed') ||
      (status === 'no_show' && appointment.status === 'cancelled');
    if (alreadyThere) return NextResponse.json({ ok: true });

    if (status === 'waiting') {
      if (appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') {
        const { error } = await admin
          .from('appointments')
          .update({ status: 'waiting' })
          .eq('id', body.id)
          .eq('organization_id', auth.organizationId);
        if (error) return NextResponse.json({ error: error.message }, { status: 400 });
        return NextResponse.json({ ok: true });
      }
      const { error } = await userClient.rpc('pe_check_in_appointment', { p_appointment_id: body.id });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (status === 'in_consult') {
      const { error } = await userClient.rpc('pe_start_visit', { p_appointment_id: body.id });
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (appointment.status === 'completed' || appointment.status === 'cancelled' || appointment.status === 'no_show') {
        const { error: statusError } = await admin
          .from('appointments')
          .update({ status: 'in_consult' })
          .eq('id', body.id)
          .eq('organization_id', auth.organizationId);
        if (statusError) return NextResponse.json({ error: statusError.message }, { status: 400 });
      }
      return NextResponse.json({ ok: true });
    }
    if (status === 'completed') {
      const result = await completeAppointmentVisit(userClient, body.id, auth.organizationId);
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: 400 });
      return NextResponse.json({ ok: true });
    }
    if (status === 'no_show' || status === 'cancelled' || status === 'scheduled' || status === 'confirmed') {
      const nextStatus = status === 'confirmed' ? 'scheduled' : status;
      const { error } = await admin
        .from('appointments')
        .update({ status: nextStatus })
        .eq('id', body.id)
        .eq('organization_id', auth.organizationId);
      if (error) return NextResponse.json({ error: error.message }, { status: 400 });
      if (nextStatus === 'no_show' || nextStatus === 'cancelled') {
        await closeAppointmentReminder(body.id, 'cancelled');
      }
      return NextResponse.json({ ok: true });
    }
    return NextResponse.json({ error: 'Columna no soportada' }, { status: 400 });
  }
  if (body.action === 'cancel' || body.action === 'no_show') {
    const admin = createAdminClient();
    const { error } = await admin
      .from('appointments')
      .update({ status: body.action === 'cancel' ? 'cancelled' : 'no_show' })
      .eq('id', body.id)
      .eq('organization_id', auth.organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    await closeAppointmentReminder(body.id, 'cancelled');
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
