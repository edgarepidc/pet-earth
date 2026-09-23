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
  searchParams: Promise<{ vista?: string; lista?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const tutors = params.vista === 'tutores';
  const table = params.lista === 'tabla';
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
            ? table
              ? 'Listado de tutores. Las mascotas cuelgan de cada fila.'
              : 'Cuenta del tutor primero. Las mascotas cuelgan de aquí.'
            : table
              ? 'Listado de mascotas. El tutor va en la columna de al lado.'
              : 'Una ficha por mascota. El tutor va en el subtítulo.'
        }
        showFiscal={tutors}
        table={table}
        clients={(data ?? []) as never}
        speciesOptions={speciesOptions}
        upcoming={upcoming}
        clinicName={staff.organizationName}
      />
    </AdminShell>
  );
}
