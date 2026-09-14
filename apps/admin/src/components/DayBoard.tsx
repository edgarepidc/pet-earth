'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { formatMexicoTime, type AppointmentStatus } from '@petearth/shared';

import { StatusPill } from '@/components/StatusPill';

export type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reason: string | null;
  clients: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
  patients: { name: string; species: string; alerts: string | null } | { name: string; species: string; alerts: string | null }[] | null;
  visits?: { id: string; status: string } | { id: string; status: string }[] | null;
};

export type OpenInvoiceRow = {
  id: string;
  total: number;
  visit_id: string | null;
  clients: { full_name: string } | { full_name: string }[] | null;
  visits: { patients: { name: string } | { name: string }[] | null } | { patients: { name: string } | { name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

const COLUMNS: { key: string; title: string; statuses: AppointmentStatus[] }[] = [
  { key: 'scheduled', title: 'Agendado', statuses: ['scheduled', 'confirmed'] },
  { key: 'waiting', title: 'En sala', statuses: ['waiting'] },
  { key: 'consult', title: 'En consulta', statuses: ['in_consult'] },
  { key: 'done', title: 'Alta', statuses: ['completed'] },
  { key: 'missed', title: 'No-show', statuses: ['no_show', 'cancelled'] },
];

export function DayBoard({
  title,
  appointments,
  invoices = [],
}: {
  title: string;
  appointments: AppointmentRow[];
  invoices?: OpenInvoiceRow[];
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const row of appointments) {
      const col = COLUMNS.find((item) => item.statuses.includes(row.status));
      if (!col) continue;
      map.get(col.key)?.push(row);
    }
    return map;
  }, [appointments]);

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
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="pe-kicker">Sala de espera</p>
          <h1 className="font-serif text-2xl font-semibold">{title}</h1>
          <p className="text-sm text-[#6b5e55]">Check-in → consulta → cobro. El piso entero en un vistazo.</p>
        </div>
        <Link href="/agenda" className="pe-btn-secondary px-4 py-2 text-sm">
          Semana / mes
        </Link>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const rows = grouped.get(col.key) ?? [];
          return (
            <div key={col.key} className="pe-card min-h-48 p-3">
              <div className="mb-2 flex items-baseline justify-between">
                <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b5e55]">{col.title}</h2>
                <span className="text-xs tabular-nums text-[#6b5e55]">{rows.length}</span>
              </div>
              <ul className="space-y-2">
                {rows.map((row) => {
                  const client = one(row.clients);
                  const patient = one(row.patients);
                  const visit = one(row.visits);
                  return (
                    <li key={row.id} className="rounded-md border border-[rgba(42,34,28,0.1)] bg-white p-2.5">
                      <p className="text-sm font-semibold">
                        {formatMexicoTime(row.starts_at)} · {patient?.name ?? 'Paciente'}
                      </p>
                      <p className="text-xs text-[#6b5e55]">
                        {client?.full_name ?? '—'}
                        {row.reason ? ` · ${row.reason}` : ''}
                      </p>
                      {patient?.alerts ? <p className="mt-1 text-[11px] font-medium text-amber-800">{patient.alerts}</p> : null}
                      <div className="mt-2">
                        <StatusPill status={row.status} />
                      </div>
                      <div className="mt-2 flex flex-wrap gap-1">
                        {row.status === 'scheduled' || row.status === 'confirmed' ? (
                          <button
                            type="button"
                            className="pe-btn-secondary px-2 py-1 text-xs"
                            disabled={busy !== null}
                            onClick={() => act(row.id, 'check-in')}
                          >
                            Check-in
                          </button>
                        ) : null}
                        {row.status === 'waiting' || row.status === 'in_consult' || row.status === 'confirmed' ? (
                          <button
                            type="button"
                            className="pe-btn-primary px-2 py-1 text-xs"
                            disabled={busy !== null}
                            onClick={() => act(row.id, 'start-visit')}
                          >
                            {visit?.id || row.status === 'in_consult' ? 'Abrir' : 'Consulta'}
                          </button>
                        ) : null}
                        {row.status === 'scheduled' || row.status === 'confirmed' || row.status === 'waiting' ? (
                          <button
                            type="button"
                            className="pe-btn-ghost px-2 py-1 text-xs"
                            disabled={busy !== null}
                            onClick={() => act(row.id, 'no_show')}
                          >
                            No-show
                          </button>
                        ) : null}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
        <div className="pe-card min-h-48 p-3">
          <div className="mb-2 flex items-baseline justify-between">
            <h2 className="text-xs font-bold uppercase tracking-[0.12em] text-[#6b5e55]">Por cobrar</h2>
            <span className="text-xs tabular-nums text-[#6b5e55]">{invoices.length}</span>
          </div>
          <ul className="space-y-2">
            {invoices.map((invoice) => {
              const client = one(invoice.clients);
              const visit = one(invoice.visits);
              const patient = one(visit?.patients ?? null);
              return (
                <li key={invoice.id}>
                  <Link href={invoice.visit_id ? `/consultas/${invoice.visit_id}` : '/caja'} className="block rounded-md border border-[rgba(42,34,28,0.1)] bg-white p-2.5">
                    <p className="text-sm font-semibold">{patient?.name ?? 'Ticket'}</p>
                    <p className="text-xs text-[#6b5e55]">{client?.full_name ?? '—'}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
