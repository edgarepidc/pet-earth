'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { APPOINTMENT_STATUS_LABELS, formatMexicoTime, formatMoney, type AppointmentStatus } from '@petearth/shared';

import {
  AppointmentPeek,
  FLOOR_STATUSES,
  floorStatus,
  moveAppointment,
  one,
  type AppointmentRow,
} from '@/components/AppointmentPeek';
import { BookSlotDialog } from '@/components/BookSlotDialog';
import { PageHeading, SectionMark } from '@/components/SectionTitle';
import { appointmentTone } from '@/components/StatusPill';
import { clockToMinutes, daySlotStarts, minutesToClock, slotFloor } from '@/lib/day-slots';

export type { AppointmentRow };

export type OpenInvoiceRow = {
  id: string;
  total: number;
  visit_id: string | null;
  clients: { full_name: string } | { full_name: string }[] | null;
  visits: { patients: { name: string } | { name: string }[] | null } | { patients: { name: string } | { name: string }[] | null }[] | null;
};

export function DayBoard({
  title,
  date,
  appointments,
  invoices = [],
  clinicName,
  branchName,
}: {
  title: string;
  date: string;
  appointments: AppointmentRow[];
  invoices?: OpenInvoiceRow[];
  clinicName: string;
  branchName?: string;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, AppointmentStatus>>({});
  const [openId, setOpenId] = useState<string | null>(null);
  const [bookTime, setBookTime] = useState<string | null>(null);

  const visible = useMemo(
    () =>
      appointments
        .map((row) => (overrides[row.id] ? { ...row, status: overrides[row.id] } : row))
        .sort((a, b) => a.starts_at.localeCompare(b.starts_at)),
    [appointments, overrides],
  );
  const selected = visible.find((row) => row.id === openId) ?? null;
  const nowClock = formatMexicoTime(new Date().toISOString());
  const nowSlot = slotFloor(clockToMinutes(nowClock));
  const slots = useMemo(() => {
    const starts = daySlotStarts(visible, formatMexicoTime);
    const bySlot = new Map<number, AppointmentRow[]>();
    for (const start of starts) bySlot.set(start, []);
    for (const row of visible) {
      const key = slotFloor(clockToMinutes(formatMexicoTime(row.starts_at)));
      const list = bySlot.get(key) ?? [];
      list.push(row);
      bySlot.set(key, list);
    }
    return starts.map((start) => ({ start, clock: minutesToClock(start), rows: bySlot.get(start) ?? [] }));
  }, [visible]);

  async function changeStatus(id: string, next: AppointmentStatus, previous: AppointmentStatus) {
    const normalized = floorStatus(previous);
    if (next === normalized) return;
    setOverrides((current) => ({ ...current, [id]: next }));
    setBusyId(id);
    setError(null);
    const result = await moveAppointment(id, next);
    setBusyId(null);
    if (!result.ok) {
      setOverrides((current) => {
        const copy = { ...current };
        delete copy[id];
        return copy;
      });
      setError(result.error);
      return;
    }
    router.refresh();
  }

  function nextFreeClock() {
    const upcoming = slots.find((slot) => slot.start >= nowSlot && slot.rows.length === 0);
    return upcoming?.clock ?? slots.find((slot) => slot.rows.length === 0)?.clock ?? '09:00';
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          mark="hoy"
          kicker={`Sala de espera · ${branchName ?? clinicName}`}
          title={title}
          description="Horario completo del día. Un hueco abre la ficha para agendar; una cita abre el detalle."
        />
        <div className="flex flex-wrap gap-2">
          <button type="button" className="pe-btn-primary px-4 py-2 text-sm" onClick={() => setBookTime(nextFreeClock())}>
            Agendar
          </button>
          <Link href="/agenda" className="pe-btn-secondary px-4 py-2 text-sm">
            Semana / mes
          </Link>
        </div>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="pe-card overflow-x-auto">
        <table className="w-full min-w-[40rem] text-left text-sm">
          <thead>
            <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <th className="px-3 py-2.5">Hora</th>
              <th className="px-3 py-2.5">Paciente</th>
              <th className="px-3 py-2.5">Tutor</th>
              <th className="px-3 py-2.5">Motivo</th>
              <th className="px-3 py-2.5">Estatus</th>
            </tr>
          </thead>
          <tbody>
            {slots.map((slot) => {
              if (slot.rows.length === 0) {
                return (
                  <tr key={slot.clock} className={`border-b border-pe-line ${slot.start === nowSlot ? 'bg-pe-wash/60' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2 tabular-nums text-pe-muted">{slot.clock}</td>
                    <td colSpan={4} className="px-3 py-2">
                      <button
                        type="button"
                        className="text-sm text-pe-clay-700 hover:underline"
                        onClick={() => setBookTime(slot.clock)}
                      >
                        Libre · agendar
                      </button>
                    </td>
                  </tr>
                );
              }
              return slot.rows.map((row) => {
                const client = one(row.clients);
                const patient = one(row.patients);
                return (
                  <tr
                    key={row.id}
                    className={`cursor-pointer border-b border-pe-line last:border-0 hover:bg-pe-wash ${
                      slot.start === nowSlot ? 'bg-pe-wash/40' : ''
                    }`}
                    onClick={() => setOpenId(row.id)}
                  >
                    <td className="whitespace-nowrap px-3 py-2.5 tabular-nums font-semibold">
                      {formatMexicoTime(row.starts_at)}
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium">{patient?.name ?? 'Paciente'}</p>
                      {patient?.alerts ? (
                        <p className="text-[11px] font-medium text-amber-800">{patient.alerts}</p>
                      ) : null}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5 text-pe-muted">{client?.full_name ?? '—'}</td>
                    <td className="max-w-[14rem] px-3 py-2.5 text-pe-ink">
                      {row.reason?.trim() || <span className="text-pe-muted">—</span>}
                    </td>
                    <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
                      <select
                        className={`pe-input py-1 text-xs ${appointmentTone(floorStatus(row.status))}`}
                        value={floorStatus(row.status)}
                        disabled={busyId === row.id}
                        aria-label={`Estatus de ${patient?.name ?? 'la cita'}`}
                        onChange={(event) =>
                          void changeStatus(row.id, event.target.value as AppointmentStatus, row.status)
                        }
                      >
                        {FLOOR_STATUSES.map((item) => (
                          <option key={item} value={item}>
                            {APPOINTMENT_STATUS_LABELS[item]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              });
            })}
          </tbody>
        </table>
      </div>
      <div className="pe-card p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
            <SectionMark name="caja" size="sm" />
            Por cobrar
          </h2>
          <span className="text-xs tabular-nums text-pe-muted">{invoices.length}</span>
        </div>
        {invoices.length === 0 ? (
          <p className="text-sm text-pe-muted">Nada pendiente en caja.</p>
        ) : (
          <ul className="divide-y divide-pe-line">
            {invoices.map((invoice) => {
              const client = one(invoice.clients);
              const visit = one(invoice.visits);
              const patient = one(visit?.patients ?? null);
              return (
                <li key={invoice.id}>
                  <Link
                    href={invoice.visit_id ? `/consultas/${invoice.visit_id}` : '/caja'}
                    className="flex items-center justify-between gap-3 py-2.5"
                  >
                    <span>
                      <span className="font-medium">{patient?.name ?? 'Ticket'}</span>
                      <span className="ml-2 text-sm text-pe-muted">{client?.full_name ?? '—'}</span>
                    </span>
                    <span className="tabular-nums text-sm">{formatMoney(Number(invoice.total))}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </div>
      {selected ? (
        <AppointmentPeek appointment={selected} onClose={() => setOpenId(null)} onMoved={() => router.refresh()} />
      ) : null}
      {bookTime ? (
        <BookSlotDialog
          date={date}
          time={bookTime}
          onClose={() => setBookTime(null)}
          onCreated={() => {
            setBookTime(null);
            router.refresh();
          }}
        />
      ) : null}
    </section>
  );
}
