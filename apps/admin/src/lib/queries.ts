import { mexicoYmdBoundsIso } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

export async function loadAppointmentsInRange(branchId: string, startIso: string, endIso: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, status, reason, vet_id, client_id, patient_id, clients(full_name, phone), patients(id, name, species, alerts)',
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
    .select('id, total, status, visit_id, created_at, client_id, cfdi_status')
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

export async function loadCfdiQueue(organizationId: string, branchId: string) {
  const supabase = createAdminClient();
  const { data: invoices, error } = await supabase
    .from('invoices')
    .select('id, total, status, visit_id, created_at, client_id, cfdi_status, cfdi_uuid, cfdi_error')
    .eq('organization_id', organizationId)
    .eq('branch_id', branchId)
    .eq('status', 'paid')
    .in('cfdi_status', ['none', 'requested', 'error'])
    .order('created_at', { ascending: false })
    .limit(20);
  if (error) throw new Error(error.message);
  const rows = invoices ?? [];
  if (rows.length === 0) return [];
  const clientIds = [...new Set(rows.map((row) => row.client_id))];
  const visitIds = rows.map((row) => row.visit_id).filter((id): id is string => Boolean(id));
  const [{ data: clients }, { data: visits }] = await Promise.all([
    supabase.from('clients').select('id, full_name, rfc, tax_zip').in('id', clientIds),
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
    .select(
      'id, kind, title, due_on, status, last_emailed_at, client_id, patient_id, clients(full_name, phone, email), patients(name)',
    )
    .eq('organization_id', organizationId)
    .eq('status', 'pending')
    .order('due_on');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function loadLowStock(organizationId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('catalog_items')
    .select('id, name, stock, min_stock, kind')
    .eq('organization_id', organizationId)
    .eq('kind', 'product')
    .eq('is_active', true)
    .order('name');
  if (error) throw new Error(error.message);
  return (data ?? []).filter((item) => item.min_stock != null && Number(item.stock ?? 0) <= Number(item.min_stock));
}

export async function loadClinicReports(organizationId: string, startIso: string, endIso: string, branchId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('invoices')
    .select('id, total, services_total, products_total, visit_id, created_at, cfdi_status')
    .eq('organization_id', organizationId)
    .eq('status', 'paid')
    .gte('created_at', startIso)
    .lt('created_at', endIso);
  if (branchId) query = query.eq('branch_id', branchId);
  const { data: invoices, error } = await query;
  if (error) throw new Error(error.message);

  const paid = invoices ?? [];
  const visitIds = paid.map((row) => row.visit_id).filter((id): id is string => Boolean(id));
  const { data: visits } = visitIds.length
    ? await supabase.from('visits').select('id, vet_id').in('id', visitIds)
    : { data: [] as { id: string; vet_id: string | null }[] };

  const vetIds = [...new Set((visits ?? []).map((visit) => visit.vet_id).filter((id): id is string => Boolean(id)))];
  const { data: profiles } = vetIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', vetIds)
    : { data: [] as { id: string; full_name: string | null }[] };

  const visitVet = new Map((visits ?? []).map((visit) => [visit.id, visit.vet_id]));
  const vetName = new Map((profiles ?? []).map((profile) => [profile.id, profile.full_name ?? 'Sin nombre']));

  const byVet = new Map<string, { name: string; total: number; count: number }>();
  for (const invoice of paid) {
    const vetId = invoice.visit_id ? visitVet.get(invoice.visit_id) : null;
    const key = vetId ?? 'sin-asignar';
    const current = byVet.get(key) ?? {
      name: vetId ? (vetName.get(vetId) ?? 'MVZ') : 'Sin MVZ asignado',
      total: 0,
      count: 0,
    };
    current.total += Number(invoice.total);
    current.count += 1;
    byVet.set(key, current);
  }

  const services = paid.reduce((sum, row) => sum + Number(row.services_total), 0);
  const products = paid.reduce((sum, row) => sum + Number(row.products_total), 0);
  const cfdiReady = paid.filter((row) => row.cfdi_status === 'requested' || row.cfdi_status === 'stamped').length;

  return {
    invoiceCount: paid.length,
    services,
    products,
    total: services + products,
    cfdiReady,
    byVet: [...byVet.values()].sort((a, b) => b.total - a.total),
  };
}

export async function loadLetterhead(organizationId: string, branchId: string) {
  const supabase = createAdminClient();
  const [{ data: org }, { data: branch }] = await Promise.all([
    supabase.from('organizations').select('name, settings').eq('id', organizationId).maybeSingle(),
    supabase.from('branches').select('name, address').eq('id', branchId).maybeSingle(),
  ]);
  const fiscal = ((org?.settings as { fiscal?: Record<string, string | null> } | null)?.fiscal ?? {}) as {
    rfc?: string | null;
    razonSocial?: string | null;
    regimen?: string | null;
    codigoPostal?: string | null;
  };
  return {
    clinicName: org?.name ?? 'Clínica',
    branchName: branch?.name ?? '',
    branchAddress: branch?.address ?? null,
    fiscal,
  };
}

export async function loadAppointmentPeek(organizationId: string, branchId: string, id: string) {
  const supabase = createAdminClient();
  const { data: appointment, error } = await supabase
    .from('appointments')
    .select(
      'id, starts_at, ends_at, status, reason, vet_id, client_id, patient_id, clients(full_name, phone, email), patients(id, name, species, breed, alerts, allergies)',
    )
    .eq('id', id)
    .eq('organization_id', organizationId)
    .eq('branch_id', branchId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!appointment) return null;

  const { data: visit } = await supabase
    .from('visits')
    .select(
      'id, status, started_at, completed_at, subjective, objective, assessment, plan, weight_kg, temperature_c, heart_rate, respiratory_rate, followup_at',
    )
    .eq('appointment_id', id)
    .eq('organization_id', organizationId)
    .maybeSingle();

  return { appointment, visit: visit ?? null };
}
