import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { sendClinicEmail } from '@/lib/email';
import { loadFollowUps } from '@/lib/queries';

export async function GET() {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  try {
    const reminders = await loadFollowUps(auth.organizationId);
    return NextResponse.json({ reminders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as { id?: string; status?: 'done' | 'cancelled'; action?: string };
  if (!body.id) return NextResponse.json({ error: 'Falta el recordatorio' }, { status: 400 });
  const supabase = createAdminClient();

  if (body.action === 'email') {
    const { data: reminder } = await supabase
      .from('reminders')
      .select('id, title, due_on, client_id, patient_id, clients(full_name, email), patients(name)')
      .eq('id', body.id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!reminder) return NextResponse.json({ error: 'Recordatorio no encontrado.' }, { status: 404 });
    const client = Array.isArray(reminder.clients) ? reminder.clients[0] : reminder.clients;
    const patient = Array.isArray(reminder.patients) ? reminder.patients[0] : reminder.patients;
    const to = client?.email?.trim();
    if (!to || !to.includes('@')) {
      return NextResponse.json({ error: 'Ese tutor no tiene correo.' }, { status: 400 });
    }
    const sent = await sendClinicEmail({
      to,
      clinicName: auth.organizationName,
      tutorName: client?.full_name ?? 'tutor',
      patientName: patient?.name ?? 'tu mascota',
      title: reminder.title,
      dueOn: reminder.due_on,
      branchName: auth.branchName,
    });
    if (!sent.ok) return NextResponse.json({ error: sent.error }, { status: 400 });
    await supabase
      .from('reminders')
      .update({ last_emailed_at: new Date().toISOString() })
      .eq('id', reminder.id);
    return NextResponse.json({ ok: true });
  }

  if (!body.status) return NextResponse.json({ error: 'Falta el recordatorio' }, { status: 400 });
  const { error } = await supabase
    .from('reminders')
    .update({ status: body.status })
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
