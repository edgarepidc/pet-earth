import { AdminShell } from '@/components/AdminShell';
import { FollowUpInbox } from '@/components/FollowUpInbox';
import { loadClinicSession } from '@/lib/auth';
import { loadClinicVets, loadFollowUps } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function SeguimientoPage() {
  const staff = await loadClinicSession();
  const [reminders, vets] = await Promise.all([
    loadFollowUps(staff.organizationId),
    loadClinicVets(staff.organizationId),
  ]);
  return (
    <AdminShell>
      <FollowUpInbox
        reminders={reminders as never}
        clinicName={staff.organizationName}
        vets={vets}
        openMin={staff.branchOpenMin}
        closeMin={staff.branchCloseMin}
      />
    </AdminShell>
  );
}
