'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  addMexicoDays,
  formatMexicoDate,
  formatMexicoTime,
  mexicoAgendaRange,
  mexicoMonthStart,
  mexicoWeekStart,
  todayMexicoYmd,
  type AppointmentStatus,
} from '@petearth/shared';

import { PageHeading } from '@/components/SectionTitle';
import { StatusPill } from '@/components/StatusPill';
import type { AppointmentRow } from '@/components/DayBoard';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

function monthTitle(ymd: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: 'America/Mexico_City',
    month: 'long',
    year: 'numeric',
  }).format(new Date(`${ymd}T12:00:00-06:00`));
}

function chunkWeeks(days: string[]): string[][] {
  const weeks: string[][] = [];
  for (let i = 0; i < days.length; i += 7) weeks.push(days.slice(i, i + 7));
  return weeks;
}

export function AgendaCalendar({
  initialDate,
  initialView = 'week',
  appointments,
  branchName,
}: {
  initialDate: string;
  initialView?: 'week' | 'month';
  appointments: AppointmentRow[];
  branchName?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>(initialView);
  const [cursor, setCursor] = useState(initialDate);
  const today = todayMexicoYmd();
  const monthStart = mexicoMonthStart(cursor);
  const range = mexicoAgendaRange(cursor, view);
  const weeks = chunkWeeks(range.days);

  const byDay = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const row of appointments) {
      const day = todayMexicoYmd(new Date(row.starts_at));
      map.set(day, [...(map.get(day) ?? []), row]);
    }
    return map;
  }, [appointments]);

  function shiftMonth(ymd: string, delta: number): string {
    const [year, month] = ymd.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1 + delta, 1));
    return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
  }

  function open(nextView: 'week' | 'month', nextCursor: string) {
    setView(nextView);
    setCursor(nextCursor);
    const start = nextView === 'month' ? mexicoMonthStart(nextCursor) : mexicoWeekStart(nextCursor);
    router.push(`/agenda?view=${nextView}&start=${start}`);
  }

  function go(delta: number) {
    const nextCursor =
      view === 'week' ? addMexicoDays(mexicoWeekStart(cursor), delta * 7) : shiftMonth(monthStart, delta);
    open(view, nextCursor);
  }

  const description = view === 'week'
    ? `${formatMexicoDate(range.days[0], { day: 'numeric', month: 'short' })} – ${formatMexicoDate(range.days[6], { day: 'numeric', month: 'short' })}`
    : monthTitle(monthStart);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PageHeading
          mark="agenda"
          title="Agenda"
          description={`${branchName ? `${branchName} · ` : ''}${description}`}
        />
        <div className="flex gap-2">
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${view === 'week' ? 'pe-chip-active' : ''}`}
            onClick={() => open('week', cursor)}
          >
            Semana
          </button>
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${view === 'month' ? 'pe-chip-active' : ''}`}
            onClick={() => open('month', cursor)}
          >
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
      <div className="overflow-x-auto">
        <table className="w-full min-w-[52rem] table-fixed border-separate border-spacing-2">
          <thead>
            <tr>
              {WEEKDAYS.map((label) => (
                <th
                  key={label}
                  scope="col"
                  className="px-1 pb-1 text-center text-[10px] font-bold uppercase tracking-[0.14em] text-pe-muted"
                >
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {weeks.map((week) => (
              <tr key={week[0]}>
                {week.map((day) => {
                  const rows = byDay.get(day) ?? [];
                  const outside = view === 'month' && day.slice(0, 7) !== monthStart.slice(0, 7);
                  return (
                    <td key={day} className="align-top">
                      <div
                        className={`pe-card h-full ${view === 'week' ? 'min-h-[16rem]' : 'min-h-[7.5rem]'} p-2.5 ${
                          day === today ? 'ring-1 ring-pe-clay' : ''
                        } ${outside ? 'bg-pe-wash/70' : ''}`}
                      >
                        <p className={`text-xs font-semibold ${outside ? 'text-pe-muted' : 'text-pe-ink'}`}>
                          {view === 'week' || outside
                            ? formatMexicoDate(day, { day: 'numeric', month: 'short' })
                            : String(Number(day.slice(8)))}
                        </p>
                        <ul className={`mt-2 space-y-1.5 ${view === 'month' ? 'max-h-28 overflow-y-auto' : ''}`}>
                          {rows.map((row) => {
                            const patient = one(row.patients);
                            return (
                              <li key={row.id} className="rounded-md bg-white p-2 text-xs">
                                <p className="font-semibold">
                                  {formatMexicoTime(row.starts_at)} {patient?.name}
                                </p>
                                {view === 'week' ? <StatusPill status={row.status as AppointmentStatus} /> : null}
                              </li>
                            );
                          })}
                        </ul>
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
