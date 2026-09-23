import { createAdminClient } from '@petearth/supabase/admin';
import { notFound } from 'next/navigation';

import { AdminShell } from '@/components/AdminShell';
import { VisitWorkspace } from '@/components/VisitWorkspace';
import { loadClinicSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ConsultaPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await loadClinicSession();
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: visit } = await supabase
    .from('visits')
    .select(
      '*, patients(id, name, species, breed, sex, birth_date, alerts, allergies), clients(full_name, phone), visit_lines(*), vaccine_records(id, name, lot, next_due)',
    )
    .eq('id', id)
    .eq('organization_id', staff.organizationId)
    .maybeSingle();
  if (!visit) notFound();

  const [{ data: invoice }, { data: catalog }, { data: previous }, { data: reminders }] = await Promise.all([
    supabase.from('invoices').select('*, invoice_lines(*)').eq('visit_id', id).maybeSingle(),
    supabase
      .from('catalog_items')
      .select('id, kind, name, unit_price, stock, is_active')
      .eq('organization_id', staff.organizationId)
      .eq('is_active', true)
      .order('name'),
    visit.patient_id
      ? supabase
          .from('visits')
          .select('id, started_at, subjective, objective, assessment, plan')
          .eq('patient_id', visit.patient_id)
          .eq('organization_id', staff.organizationId)
          .neq('id', id)
          .order('started_at', { ascending: false })
          .limit(1)
          .maybeSingle()
      : Promise.resolve({ data: null }),
    visit.patient_id
      ? supabase
          .from('reminders')
          .select('id, kind, title, due_on')
          .eq('patient_id', visit.patient_id)
          .eq('organization_id', staff.organizationId)
          .eq('status', 'pending')
          .order('due_on')
      : Promise.resolve({ data: [] }),
  ]);

  return (
    <AdminShell>
      <VisitWorkspace
        clinicName={staff.organizationName}
        role={staff.role}
        isPlatformAdmin={staff.isPlatformAdmin}
        previous={previous}
        reminders={reminders ?? []}
        initial={{ visit: visit as never, invoice: invoice as never, catalog: catalog ?? [] }}
      />
    </AdminShell>
  );
}
