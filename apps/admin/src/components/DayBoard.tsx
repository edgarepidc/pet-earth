'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

import { formatMexicoTime, formatMoney, type AppointmentStatus } from '@petearth/shared';

import { PageHeading, SectionMark, type SectionMarkName } from '@/components/SectionTitle';

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

const COLUMNS: {
  key: string;
  title: string;
  mark: SectionMarkName;
  statuses: AppointmentStatus[];
  dropStatus: AppointmentStatus;
}[] = [
  { key: 'scheduled', title: 'Agendado', mark: 'agenda', statuses: ['scheduled', 'confirmed'], dropStatus: 'scheduled' },
  { key: 'waiting', title: 'En sala', mark: 'sala', statuses: ['waiting'], dropStatus: 'waiting' },
  { key: 'consult', title: 'En consulta', mark: 'consulta', statuses: ['in_consult'], dropStatus: 'in_consult' },
  { key: 'done', title: 'Alta', mark: 'alta', statuses: ['completed'], dropStatus: 'completed' },
  { key: 'missed', title: 'No-show', mark: 'missed', statuses: ['no_show', 'cancelled'], dropStatus: 'no_show' },
];

const COLUMN_BY_KEY = new Map(COLUMNS.map((col) => [col.key, col]));

type DragState = {
  id: string;
  label: string;
  fromKey: string;
  x: number;
  y: number;
  originX: number;
  originY: number;
  width: number;
  armed: boolean;
};

function columnKeyFromPoint(x: number, y: number) {
  const el = document.elementFromPoint(x, y);
  return el?.closest('[data-board-col]')?.getAttribute('data-board-col') ?? null;
}

export function DayBoard({
  title,
  appointments,
  invoices = [],
  clinicName,
  branchName,
}: {
  title: string;
  appointments: AppointmentRow[];
  invoices?: OpenInvoiceRow[];
  clinicName: string;
  branchName?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, AppointmentStatus>>({});
  const [drag, setDrag] = useState<DragState | null>(null);
  const [overKey, setOverKey] = useState<string | null>(null);
  const dragRef = useRef<DragState | null>(null);
  const htmlPayloadRef = useRef<{ id: string; status: AppointmentStatus; fromKey: string } | null>(null);
  dragRef.current = drag;

  const visible = useMemo(
    () => appointments.map((row) => (overrides[row.id] ? { ...row, status: overrides[row.id] } : row)),
    [appointments, overrides],
  );

  const grouped = useMemo(() => {
    const map = new Map<string, AppointmentRow[]>();
    for (const col of COLUMNS) map.set(col.key, []);
    for (const row of visible) {
      const col = COLUMNS.find((item) => item.statuses.includes(row.status));
      if (!col) continue;
      map.get(col.key)?.push(row);
    }
    return map;
  }, [visible]);

  async function openVisit(id: string) {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'start-visit' }),
    });
    const payload = (await response.json()) as { error?: string; visitId?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo abrir la consulta');
      return;
    }
    if (payload.visitId) router.push(`/consultas/${payload.visitId}`);
  }

  async function moveTo(id: string, columnKey: string, previousStatus: AppointmentStatus) {
    const col = COLUMN_BY_KEY.get(columnKey);
    if (!col) return;
    if (col.statuses.includes(previousStatus)) return;

    setOverrides((current) => ({ ...current, [id]: col.dropStatus }));
    setBusy(true);
    setError(null);
    const response = await fetch('/api/appointments', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, action: 'move', status: col.dropStatus }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setOverrides((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setError(payload.error ?? 'No se pudo mover la ficha');
      return;
    }
    router.refresh();
  }

  function beginHtmlDrag(event: React.DragEvent<HTMLLIElement>, row: AppointmentRow, fromKey: string) {
    if ((event.target as HTMLElement).closest('button,a,input')) {
      event.preventDefault();
      return;
    }
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', JSON.stringify({ id: row.id, status: row.status, fromKey }));
    htmlPayloadRef.current = { id: row.id, status: row.status, fromKey };
    const patient = one(row.patients);
    setDrag({
      id: row.id,
      label: `${formatMexicoTime(row.starts_at)} · ${patient?.name ?? 'Paciente'}`,
      fromKey,
      x: event.clientX,
      y: event.clientY,
      originX: event.clientX,
      originY: event.clientY,
      width: event.currentTarget.getBoundingClientRect().width,
      armed: true,
    });
    setOverKey(fromKey);
  }

  function dropOnColumn(event: React.DragEvent<HTMLElement>, columnKey: string) {
    event.preventDefault();
    event.stopPropagation();
    setOverKey(null);
    setDrag(null);
    const raw = event.dataTransfer.getData('text/plain');
    const payload = htmlPayloadRef.current ?? (raw ? (JSON.parse(raw) as { id: string; status: AppointmentStatus; fromKey: string }) : null);
    htmlPayloadRef.current = null;
    if (!payload) return;
    if (payload.fromKey === columnKey) return;
    void moveTo(payload.id, columnKey, payload.status);
  }

  function beginDrag(event: React.PointerEvent<HTMLLIElement>, row: AppointmentRow, fromKey: string) {
    if (event.pointerType === 'mouse') return;
    if (event.button !== 0) return;
    if ((event.target as HTMLElement).closest('button,a,input')) return;
    const patient = one(row.patients);
    const rect = event.currentTarget.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDrag({
      id: row.id,
      label: `${formatMexicoTime(row.starts_at)} · ${patient?.name ?? 'Paciente'}`,
      fromKey,
      x: event.clientX,
      y: event.clientY,
      originX: event.clientX,
      originY: event.clientY,
      width: rect.width,
      armed: false,
    });
  }

  function updateDrag(event: React.PointerEvent<HTMLLIElement>) {
    const current = dragRef.current;
    if (!current) return;
    const dx = event.clientX - current.originX;
    const dy = event.clientY - current.originY;
    const armed = current.armed || dx * dx + dy * dy > 36;
    if (!armed) return;
    event.preventDefault();
    setDrag({ ...current, x: event.clientX, y: event.clientY, armed: true });
    setOverKey(columnKeyFromPoint(event.clientX, event.clientY));
  }

  function endDrag(event: React.PointerEvent<HTMLLIElement>, row: AppointmentRow) {
    const current = dragRef.current;
    setDrag(null);
    setOverKey(null);
    if (!current?.armed) return;
    const target = columnKeyFromPoint(event.clientX, event.clientY);
    if (!target || target === current.fromKey) return;
    void moveTo(row.id, target, row.status);
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          mark="hoy"
          kicker={`Sala de espera · ${branchName ?? clinicName}`}
          title={title}
          description="Arrastra las fichas entre columnas. Consulta abre la nota."
        />
        <Link href="/agenda" className="pe-btn-secondary px-4 py-2 text-sm">
          Semana / mes
        </Link>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="grid gap-3 xl:grid-cols-6 md:grid-cols-3">
        {COLUMNS.map((col) => {
          const rows = grouped.get(col.key) ?? [];
          const isOver = overKey === col.key && drag?.fromKey !== col.key;
          return (
            <div
              key={col.key}
              data-board-col={col.key}
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
                setOverKey(col.key);
              }}
              onDragLeave={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) setOverKey(null);
              }}
              onDrop={(event) => dropOnColumn(event, col.key)}
              className={`pe-card min-h-48 p-3 transition-shadow ${isOver ? 'ring-2 ring-pe-clay shadow-md' : ''}`}
            >
              <div className="mb-2 flex items-center justify-between gap-2">
                <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
                  <SectionMark name={col.mark} size="sm" />
                  {col.title}
                </h2>
                <span className="text-xs tabular-nums text-pe-muted">{rows.length}</span>
              </div>
              <ul className="space-y-2">
                {rows.map((row) => {
                  const client = one(row.clients);
                  const patient = one(row.patients);
                  const visit = one(row.visits);
                  const canOpen = row.status === 'waiting' || row.status === 'in_consult' || row.status === 'confirmed';
                  const isDragging = drag?.id === row.id && drag.armed;
                  return (
                    <li
                      key={row.id}
                      draggable
                      onDragStart={(event) => beginHtmlDrag(event, row, col.key)}
                      onDragOver={(event) => {
                        event.preventDefault();
                        event.dataTransfer.dropEffect = 'move';
                        setOverKey(col.key);
                      }}
                      onDrop={(event) => dropOnColumn(event, col.key)}
                      onDragEnd={() => {
                        setDrag(null);
                        setOverKey(null);
                      }}
                      onPointerDown={(event) => beginDrag(event, row, col.key)}
                      onPointerMove={updateDrag}
                      onPointerUp={(event) => endDrag(event, row)}
                      onPointerCancel={() => {
                        setDrag(null);
                        setOverKey(null);
                      }}
                      className={`cursor-grab touch-none rounded-md border border-[rgba(42,34,28,0.1)] bg-white p-2.5 active:cursor-grabbing ${
                        isDragging ? 'opacity-40' : ''
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 select-none text-[10px] leading-3 tracking-tighter text-pe-muted" aria-hidden>
                          ⠿
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <p className="text-sm font-semibold leading-5">
                              {formatMexicoTime(row.starts_at)} · {patient?.name ?? 'Paciente'}
                            </p>
                            {canOpen ? (
                              <button
                                type="button"
                                className="shrink-0 text-xs font-semibold text-pe-clay-700 hover:underline"
                                disabled={busy}
                                onClick={() => void openVisit(row.id)}
                              >
                                {visit?.id || row.status === 'in_consult' ? 'Abrir' : 'Consulta'}
                              </button>
                            ) : null}
                          </div>
                          <p className="truncate text-xs text-pe-muted">
                            {client?.full_name ?? '—'}
                            {row.reason ? ` · ${row.reason}` : ''}
                          </p>
                          {patient?.alerts ? (
                            <p className="mt-1 truncate text-[11px] font-medium text-amber-800">{patient.alerts}</p>
                          ) : null}
                        </div>
                      </div>
                    </li>
                  );
                })}
                {rows.length === 0 ? (
                  <li
                    className="rounded-md border border-dashed border-[rgba(42,34,28,0.12)] px-2 py-6 text-center text-[11px] text-pe-muted"
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                      setOverKey(col.key);
                    }}
                    onDrop={(event) => dropOnColumn(event, col.key)}
                  >
                    {drag?.armed ? 'Suelta aquí' : 'Sin fichas'}
                  </li>
                ) : null}
              </ul>
            </div>
          );
        })}
        <div className="pe-card min-h-48 p-3">
          <div className="mb-2 flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
              <SectionMark name="caja" size="sm" />
              Por cobrar
            </h2>
            <span className="text-xs tabular-nums text-pe-muted">{invoices.length}</span>
          </div>
          <ul className="space-y-2">
            {invoices.map((invoice) => {
              const client = one(invoice.clients);
              const visit = one(invoice.visits);
              const patient = one(visit?.patients ?? null);
              return (
                <li key={invoice.id}>
                  <Link
                    href={invoice.visit_id ? `/consultas/${invoice.visit_id}` : '/caja'}
                    className="block rounded-md border border-[rgba(42,34,28,0.1)] bg-white p-2.5"
                  >
                    <p className="text-sm font-semibold">
                      {patient?.name ?? 'Ticket'}
                      <span className="ml-1 font-normal tabular-nums text-pe-muted">{formatMoney(Number(invoice.total))}</span>
                    </p>
                    <p className="truncate text-xs text-pe-muted">{client?.full_name ?? '—'}</p>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </div>
      {drag?.armed ? (
        <div
          className="pointer-events-none fixed z-50 rounded-md border border-[rgba(42,34,28,0.16)] bg-white px-3 py-2 text-sm font-semibold shadow-lg"
          style={{
            left: drag.x + 12,
            top: drag.y + 12,
            width: drag.width,
          }}
        >
          {drag.label}
        </div>
      ) : null}
    </section>
  );
}
