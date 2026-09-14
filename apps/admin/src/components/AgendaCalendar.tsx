'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  addMexicoDays,
  daysInMexicoMonth,
  formatMexicoDate,
  formatMexicoTime,
  mexicoMonthStart,
  mexicoWeekStart,
  todayMexicoYmd,
  type AppointmentStatus,
} from '@petearth/shared';

import { StatusPill } from '@/components/StatusPill';
import type { AppointmentRow } from '@/components/DayBoard';

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function AgendaCalendar({
  initialDate,
  appointments,
  branchName,
}: {
  initialDate: string;
  appointments: AppointmentRow[];
  branchName?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>('week');
  const [cursor, setCursor] = useState(initialDate);
  const today = todayMexicoYmd();

  const weekStart = mexicoWeekStart(cursor);
  const monthStart = mexicoMonthStart(cursor);
  const weekDays = Array.from({ length: 7 }, (_, i) => addMexicoDays(weekStart, i));
  const monthDays = Array.from({ length: daysInMexicoMonth(monthStart) }, (_, i) =>
    addMexicoDays(monthStart, i),
  );

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const row of appointments) {
      const day = row.starts_at.slice(0, 10);
      map.set(day, [...(map.get(day) ?? []), row]);
    }
    return map;
  }, [appointments]);

  function shiftMonth(ymd: string, delta: number): string {
    const [year, month] = ymd.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }

  function go(delta: number) {
    const normalized = view === 'week' ? addMexicoDays(weekStart, delta * 7) : shiftMonth(monthStart, delta);
    setCursor(normalized);
    const start = view === 'week' ? mexicoWeekStart(normalized) : mexicoMonthStart(normalized);
    const end =
      view === 'week'
        ? addMexicoDays(start, 7)
        : addMexicoDays(start, daysInMexicoMonth(start));
    router.push(`/agenda?view=${view}&start=${start}&end=${end}`);
  }

  const days = view === 'week' ? weekDays : monthDays;

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-semibold">Agenda</h1>
          <p className="text-sm text-[#6b5e55]">
            {branchName ? `${branchName} · ` : ''}
            {view === 'week' ? 'Capacidad de la semana' : 'Planeación del mes'}
          </p>
        </div>
        <div className="flex gap-2">
          <button type="button" className={`pe-btn-ghost px-3 py-1.5 text-sm ${view === 'week' ? 'pe-chip-active' : ''}`} onClick={() => setView('week')}>
            Semana
          </button>
          <button type="button" className={`pe-btn-ghost px-3 py-1.5 text-sm ${view === 'month' ? 'pe-chip-active' : ''}`} onClick={() => setView('month')}>
            Mes
          </button>
          <button type="button" className="pe-btn-secondary px-3 py-1.5 text-sm" onClick={() => go(-1)}>
            Anterior
          </button>
          <button type="button" className="pe-btn-secondary px-3 py-1.5 text-sm" onClick={() => go(1)}>
            Siguiente
          </button>
        </div>
      </div>
      <div className={view === 'week' ? 'grid gap-3 md:grid-cols-7' : 'grid gap-2 sm:grid-cols-4 lg:grid-cols-7'}>
        {days.map((day) => {
          const rows = byDay.get(day) ?? [];
          return (
            <div key={day} className={`pe-card p-3 ${day === today ? 'ring-1 ring-[#b85c38]' : ''}`}>
              <Link href="/" className="text-xs font-semibold text-[#3c322c]">
                {formatMexicoDate(day, { weekday: 'short', day: 'numeric', month: 'short' })}
              </Link>
              <ul className="mt-2 space-y-2">
                {rows.map((row) => {
                  const patient = one(row.patients);
                  return (
                    <li key={row.id} className="rounded-md bg-white p-2 text-xs">
                      <p className="font-semibold">
                        {formatMexicoTime(row.starts_at)} {patient?.name}
                      </p>
                      <StatusPill status={row.status as AppointmentStatus} />
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
