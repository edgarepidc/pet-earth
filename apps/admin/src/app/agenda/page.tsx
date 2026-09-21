import { addMexicoDays, mexicoWeekStart, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import { ClinicNotices } from '@/components/ClinicNotices';
import type { AppointmentRow } from '@/components/DayBoard';
import { loadClinicSession } from '@/lib/auth';
import { loadAppointmentsInRange, loadFollowUps, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const today = todayMexicoYmd();
  const start = params.start ?? mexicoWeekStart(today);
  const end = params.end ?? addMexicoDays(start, 7);
  const [appointments, reminders, lowStock] = await Promise.all([
    loadAppointmentsInRange(staff.branchId, `${start}T00:00:00-06:00`, `${end}T00:00:00-06:00`),
    loadFollowUps(staff.organizationId),
    loadLowStock(staff.organizationId),
  ]);
  const overdue = reminders.filter((row) => row.due_on <= today);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <AgendaCalendar
          initialDate={start}
          appointments={appointments as AppointmentRow[]}
          branchName={staff.branchName}
        />
        <ClinicNotices overdue={overdue} lowStock={lowStock} />
      </div>
    </AdminShell>
  );
}
