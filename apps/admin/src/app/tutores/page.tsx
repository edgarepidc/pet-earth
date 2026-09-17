import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function TutoresPage() {
  const staff = await loadClinicSession();
  const { data } = await createAdminClient()
    .from('clients')
    .select('id, full_name, phone, email, rfc, tax_zip, uso_cfdi, fiscal_name, patients(id, name, species, breed, alerts, is_active)')
    .eq('organization_id', staff.organizationId)
    .order('full_name');

  return (
    <AdminShell>
      <PatientsDirectory
        mark="tutores"
        title="Tutores"
        kicker="Recepción"
        description="Cuenta del tutor primero. Las mascotas cuelgan de aquí."
        showFiscal
        clients={(data ?? []) as never}
      />
    </AdminShell>
  );
}
