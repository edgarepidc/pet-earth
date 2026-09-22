'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { REMINDER_KIND_LABELS, todayMexicoYmd, vaccineWhatsAppText, type ReminderKind } from '@petearth/shared';

import { ReminderPill } from '@/components/StatusPill';
import { PageHeading } from '@/components/SectionTitle';
import { WhatsAppLink } from '@/components/WhatsAppLink';

type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  due_on: string;
  last_emailed_at?: string | null;
  clients:
    | { full_name: string; phone?: string | null; email?: string | null }
    | { full_name: string; phone?: string | null; email?: string | null }[]
    | null;
  patients: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const FILTERS = ['all', 'overdue', 'appointment', 'vaccine', 'followup', 'deworming'] as const;

export function FollowUpInbox({
  reminders,
  clinicName,
}: {
  reminders: Reminder[];
  clinicName: string;
}) {
  const router = useRouter();
  const today = todayMexicoYmd();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('all');
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rows = useMemo(() => {
    return reminders.filter((row) => {
      if (filter === 'all') return true;
      if (filter === 'overdue') return row.due_on <= today;
      return row.kind === filter;
    });
  }, [reminders, filter, today]);

  async function mark(id: string, status: 'done' | 'cancelled') {
    setBusy(id + status);
    setError(null);
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    setBusy(null);
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          mark="seguimiento"
          kicker="Clínico"
          title="Seguimiento"
          description="Citas, vacunas y controles pendientes."
        />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {FILTERS.map((key) => (
            <button
              key={key}
              type="button"
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                filter === key ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'
              }`}
              onClick={() => setFilter(key)}
            >
              {key === 'all' ? 'Todas' : key === 'overdue' ? 'Vencidas' : REMINDER_KIND_LABELS[key]}
            </button>
          ))}
        </div>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {rows.length === 0 ? (
        <p className="pe-card p-6 text-sm text-pe-muted">Nada pendiente en este filtro.</p>
      ) : (
        <ul className="pe-card divide-y divide-pe-line">
          {rows.map((row) => {
            const overdue = row.due_on <= today;
            const client = one(row.clients);
            const patient = one(row.patients);
            return (
              <li key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <ReminderPill kind={row.kind} />
                    {overdue ? <span className="pe-pill bg-amber-100 text-amber-900">Vencida</span> : null}
                  </div>
                  <p className="mt-1 truncate font-medium">{row.title}</p>
                  <p className="truncate text-sm text-pe-muted">
                    {patient?.name ?? 'Paciente'} · {client?.full_name ?? 'Tutor'} · {row.due_on}
                  </p>
                </div>
                <div className="flex shrink-0 flex-nowrap items-center gap-2">
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
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
