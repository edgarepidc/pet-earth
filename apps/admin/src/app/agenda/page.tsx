import { addMexicoDays, mexicoWeekStart, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import type { AppointmentRow } from '@/components/DayBoard';
import { getStaffSession } from '@/lib/auth';
import { loadAppointmentsInRange } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; end?: string }>;
}) {
  const staff = await getStaffSession();
  if (!staff) return null;
  const params = await searchParams;
  const today = todayMexicoYmd();
  const start = params.start ?? mexicoWeekStart(today);
  const end = params.end ?? addMexicoDays(start, 7);
  const appointments = await loadAppointmentsInRange(
    staff.branchId,
    `${start}T00:00:00-06:00`,
    `${end}T00:00:00-06:00`,
  );

  return (
    <AdminShell>
      <AgendaCalendar initialDate={start} appointments={appointments as AppointmentRow[]} />
    </AdminShell>
  );
}
