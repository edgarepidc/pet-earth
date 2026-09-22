import { formatMexicoDate, isValidYmd, mexicoAgendaRange, todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import { ClinicNotices } from '@/components/ClinicNotices';
import { DayBoard, type AppointmentRow } from '@/components/DayBoard';
import { loadClinicSession } from '@/lib/auth';
import { loadAppointmentsInRange, loadClinicVets, loadDayAppointments, loadFollowUps, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const today = todayMexicoYmd();
  const view = params.view === 'month' ? 'month' : params.view === 'day' ? 'day' : 'week';
  const anchor = params.start && isValidYmd(params.start) ? params.start : today;
  const overduePromise = loadFollowUps(staff.organizationId).then((reminders) =>
    reminders.filter((row) => row.due_on <= today),
  );
  const lowStockPromise = loadLowStock(staff.organizationId);

  if (view === 'day') {
    const [appointments, overdue, lowStock, vets] = await Promise.all([
      loadDayAppointments(staff.branchId, anchor),
      overduePromise,
      lowStockPromise,
      loadClinicVets(staff.organizationId),
    ]);
    const title = formatMexicoDate(anchor, { weekday: 'long', day: 'numeric', month: 'long' });
    return (
      <AdminShell>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <DayBoard
            mark="agenda"
            title={title.charAt(0).toUpperCase() + title.slice(1)}
            date={anchor}
            appointments={appointments as AppointmentRow[]}
            vets={vets}
            clinicName={staff.organizationName}
            branchName={staff.branchName}
            kicker={`Agenda · ${staff.branchName ?? staff.organizationName}`}
            showCash={false}
          />
          <ClinicNotices overdue={overdue} lowStock={lowStock} />
        </div>
      </AdminShell>
    );
  }

  const range = mexicoAgendaRange(anchor, view);
  const [appointments, overdue, lowStock] = await Promise.all([
    loadAppointmentsInRange(staff.branchId, `${range.start}T00:00:00-06:00`, `${range.end}T00:00:00-06:00`),
    overduePromise,
    lowStockPromise,
  ]);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <AgendaCalendar
          key={`${view}-${range.start}`}
          initialDate={anchor}
          initialView={view}
          appointments={appointments as AppointmentRow[]}
          branchName={staff.branchName}
        />
        <ClinicNotices overdue={overdue} lowStock={lowStock} />
      </div>
    </AdminShell>
  );
}
