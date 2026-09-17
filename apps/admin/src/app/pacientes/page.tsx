import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const staff = await loadClinicSession();
  const supabase = createAdminClient();
  const [{ data }, speciesOptions] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone, email, patients(id, name, species, breed, alerts, is_active)')
      .eq('organization_id', staff.organizationId)
      .order('full_name'),
    loadSpeciesOptions(staff.organizationId),
  ]);

  return (
    <AdminShell>
      <PatientsDirectory clients={(data ?? []) as never} speciesOptions={speciesOptions} />
    </AdminShell>
  );
}
