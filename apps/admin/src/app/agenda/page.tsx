import { isValidYmd, mexicoAgendaRange, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import { ClinicNotices } from '@/components/ClinicNotices';
import type { AppointmentRow } from '@/components/DayBoard';
import { loadClinicSession } from '@/lib/auth';
import { loadAppointmentsInRange, loadClinicVets, loadFollowUps, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const today = todayMexicoYmd();
  const view = params.view === 'month' ? 'month' : 'week';
  const anchor = params.start && isValidYmd(params.start) ? params.start : today;
  const range = mexicoAgendaRange(anchor, view);
  const [appointments, reminders, lowStock, vets] = await Promise.all([
    loadAppointmentsInRange(staff.branchId, `${range.start}T00:00:00-06:00`, `${range.end}T00:00:00-06:00`),
    loadFollowUps(staff.organizationId),
    loadLowStock(staff.organizationId),
    loadClinicVets(staff.organizationId),
  ]);
  const overdue = reminders.filter((row) => row.due_on <= today);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <AgendaCalendar
          key={`${view}-${range.start}`}
          initialDate={anchor}
          initialView={view}
          appointments={appointments as AppointmentRow[]}
          vets={vets}
          branchName={staff.branchName}
        />
        <ClinicNotices overdue={overdue} lowStock={lowStock} />
      </div>
    </AdminShell>
  );
}
