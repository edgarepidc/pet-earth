import { NextResponse } from 'next/server';

import { todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { sendClinicEmail } from '@/lib/email';

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  return request.headers.get('authorization') === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  const supabase = createAdminClient();
  const today = todayMexicoYmd();
  const { data: reminders, error } = await supabase
    .from('reminders')
    .select('id, title, due_on, last_emailed_at, organization_id, clients(full_name, email), patients(name)')
    .eq('status', 'pending')
    .lte('due_on', today);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const orgIds = [...new Set((reminders ?? []).map((row) => row.organization_id))];
  const { data: orgs } = orgIds.length
    ? await supabase.from('organizations').select('id, name').in('id', orgIds)
    : { data: [] as { id: string; name: string }[] };
  const orgName = new Map((orgs ?? []).map((org) => [org.id, org.name]));

  let sent = 0;
  let skipped = 0;
  const cutoff = Date.now() - 20 * 60 * 60 * 1000;

  for (const reminder of reminders ?? []) {
    if (reminder.last_emailed_at && new Date(reminder.last_emailed_at).getTime() > cutoff) {
      skipped += 1;
      continue;
    }
    const client = Array.isArray(reminder.clients) ? reminder.clients[0] : reminder.clients;
    const patient = Array.isArray(reminder.patients) ? reminder.patients[0] : reminder.patients;
    const to = client?.email?.trim();
    if (!to || !to.includes('@')) {
      skipped += 1;
      continue;
    }
    const result = await sendClinicEmail({
      to,
      clinicName: orgName.get(reminder.organization_id) ?? 'la clínica',
      tutorName: client?.full_name ?? 'tutor',
      patientName: patient?.name ?? 'tu mascota',
      title: reminder.title,
      dueOn: reminder.due_on,
    });
    if (!result.ok) {
      skipped += 1;
      continue;
    }
    await supabase.from('reminders').update({ last_emailed_at: new Date().toISOString() }).eq('id', reminder.id);
    sent += 1;
  }

  return NextResponse.json({ ok: true, sent, skipped });
}
