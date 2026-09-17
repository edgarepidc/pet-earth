import { AdminShell } from '@/components/AdminShell';
import { ClinicSettings } from '@/components/ClinicSettings';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesList } from '@/lib/clinicLists';
import { canManageCatalog } from '@petearth/shared';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const staff = await loadClinicSession();
  if (!canManageCatalog(staff.role) && staff.role !== 'vet' && !staff.isPlatformAdmin) redirect('/');
  const species = await loadSpeciesList(staff.organizationId);
  return (
    <AdminShell>
      <ClinicSettings species={species} />
    </AdminShell>
  );
}
