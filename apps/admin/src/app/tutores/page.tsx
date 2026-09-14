import { AdminShell } from '@/components/AdminShell';
import { PatientsDirectory } from '@/components/PatientsDirectory';
import { getStaffSession } from '@/lib/auth';
import { createAdminClient } from '@petearth/supabase/admin';

export const dynamic = 'force-dynamic';

export default async function TutoresPage() {
  const staff = await getStaffSession();
  if (!staff) return null;
  const { data } = await createAdminClient()
    .from('clients')
    .select('id, full_name, phone, email, patients(id, name, species, breed, alerts, is_active)')
    .eq('organization_id', staff.organizationId)
    .order('full_name');

  return (
    <AdminShell>
      <PatientsDirectory
        title="Tutores"
        kicker="Recepción"
        description="Cuenta del tutor primero. Las mascotas cuelgan de aquí."
        clients={(data ?? []) as never}
      />
    </AdminShell>
  );
}
