import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function TutoresPage() {
  const staff = await loadClinicSession();
  const supabase = createAdminClient();
  const [{ data }, speciesOptions] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone, email, rfc, tax_zip, uso_cfdi, fiscal_name, patients(id, name, species, breed, alerts, is_active)')
      .eq('organization_id', staff.organizationId)
      .order('full_name'),
    loadSpeciesOptions(staff.organizationId),
  ]);

  return (
    <AdminShell>
      <PatientsDirectory
        mark="tutores"
        title="Tutores"
        kicker="Recepción"
        description="Cuenta del tutor primero. Las mascotas cuelgan de aquí."
        showFiscal
        clients={(data ?? []) as never}
        speciesOptions={speciesOptions}
      />
    </AdminShell>
  );
}
