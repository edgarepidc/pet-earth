'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { todayMexicoYmd } from '@petearth/shared';

export function NewAppointmentForm({ patientId, branchName }: { patientId: string; branchName?: string }) {
  const router = useRouter();
  const [date, setDate] = useState(todayMexicoYmd());
  const [time, setTime] = useState('10:00');
  const [reason, setReason] = useState('');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId, date, time, reason }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agendar');
      return;
    }
    setReason('');
    router.refresh();
  }

  return (
    <form onSubmit={submit} className="pe-glass-card space-y-3 p-4">
      <h2 className="font-semibold">Agendar cita</h2>
      {branchName ? <p className="text-sm text-pe-muted">Se guarda en {branchName}.</p> : null}
      <input type="date" className="pe-input" value={date} onChange={(e) => setDate(e.target.value)} />
      <input type="time" className="pe-input" value={time} onChange={(e) => setTime(e.target.value)} />
      <input className="pe-input" placeholder="Motivo" value={reason} onChange={(e) => setReason(e.target.value)} />
      {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
        Guardar en agenda
      </button>
    </form>
  );
}
