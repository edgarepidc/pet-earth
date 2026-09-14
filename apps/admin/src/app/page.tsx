import Link from 'next/link';
import { todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { DayBoard, type AppointmentRow, type OpenInvoiceRow } from '@/components/DayBoard';
import { ReminderPill } from '@/components/StatusPill';
import { getStaffSession } from '@/lib/auth';
import { loadDayAppointments, loadFollowUps, loadOpenInvoices } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const staff = await getStaffSession();
  if (!staff) return null;
  const ymd = todayMexicoYmd();
  const [appointments, reminders, invoices] = await Promise.all([
    loadDayAppointments(staff.branchId, ymd),
    loadFollowUps(staff.organizationId),
    loadOpenInvoices(staff.organizationId, staff.branchId),
  ]);
  const overdue = reminders.filter((row) => row.due_on <= ymd).slice(0, 5);

  return (
    <AdminShell>
      <div className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_240px]">
        <DayBoard
          title="Hoy"
          appointments={appointments as AppointmentRow[]}
          invoices={invoices as OpenInvoiceRow[]}
        />
        <aside className="space-y-3">
          <div className="pe-card p-4">
            <h2 className="text-sm font-semibold">Seguimiento vencido</h2>
            {overdue.length === 0 ? (
              <p className="mt-2 text-sm text-[#6b5e55]">Nada vencido.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {overdue.map((row) => (
                  <li key={row.id} className="text-sm">
                    <ReminderPill kind={row.kind} />
                    <p className="mt-1 font-medium">{row.title}</p>
                    <p className="text-xs text-[#6b5e55]">{row.due_on}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/seguimiento" className="mt-3 inline-block text-sm font-medium text-[#b85c38] underline">
              Ver bandeja
            </Link>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
