import { formatMexicoDate, isValidYmd, mexicoAgendaRange, todayMexicoYmd } from '@petearth/shared';
import { Suspense } from 'react';

import { AdminShell } from '@/components/AdminShell';
import { AgendaCalendar } from '@/components/AgendaCalendar';
import { ClinicNotices } from '@/components/ClinicNotices';
import { DayBoard, type AppointmentRow, type OpenInvoiceRow } from '@/components/DayBoard';
import { loadClinicSession } from '@/lib/auth';
import {
  loadAppointmentsInRange,
  loadClinicVets,
  loadDayAppointments,
  loadFollowUps,
  loadLowStock,
  loadOpenInvoices,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string; start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const today = todayMexicoYmd();
  const view = params.view === 'month' ? 'month' : params.view === 'week' ? 'week' : 'day';
  const anchor = params.start && isValidYmd(params.start) ? params.start : today;
  const overduePromise = loadFollowUps(staff.organizationId).then((reminders) =>
    reminders.filter((row) => row.due_on <= today),
  );
  const lowStockPromise = loadLowStock(staff.organizationId);

  if (view === 'day') {
    const [appointments, invoices, overdue, lowStock, vets] = await Promise.all([
      loadDayAppointments(staff.branchId, anchor),
      loadOpenInvoices(staff.organizationId, staff.branchId),
      overduePromise,
      lowStockPromise,
      loadClinicVets(staff.organizationId),
    ]);
    const title = formatMexicoDate(anchor, { weekday: 'long', day: 'numeric', month: 'long' });
    return (
      <AdminShell>
        <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
          <Suspense fallback={null}>
            <DayBoard
              mark="agenda"
              title={title.charAt(0).toUpperCase() + title.slice(1)}
              date={anchor}
              appointments={appointments as AppointmentRow[]}
              invoices={invoices as OpenInvoiceRow[]}
              vets={vets}
              clinicName={staff.organizationName}
              branchName={staff.branchName}
              kicker={`Agenda · ${staff.branchName ?? staff.organizationName}`}
              openMin={staff.branchOpenMin}
              closeMin={staff.branchCloseMin}
            />
          </Suspense>
          <ClinicNotices overdue={overdue} lowStock={lowStock} />
        </div>
      </AdminShell>
    );
  }

  const range = mexicoAgendaRange(anchor, view);
  const [appointments, overdue, lowStock, vets] = await Promise.all([
    loadAppointmentsInRange(staff.branchId, `${range.start}T00:00:00-06:00`, `${range.end}T00:00:00-06:00`),
    overduePromise,
    lowStockPromise,
    loadClinicVets(staff.organizationId),
  ]);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Suspense fallback={null}>
          <AgendaCalendar
          key={`${view}-${range.start}`}
          initialDate={anchor}
          initialView={view}
          appointments={appointments as AppointmentRow[]}
          vets={vets}
          branchName={staff.branchName}
          openMin={staff.branchOpenMin}
          closeMin={staff.branchCloseMin}
        />
        </Suspense>
        <ClinicNotices overdue={overdue} lowStock={lowStock} />
      </div>
    </AdminShell>
  );
}
