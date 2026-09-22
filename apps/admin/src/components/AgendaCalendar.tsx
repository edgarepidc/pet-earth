'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  APPOINTMENT_STATUS_LABELS,
  formatMexicoDate,
  formatMexicoTime,
  mexicoAgendaRange,
  mexicoMonthStart,
  mexicoWeekStart,
  todayMexicoYmd,
  type AppointmentStatus,
} from '@petearth/shared';

import { AppointmentPeek, floorStatus, one, type AppointmentRow } from '@/components/AppointmentPeek';
import { FloorNav } from '@/components/FloorNav';
import { PageHeading } from '@/components/SectionTitle';
import { appointmentOutline } from '@/components/StatusPill';

const WEEKDAYS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'] as const;

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
  const [openId, setOpenId] = useState<string | null>(null);
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

  function open(nextView: 'week' | 'month' | 'day', nextCursor: string) {
    if (nextView !== 'day') setView(nextView);
    setCursor(nextCursor);
    const start =
      nextView === 'month' ? mexicoMonthStart(nextCursor) : nextView === 'day' ? nextCursor : mexicoWeekStart(nextCursor);
    router.push(`/agenda?view=${nextView}&start=${start}`);
  }

  const selected = appointments.find((row) => row.id === openId) ?? null;
  const description = view === 'week'
    ? `${formatMexicoDate(range.days[0], { day: 'numeric', month: 'short' })} – ${formatMexicoDate(range.days[6], { day: 'numeric', month: 'short' })}`
    : monthTitle(monthStart);

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <PageHeading
          mark="agenda"
          kicker={`Agenda · ${branchName ?? 'Clínica'}`}
          title="Agenda"
          description={description}
        />
        <FloorNav active={view} date={view === 'week' ? range.days[0] : monthStart} />
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
                        className={`pe-card h-full ${view === 'week' ? 'min-h-[16rem] cursor-pointer' : 'min-h-[7.5rem]'} p-2.5 ${
                          day === today ? 'ring-1 ring-pe-clay' : ''
                        } ${outside ? 'bg-pe-wash/70' : ''} ${view === 'month' ? 'cursor-pointer' : ''}`}
                        onClick={view === 'month' ? () => open('week', day) : () => open('day', day)}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold ${outside ? 'text-pe-muted' : 'text-pe-ink'}`}>
                            {view === 'week' || outside
                              ? formatMexicoDate(day, { day: 'numeric', month: 'short' })
                              : String(Number(day.slice(8)))}
                          </p>
                          {view === 'week' ? (
                            <span className="shrink-0 text-[11px] font-medium text-pe-clay-700">Horario</span>
                          ) : null}
                        </div>
                        <ul
                          className={`mt-2 ${view === 'month' ? 'max-h-28 space-y-1 overflow-y-auto' : 'space-y-2'}`}
                        >
                          {view === 'week' && rows.length === 0 ? (
                            <li>
                              <p className="text-sm text-pe-muted">Libre · ver horario</p>
                            </li>
                          ) : null}
                          {rows.map((row) => {
                            const patient = one(row.patients);
                            const status = floorStatus(row.status as AppointmentStatus);
                            return (
                              <li key={row.id}>
                                <button
                                  type="button"
                                  title={`${formatMexicoTime(row.starts_at)} ${patient?.name ?? 'Paciente'} · ${APPOINTMENT_STATUS_LABELS[status]}`}
                                  className={`w-full rounded-md border bg-white text-left hover:bg-pe-wash ${appointmentOutline(status)} ${
                                    view === 'month'
                                      ? 'px-1.5 py-1 text-[11px] leading-tight'
                                      : 'p-2 text-xs shadow-[0_1px_4px_rgba(22,26,22,0.08)]'
                                  }`}
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    setOpenId(row.id);
                                  }}
                                >
                                  <span className={`block truncate ${view === 'week' ? 'font-semibold' : ''}`}>
                                    <span className="tabular-nums">{formatMexicoTime(row.starts_at)}</span>{' '}
                                    {patient?.name ?? 'Paciente'}
                                  </span>
                                  {view === 'week' ? (
                                    <>
                                      <p className="mt-0.5 truncate text-pe-muted">
                                        {row.reason?.trim() || 'Sin motivo'}
                                      </p>
                                      {row.vet_name ? (
                                        <p className="mt-0.5 truncate text-[11px] font-medium text-pe-clay-700">
                                          {row.vet_name}
                                        </p>
                                      ) : null}
                                    </>
                                  ) : null}
                                </button>
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
      {selected ? (
        <AppointmentPeek appointment={selected} onClose={() => setOpenId(null)} onMoved={() => router.refresh()} />
      ) : null}
    </section>
  );
}
