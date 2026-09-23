import { mexicoYmdBoundsIso, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';
import { loadUpcomingByPatient } from '@/lib/queries';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function PacientesPage({
  searchParams,
}: {
  searchParams: Promise<{ vista?: string }>;
}) {
  const staff = await loadClinicSession();
  const tutors = (await searchParams).vista === 'tutores';
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
        mark={tutors ? 'tutores' : 'pacientes'}
        title={tutors ? 'Tutores' : 'Pacientes'}
        kicker="Clínico"
        description={
          tutors
            ? 'Cuenta del tutor primero. Las mascotas cuelgan de aquí.'
            : 'Una ficha por mascota. El tutor va en el subtítulo.'
        }
        showFiscal={tutors}
        clients={(data ?? []) as never}
        speciesOptions={speciesOptions}
        upcoming={upcoming}
        clinicName={staff.organizationName}
      />
    </AdminShell>
  );
}
