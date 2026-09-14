import { AdminShell } from '@/components/AdminShell';
import { FollowUpInbox } from '@/components/FollowUpInbox';
import { getStaffSession } from '@/lib/auth';
import { loadFollowUps } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function SeguimientoPage() {
  const staff = await getStaffSession();
  if (!staff) return null;
  const reminders = await loadFollowUps(staff.organizationId);
  return (
    <AdminShell>
      <FollowUpInbox reminders={reminders as never} />
    </AdminShell>
  );
}
