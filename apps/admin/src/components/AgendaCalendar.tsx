'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  APPOINTMENT_STATUS_LABELS,
  addMexicoDays,
  formatMexicoDate,
  formatMexicoTime,
  mexicoAgendaRange,
  mexicoMonthStart,
  mexicoWeekStart,
  todayMexicoYmd,
  type AppointmentStatus,
} from '@petearth/shared';

import { AppointmentPeek, floorStatus, one, type AppointmentRow, type ClinicVet } from '@/components/AppointmentPeek';
import { BookSlotDialog } from '@/components/BookSlotDialog';
import { PageHeading } from '@/components/SectionTitle';
import { appointmentOutline } from '@/components/StatusPill';
import { CLINIC_OPEN_MIN, CLINIC_CLOSE_MIN, SLOT_MINUTES, clockToMinutes, minutesToClock, slotFloor } from '@/lib/day-slots';

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
  vets = [],
  branchName,
}: {
  initialDate: string;
  initialView?: 'week' | 'month';
  appointments: AppointmentRow[];
  vets?: ClinicVet[];
  branchName?: string;
}) {
  const router = useRouter();
  const [view, setView] = useState<'week' | 'month'>(initialView);
  const [cursor, setCursor] = useState(initialDate);
  const [openId, setOpenId] = useState<string | null>(null);
  const [book, setBook] = useState<{ date: string; time: string } | null>(null);
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

  function nextFreeClock(day: string): string {
    const taken = new Set(
      (byDay.get(day) ?? []).map((row) => slotFloor(clockToMinutes(formatMexicoTime(row.starts_at)))),
    );
    for (let minutes = CLINIC_OPEN_MIN; minutes < CLINIC_CLOSE_MIN; minutes += SLOT_MINUTES) {
      if (!taken.has(minutes)) return minutesToClock(minutes);
    }
    return minutesToClock(CLINIC_OPEN_MIN);
  }

  const selected = appointments.find((row) => row.id === openId) ?? null;
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
        <div className="flex flex-wrap gap-2">
          <Link href="/" className="pe-btn-primary px-3 py-1.5 text-sm">
            Hoy
          </Link>
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${view === 'week' ? 'pe-chip-active' : ''}`}
            onClick={() => open('week', today)}
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
                        } ${outside ? 'bg-pe-wash/70' : ''} ${view === 'month' ? 'cursor-pointer' : ''}`}
                        onClick={view === 'month' ? () => open('week', day) : undefined}
                      >
                        <div className="flex items-start justify-between gap-1">
                          <p className={`text-xs font-semibold ${outside ? 'text-pe-muted' : 'text-pe-ink'}`}>
                            {view === 'week' || outside
                              ? formatMexicoDate(day, { day: 'numeric', month: 'short' })
                              : String(Number(day.slice(8)))}
                          </p>
                          {view === 'week' ? (
                            <button
                              type="button"
                              className="shrink-0 text-[11px] font-medium text-pe-clay-700 hover:underline"
                              onClick={() => setBook({ date: day, time: nextFreeClock(day) })}
                            >
                              Agendar
                            </button>
                          ) : null}
                        </div>
                        <ul
                          className={`mt-2 ${view === 'month' ? 'max-h-28 space-y-1 overflow-y-auto' : 'space-y-2'}`}
                        >
                          {view === 'week' && rows.length === 0 ? (
                            <li>
                              <button
                                type="button"
                                className="text-left text-sm text-pe-clay-700 hover:underline"
                                onClick={() => setBook({ date: day, time: nextFreeClock(day) })}
                              >
                                Libre · agendar
                              </button>
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
      {book ? (
        <BookSlotDialog
          date={book.date}
          time={book.time}
          vets={vets}
          onClose={() => setBook(null)}
          onCreated={() => {
            setBook(null);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}
