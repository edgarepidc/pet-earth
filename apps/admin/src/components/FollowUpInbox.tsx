'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { REMINDER_KIND_LABELS, todayMexicoYmd, type ReminderKind } from '@petearth/shared';

import { ReminderPill } from '@/components/StatusPill';

type Reminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  due_on: string;
  clients: { full_name: string } | { full_name: string }[] | null;
  patients: { name: string } | { name: string }[] | null;
};

function one<T>(value: T | T[] | null): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function FollowUpInbox({ reminders }: { reminders: Reminder[] }) {
  const router = useRouter();
  const today = todayMexicoYmd();
  const [filter, setFilter] = useState<'all' | 'overdue' | ReminderKind>('all');

  const rows = useMemo(() => {
    return reminders.filter((row) => {
      if (filter === 'all') return true;
      if (filter === 'overdue') return row.due_on <= today;
      return row.kind === filter;
    });
  }, [reminders, filter, today]);

  async function mark(id: string, status: 'done' | 'cancelled') {
    await fetch('/api/reminders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, status }),
    });
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">Seguimiento</h1>
        <p className="text-sm text-slate-500">Citas, vacunas, controles y desparasitación pendientes.</p>
      </div>
      <div className="flex flex-wrap gap-2">
        {(['all', 'overdue', 'appointment', 'vaccine', 'followup', 'deworming'] as const).map((key) => (
          <button
            key={key}
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${filter === key ? 'pe-nav-active' : ''}`}
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
                </p>
              </div>
              <div className="flex gap-2">
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
