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
  return loadAppointmentsInRange(branchId, bounds.start, bounds.end);
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
