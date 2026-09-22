import { mexicoYmdBoundsIso, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';
import { loadUpcomingByPatient } from '@/lib/queries';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function TutoresPage() {
  const staff = await loadClinicSession();
  const supabase = createAdminClient();
  const fromIso = mexicoYmdBoundsIso(todayMexicoYmd()).start;
  const [{ data, error }, speciesOptions, upcoming] = await Promise.all([
    supabase
      .from('clients')
      .select(
        'id, full_name, phone, email, rfc, tax_zip, uso_cfdi, fiscal_name, patients(id, name, species, breed, alerts, is_active, microchip)',
      )
      .eq('organization_id', staff.organizationId)
      .order('full_name'),
    loadSpeciesOptions(staff.organizationId),
    loadUpcomingByPatient(staff.organizationId, fromIso),
  ]);
  if (error) throw new Error(error.message);

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
        upcoming={upcoming}
        clinicName={staff.organizationName}
      />
    </AdminShell>
  );
}
