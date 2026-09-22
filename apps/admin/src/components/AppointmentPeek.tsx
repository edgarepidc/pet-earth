'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  APPOINTMENT_STATUS_LABELS,
  formatMexicoDate,
  formatMexicoTime,
  speciesLabel,
  todayMexicoYmd,
  type AppointmentStatus,
} from '@petearth/shared';

import { appointmentTone, StatusPill } from '@/components/StatusPill';

export const FLOOR_STATUSES: AppointmentStatus[] = [
  'scheduled',
  'waiting',
  'in_consult',
  'completed',
  'no_show',
  'cancelled',
];

export function floorStatus(status: AppointmentStatus): AppointmentStatus {
  return status === 'confirmed' ? 'scheduled' : status;
}

export function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export type ClinicVet = { id: string; full_name: string };

export type AppointmentRow = {
  id: string;
  starts_at: string;
  ends_at: string;
  status: AppointmentStatus;
  reason: string | null;
  vet_id?: string | null;
  vet_name?: string | null;
  clients: { full_name: string; phone: string | null } | { full_name: string; phone: string | null }[] | null;
  patients:
    | { id?: string; name: string; species: string; alerts: string | null }
    | { id?: string; name: string; species: string; alerts: string | null }[]
    | null;
  visits?: { id: string; status: string } | { id: string; status: string }[] | null;
};

export async function moveAppointment(id: string, status: AppointmentStatus) {
  const response = await fetch('/api/appointments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'move', status }),
  });
  const payload = (await response.json().catch(() => null)) as { error?: string } | null;
  if (!response.ok) return { ok: false as const, error: payload?.error ?? 'No se pudo actualizar el estatus' };
  return { ok: true as const };
}

export async function startAppointmentVisit(id: string) {
  const response = await fetch('/api/appointments', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id, action: 'start-visit' }),
  });
  const payload = (await response.json().catch(() => null)) as { error?: string; visitId?: string } | null;
  if (!response.ok) return { ok: false as const, error: payload?.error ?? 'No se pudo abrir la consulta' };
  return { ok: true as const, visitId: payload?.visitId };
}

type VisitPeek = {
  id: string;
  status: string;
  started_at: string;
  completed_at: string | null;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
  weight_kg: number | null;
  temperature_c: number | null;
  heart_rate: number | null;
  respiratory_rate: number | null;
  followup_at: string | null;
};

export function AppointmentPeek({
  appointment,
  onClose,
  onMoved,
}: {
  appointment: AppointmentRow;
  onClose: () => void;
  onMoved?: () => void;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [visit, setVisit] = useState<VisitPeek | null>(null);
  const [status, setStatus] = useState<AppointmentStatus>(floorStatus(appointment.status));

  const client = one(appointment.clients);
  const patient = one(appointment.patients);
  const day = todayMexicoYmd(new Date(appointment.starts_at));
  const existingVisitId = one(appointment.visits)?.id ?? visit?.id ?? null;

  useEffect(() => {
    setStatus(floorStatus(appointment.status));
    const controller = new AbortController();
    void fetch(`/api/appointments?id=${appointment.id}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) return;
        const payload = (await response.json()) as { visit?: VisitPeek | null };
        setVisit(payload.visit ?? null);
      })
      .catch(() => undefined);
    return () => controller.abort();
  }, [appointment.id, appointment.status]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  async function changeStatus(next: AppointmentStatus) {
    if (next === status) return;
    setBusy(true);
    setError(null);
    const result = await moveAppointment(appointment.id, next);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setStatus(next);
    onMoved?.();
    router.refresh();
  }

  async function openVisit() {
    setBusy(true);
    setError(null);
    const result = await startAppointmentVisit(appointment.id);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    if (result.visitId) router.push(`/consultas/${result.visitId}`);
  }

  const soap = [
    visit?.subjective ? `S: ${visit.subjective}` : null,
    visit?.objective ? `O: ${visit.objective}` : null,
    visit?.assessment ? `A: ${visit.assessment}` : null,
    visit?.plan ? `P: ${visit.plan}` : null,
  ].filter(Boolean);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Cerrar" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="appointment-peek-title"
        className="pe-card relative z-10 w-full max-w-lg p-5"
      >
        <p className="pe-kicker">Cita</p>
        <div className="mt-1 flex items-start justify-between gap-3">
          <div>
            <h2 id="appointment-peek-title" className="text-xl font-semibold tracking-tight">
              {patient?.name ?? 'Paciente'}
            </h2>
            <p className="mt-1 text-sm text-pe-muted">
              {formatMexicoDate(day, { weekday: 'long', day: 'numeric', month: 'long' })} ·{' '}
              {formatMexicoTime(appointment.starts_at)}
              {appointment.ends_at ? ` – ${formatMexicoTime(appointment.ends_at)}` : ''}
            </p>
          </div>
          <StatusPill status={status} />
        </div>

        <dl className="mt-4 grid gap-3 text-sm">
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Motivo</dt>
            <dd className="mt-0.5 font-medium">{appointment.reason?.trim() || 'Sin motivo registrado'}</dd>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Tutor</dt>
              <dd className="mt-0.5">{client?.full_name ?? '—'}</dd>
              {client?.phone ? <dd className="text-pe-muted">{client.phone}</dd> : null}
            </div>
            <div>
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Paciente</dt>
              <dd className="mt-0.5">{speciesLabel(patient?.species)}</dd>
              {patient?.id ? (
                <dd>
                  <Link href={`/pacientes/${patient.id}`} className="pe-link text-sm">
                    Ver expediente
                  </Link>
                </dd>
              ) : null}
            </div>
          </div>
          <div>
            <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Veterinario</dt>
            <dd className="mt-0.5">{appointment.vet_name?.trim() || 'Sin asignar'}</dd>
          </div>
          {patient?.alerts ? (
            <div className="pe-callout-amber p-3">
              <dt className="text-[11px] font-bold uppercase tracking-[0.12em]">Alertas</dt>
              <dd className="mt-1">{patient.alerts}</dd>
            </div>
          ) : null}
        </dl>

        <label className="mt-4 block text-sm font-medium">
          Estatus
          <select
            className={`pe-input mt-1 py-1.5 text-sm font-semibold ${appointmentTone(status)}`}
            value={status}
            disabled={busy}
            onChange={(event) => void changeStatus(event.target.value as AppointmentStatus)}
          >
            {FLOOR_STATUSES.map((item) => (
              <option key={item} value={item}>
                {APPOINTMENT_STATUS_LABELS[item]}
              </option>
            ))}
          </select>
        </label>

        {visit ? (
          <section className="mt-4 border-t border-pe-line pt-3">
            <h3 className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Consulta</h3>
            <p className="mt-1 text-sm text-pe-muted">
              {visit.status === 'completed' ? 'Cerrada' : 'En curso'}
              {visit.weight_kg != null ? ` · ${Number(visit.weight_kg)} kg` : ''}
              {visit.temperature_c != null ? ` · ${Number(visit.temperature_c)} °C` : ''}
            </p>
            {soap.length > 0 ? (
              <ul className="mt-2 space-y-1 text-sm">
                {soap.map((line) => (
                  <li key={line} className="whitespace-pre-wrap text-pe-ink">
                    {line}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-pe-muted">Aún no hay nota SOAP.</p>
            )}
          </section>
        ) : (
          <p className="mt-4 text-sm text-pe-muted">Todavía no se abre la consulta.</p>
        )}

        {error ? <p className="pe-callout-amber mt-3 p-3 text-sm">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="pe-btn-ghost px-4 py-2 text-sm" onClick={onClose}>
            Cerrar
          </button>
          {status === 'waiting' || status === 'in_consult' || status === 'scheduled' || existingVisitId ? (
            <button type="button" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy} onClick={() => void openVisit()}>
              {existingVisitId || status === 'in_consult' ? 'Abrir consulta' : 'Iniciar consulta'}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
