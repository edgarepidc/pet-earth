import { mexicoYmdBoundsIso, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';
import { loadUpcomingByPatient } from '@/lib/queries';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function PacientesPage() {
  const staff = await loadClinicSession();
  const supabase = createAdminClient();
  const fromIso = mexicoYmdBoundsIso(todayMexicoYmd()).start;
  const [{ data, error }, speciesOptions, upcoming] = await Promise.all([
    supabase
      .from('clients')
      .select('id, full_name, phone, email, patients(id, name, species, breed, alerts, is_active, microchip)')
      .eq('organization_id', staff.organizationId)
      .order('full_name'),
    loadSpeciesOptions(staff.organizationId),
    loadUpcomingByPatient(staff.organizationId, fromIso),
  ]);
  if (error) throw new Error(error.message);

  return (
    <AdminShell>
      <PatientsDirectory
        clients={(data ?? []) as never}
        speciesOptions={speciesOptions}
        upcoming={upcoming}
        clinicName={staff.organizationName}
      />
    </AdminShell>
  );
}
