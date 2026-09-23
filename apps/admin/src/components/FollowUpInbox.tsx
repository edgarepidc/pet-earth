'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  addMexicoDays,
  formatMexicoDate,
  mexicoWeekStart,
  REMINDER_KIND_LABELS,
  todayMexicoYmd,
  vaccineWhatsAppText,
  type ReminderKind,
} from '@petearth/shared';

import { ReminderPill } from '@/components/StatusPill';
import { PageHeading } from '@/components/SectionTitle';
import { WhatsAppLink } from '@/components/WhatsAppLink';

type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  due_on: string;
  last_emailed_at?: string | null;
  patient_id?: string | null;
  clients:
    | { full_name: string; phone?: string | null; email?: string | null }
    | { full_name: string; phone?: string | null; email?: string | null }[]
    | null;
  patients: { id?: string; name: string } | { id?: string; name: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const FILTERS = ['all', 'overdue', 'week', 'vaccine', 'followup', 'deworming'] as const;

function filterLabel(key: (typeof FILTERS)[number]): string {
  if (key === 'all') return 'Todas';
  if (key === 'overdue') return 'Vencidas';
  if (key === 'week') return 'Esta semana';
  return REMINDER_KIND_LABELS[key];
}

export function FollowUpInbox({
  reminders,
  clinicName,
}: {
  reminders: Reminder[];
  clinicName: string;
}) {
  const router = useRouter();
  const today = todayMexicoYmd();
  const weekStart = mexicoWeekStart(today);
  const weekEnd = addMexicoDays(weekStart, 6);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return reminders
      .filter((row) => {
        if (filter === 'all') return true;
        if (filter === 'overdue') return row.due_on <= today;
        if (filter === 'week') return row.due_on >= weekStart && row.due_on <= weekEnd;
        return row.kind === filter;
      })
      .sort((a, b) => {
        const aOver = a.due_on <= today ? 0 : 1;
        const bOver = b.due_on <= today ? 0 : 1;
        if (aOver !== bOver) return aOver - bOver;
        return a.due_on.localeCompare(b.due_on);
      });
  }, [reminders, filter, today, weekStart, weekEnd]);

  async function mark(id: string, status: 'done' | 'cancelled') {
    setBusy(id + status);
    setError(null);
    const response = await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo actualizar el seguimiento.');
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <PageHeading
          mark="seguimiento"
          kicker="Clínico"
          title="Seguimiento"
          description="Vacunas, controles y desparasitación. Las citas viven en Agenda."
        />
        <div className="flex flex-wrap items-center gap-2">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                filter === key ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'
              }`}
              onClick={() => setFilter(key)}
            >
              {filterLabel(key)}
            </button>
          ))}
        </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="pe-card overflow-x-auto px-1 py-2">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <th className="px-3 py-2.5">Fecha</th>
              <th className="px-3 py-2.5">Paciente</th>
              <th className="px-3 py-2.5">Tutor</th>
              <th className="px-3 py-2.5">Tipo</th>
              <th className="px-3 py-2.5">Motivo</th>
              <th className="px-3 py-2.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-b border-pe-line">
                <td className="px-3 py-6 text-pe-muted" colSpan={6}>
                  Nada pendiente en este filtro.
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const overdue = row.due_on <= today;
                const client = one(row.clients);
                const patient = one(row.patients);
                const patientHref = patient?.id ? `/pacientes/${patient.id}` : row.patient_id ? `/pacientes/${row.patient_id}` : null;
                return (
                  <tr key={row.id} className={`border-b border-pe-line ${overdue ? 'bg-amber-50/70' : ''}`}>
                    <td className="whitespace-nowrap px-3 py-2.5">
                      <span className={overdue ? 'font-medium text-amber-900' : 'tabular-nums text-pe-muted'}>
                        {formatMexicoDate(row.due_on)}
                      </span>
                      {overdue ? <span className="mt-0.5 block text-[11px] text-amber-800">Vencida</span> : null}
                    </td>
                    <td className="px-3 py-2.5 font-medium">
                      {patientHref ? (
                        <Link href={patientHref} className="pe-link">
                          {patient?.name ?? 'Paciente'}
                        </Link>
                      ) : (
                        (patient?.name ?? 'Paciente')
                      )}
                    </td>
                    <td className="max-w-[10rem] truncate px-3 py-2.5 text-pe-muted">{client?.full_name ?? 'Tutor'}</td>
                    <td className="px-3 py-2.5">
                      <ReminderPill kind={row.kind} />
                    </td>
                    <td className="min-w-[12rem] px-3 py-2.5 text-pe-ink">{row.title}</td>
                    <td className="px-3 py-2.5">
                      <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                        <WhatsAppLink
                          phone={client?.phone}
                          className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm"
                          text={vaccineWhatsAppText({
                            tutorName: client?.full_name ?? 'tutor',
                            patientName: patient?.name ?? 'tu mascota',
                            clinicName,
                            title: row.title,
                            dueOn: row.due_on,
                          })}
                        />
                        <button
                          type="button"
                          className="pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm"
                          disabled={busy !== null}
                          onClick={() => void mark(row.id, 'done')}
                        >
                          Hecho
                        </button>
                        <button
                          type="button"
                          className="pe-btn-ghost whitespace-nowrap px-3 py-1.5 text-sm"
                          disabled={busy !== null}
                          onClick={() => void mark(row.id, 'cancelled')}
                        >
                          Descartar
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}
