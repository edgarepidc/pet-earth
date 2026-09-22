import { Suspense } from 'react';

import { todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { ClinicNotices } from '@/components/ClinicNotices';
import { DayBoard, type AppointmentRow, type OpenInvoiceRow } from '@/components/DayBoard';
import { loadClinicSession } from '@/lib/auth';
import { loadClinicVets, loadDayAppointments, loadFollowUps, loadLowStock, loadOpenInvoices } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const staff = await loadClinicSession();
  const ymd = todayMexicoYmd();
  const [appointments, reminders, invoices, lowStock, vets] = await Promise.all([
    loadDayAppointments(staff.branchId, ymd),
    loadFollowUps(staff.organizationId),
    loadOpenInvoices(staff.organizationId, staff.branchId),
    loadLowStock(staff.organizationId),
    loadClinicVets(staff.organizationId),
  ]);
  const overdue = reminders.filter((row) => row.due_on <= ymd);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_260px]">
        <Suspense fallback={null}>
          <DayBoard
            title="Hoy"
            date={ymd}
            appointments={appointments as AppointmentRow[]}
            invoices={invoices as OpenInvoiceRow[]}
            vets={vets}
            clinicName={staff.organizationName}
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
