'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  formatMexicoTime,
  type AppointmentStatus,
} from '@petearth/shared';

import { StatusPill } from '@/components/StatusPill';

export type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reason: string | null;
  clients: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
  patients: { name: string; species: string; alerts: string | null } | { name: string; species: string; alerts: string | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function DayBoard({
  title,
  appointments,
}: {
  title: string;
  appointments: AppointmentRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function act(id: string, action: string) {
    setBusy(id + action);
    setError(null);
    const response = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action }),
    });
    const payload = (await response.json()) as { error?: string; visitId?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo actualizar la cita');
      return;
    }
    if (payload.visitId) {
      router.push(`/consultas/${payload.visitId}`);
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="text-sm text-slate-500">Sala de espera del día. Check-in → consulta → ticket.</p>
        </div>
        <Link href="/agenda" className="pe-btn-secondary px-4 py-2 text-sm">
          Ver semana / mes
        </Link>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {appointments.length === 0 ? (
        <div className="pe-glass-card p-6 text-sm text-slate-500">No hay citas en este día.</div>
      ) : (
        <ul className="space-y-3">
          {appointments.map((row) => {
            const client = one(row.clients);
            const patient = one(row.patients);
            return (
              <li key={row.id} className="pe-glass-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">
                      {formatMexicoTime(row.starts_at)} · {patient?.name ?? 'Paciente'}
                    </p>
                    <p className="text-sm text-slate-500">
                      Tutor: {client?.full_name ?? '—'} {row.reason ? `· ${row.reason}` : ''}
                    </p>
                    {patient?.alerts ? (
                      <p className="mt-1 text-xs font-medium text-amber-800">Alerta: {patient.alerts}</p>
                    ) : null}
                  </div>
                  <StatusPill status={row.status} />
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {row.status === 'scheduled' || row.status === 'confirmed' ? (
                    <button
                      type="button"
                      className="pe-btn-secondary px-3 py-1.5 text-sm"
                      disabled={busy !== null}
                      onClick={() => act(row.id, 'check-in')}
                    >
                      Check-in
                    </button>
                  ) : null}
                  {row.status === 'waiting' || row.status === 'in_consult' || row.status === 'confirmed' ? (
                    <button
                      type="button"
                      className="pe-btn-primary px-3 py-1.5 text-sm"
                      disabled={busy !== null}
                      onClick={() => act(row.id, 'start-visit')}
                    >
                      {row.status === 'in_consult' ? 'Abrir consulta' : 'Iniciar consulta'}
                    </button>
                  ) : null}
                  {row.status !== 'completed' && row.status !== 'cancelled' ? (
                    <button
                      type="button"
                      className="pe-btn-ghost px-3 py-1.5 text-sm"
                      disabled={busy !== null}
                      onClick={() => act(row.id, 'cancel')}
                    >
                      Cancelar
                    </button>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
