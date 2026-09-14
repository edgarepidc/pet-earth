import { mexicoYmdBoundsIso } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

export async function loadAppointmentsInRange(branchId: string, startIso: string, endIso: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, status, reason, vet_id, client_id, patient_id, clients(full_name, phone), patients(name, species, alerts)',
    )
    .eq('branch_id', branchId)
    .gte('starts_at', startIso)
    .lt('starts_at', endIso)
    .order('starts_at');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadDayAppointments(branchId: string, ymd: string) {
  const bounds = mexicoYmdBoundsIso(ymd);
  const rows = await loadAppointmentsInRange(branchId, bounds.start, bounds.end);
  if (rows.length === 0) return rows.map((row) => ({ ...row, visits: null }));
  const supabase = createAdminClient();
  const { data: visits } = await supabase
    .from('visits')
    .select('id, status, appointment_id')
    .in(
      'appointment_id',
      rows.map((row) => row.id),
    );
  const byAppointment = new Map(
    (visits ?? [])
      .filter((visit) => visit.appointment_id)
      .map((visit) => [visit.appointment_id as string, { id: visit.id, status: visit.status }]),
  );
  return rows.map((row) => ({ ...row, visits: byAppointment.get(row.id) ?? null }));
}

export async function loadOpenInvoices(organizationId: string, branchId: string) {
  const supabase = createAdminClient();
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, total, status, visit_id, created_at, client_id')
    .eq('organization_id', organizationId)
    .eq('branch_id', branchId)
    .eq('status', 'open')
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  const rows = invoices ?? [];
  if (rows.length === 0) return [];

  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const visitIds = rows.map((row) => row.visit_id).filter((id): id is string => Boolean(id));
  const [{ data: clients }, { data: visits }] = await Promise.all([
    supabase.from('clients').select('id, full_name').in('id', clientIds),
    visitIds.length
      ? supabase.from('visits').select('id, patients(name)').in('id', visitIds)
      : Promise.resolve({ data: [] as { id: string; patients: { name: string } | { name: string }[] | null }[] }),
  ]);
  const clientById = new Map((clients ?? []).map((client) => [client.id, client]));
  const visitById = new Map((visits ?? []).map((visit) => [visit.id, visit]));
  return rows.map((row) => ({
    ...row,
    clients: clientById.get(row.client_id) ?? null,
    visits: row.visit_id ? (visitById.get(row.visit_id) ?? null) : null,
  }));
}

export async function loadFollowUps(organizationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('reminders')
    .select('id, kind, title, due_on, status, client_id, patient_id, clients(full_name), patients(name)')
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('due_on');
  if (error) throw new Error(error.message);
  return data ?? [];
}
