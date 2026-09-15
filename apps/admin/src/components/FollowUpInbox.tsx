'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { REMINDER_KIND_LABELS, todayMexicoYmd, vaccineWhatsAppText, type ReminderKind } from '@petearth/shared';

import { ReminderPill } from '@/components/StatusPill';
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

export function FollowUpInbox({
  reminders,
  clinicName,
}: {
  reminders: Reminder[];
  clinicName: string;
}) {
  const router = useRouter();
  const today = todayMexicoYmd();
  const [filter, setFilter] = useState<'all' | 'overdue' | ReminderKind>('all');

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

  async function email(id: string) {
    setBusy(id + 'email');
    setError(null);
    const response = await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'email' }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo enviar el correo.');
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="pe-kicker">Clínico</p>
        <h1 className="font-serif text-2xl font-semibold">Seguimiento</h1>
        <p className="text-sm text-[#6b5e55]">Citas, vacunas, controles y desparasitación pendientes. WhatsApp o correo.</p>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="flex flex-wrap gap-2">
        {(['all', 'overdue', 'appointment', 'vaccine', 'followup', 'deworming'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${filter === key ? 'pe-chip-active' : ''}`}
            onClick={() => setFilter(key)}
          >
            {key === 'all' ? 'Todos' : key === 'overdue' ? 'Vencidos' : REMINDER_KIND_LABELS[key]}
          </button>
        ))}
      </div>
      <ul className="space-y-2">
        {rows.map((row) => {
          const overdue = row.due_on <= today;
          return (
            <li key={row.id} className="pe-glass-card flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <ReminderPill kind={row.kind} />
                <p className="mt-1 font-medium">{row.title}</p>
                <p className="text-sm text-slate-500">
                  {one(row.patients)?.name} · {one(row.clients)?.full_name} · {row.due_on}
                  {overdue ? ' · vencido' : ''}
                  {row.last_emailed_at ? ' · correo enviado' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <WhatsAppLink
                  phone={one(row.clients)?.phone}
                  className="pe-btn-secondary px-3 py-1.5 text-sm"
                  text={vaccineWhatsAppText({
                    tutorName: one(row.clients)?.full_name ?? 'tutor',
                    patientName: one(row.patients)?.name ?? 'tu mascota',
                    clinicName,
                    title: row.title,
                    dueOn: row.due_on,
                  })}
                />
                <button
                  type="button"
                  className="pe-btn-secondary px-3 py-1.5 text-sm"
                  disabled={busy !== null || !one(row.clients)?.email}
                  onClick={() => void email(row.id)}
                >
                  Correo
                </button>
                <button type="button" className="pe-btn-primary px-3 py-1.5 text-sm" onClick={() => mark(row.id, 'done')}>
                  Hecho
                </button>
                <button type="button" className="pe-btn-ghost px-3 py-1.5 text-sm" onClick={() => mark(row.id, 'cancelled')}>
                  Descartar
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
