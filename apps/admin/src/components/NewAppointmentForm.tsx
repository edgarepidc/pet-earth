'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { todayMexicoYmd } from '@petearth/shared';

import { clinicSlotClocks } from '@/lib/day-slots';

export function NewAppointmentForm({ patientId, branchName }: { patientId: string; branchName?: string }) {
  const router = useRouter();
  const hours = useMemo(() => clinicSlotClocks(), []);
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState(todayMexicoYmd());
  const [time, setTime] = useState(hours.includes('10:00') ? '10:00' : (hours[0] ?? '10:00'));
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, date, time, reason }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agendar');
      return;
    }
    setReason('');
    setOpen(false);
    router.refresh();
  }

  return (
    <div>
      <button
        type="button"
        className={`mt-3 w-full px-3 py-1.5 text-sm ${open ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
        onClick={() => setOpen((value) => !value)}
      >
        Agendar cita
      </button>
      {open ? (
        <form onSubmit={submit} className="mt-3 grid gap-3">
          {branchName ? <p className="text-sm text-pe-muted">Se guarda en {branchName}.</p> : null}
          <label className="block text-sm font-medium">
            Fecha
            <input type="date" className="pe-input mt-1" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Hora
            <select className="pe-input mt-1" value={time} onChange={(e) => setTime(e.target.value)}>
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium">
            Motivo
            <input className="pe-input mt-1" placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy}>
            {busy ? 'Guardando…' : 'Guardar en agenda'}
          </button>
        </form>
      ) : null}
    </div>
  );
}
