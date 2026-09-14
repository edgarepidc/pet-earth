import { todayMexicoYmd } from '@petearth/shared';

import { AdminShell } from '@/components/AdminShell';
import { DayBoard, type AppointmentRow } from '@/components/DayBoard';
import { getStaffSession } from '@/lib/auth';
import { loadDayAppointments, loadFollowUps } from '@/lib/queries';
import { ReminderPill } from '@/components/StatusPill';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const staff = await getStaffSession();
  if (!staff) return null;
  const ymd = todayMexicoYmd();
  const [appointments, reminders] = await Promise.all([
    loadDayAppointments(staff.branchId, ymd),
    loadFollowUps(staff.organizationId),
  ]);
  const overdue = reminders.filter((row) => row.due_on <= ymd).slice(0, 5);

  return (
    <AdminShell>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
        <DayBoard title="Hoy" appointments={appointments as AppointmentRow[]} />
        <aside className="space-y-3">
          <div className="pe-glass-card p-4">
            <h2 className="text-sm font-semibold text-slate-900">Seguimiento vencido</h2>
            {overdue.length === 0 ? (
              <p className="mt-2 text-sm text-slate-500">Nada vencido.</p>
            ) : (
              <ul className="mt-3 space-y-2">
                {overdue.map((row) => (
                  <li key={row.id} className="text-sm">
                    <ReminderPill kind={row.kind} />
                    <p className="mt-1 font-medium text-slate-800">{row.title}</p>
                    <p className="text-xs text-slate-500">{row.due_on}</p>
                  </li>
                ))}
              </ul>
            )}
            <Link href="/seguimiento" className="mt-3 inline-block text-sm font-medium text-[#245a4c] underline">
              Ver bandeja
            </Link>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
