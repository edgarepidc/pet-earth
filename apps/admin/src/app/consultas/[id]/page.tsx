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

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_lines(*)')
    .eq('visit_id', id)
    .maybeSingle();
  const { data: catalog } = await supabase
    .from('catalog_items')
    .select('id, kind, name, unit_price, stock, is_active')
    .eq('organization_id', staff.organizationId)
    .eq('is_active', true)
    .order('name');

  return (
    <AdminShell>
      <VisitWorkspace initial={{ visit: visit as never, invoice: invoice as never, catalog: catalog ?? [] }} />
    </AdminShell>
  );
}
