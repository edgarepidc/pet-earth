'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import {
  branchIsOpenOn,
  clinicSlotClocks,
  clockToMinutes,
  todayMexicoYmd,
} from '@petearth/shared';

export function TutorScheduleForm({
  pets,
  patientId,
  patientName,
  defaultReason = '',
  branchName,
  open = '09:00',
  close = '19:00',
  days = [1, 2, 3, 4, 5, 6],
}: {
  pets?: { id: string; name: string }[];
  patientId?: string;
  patientName?: string;
  defaultReason?: string;
  branchName?: string;
  open?: string;
  close?: string;
  days?: number[];
}) {
  const router = useRouter();
  const hours = useMemo(() => clinicSlotClocks(clockToMinutes(open), clockToMinutes(close)), [open, close]);
  const [selectedPet, setSelectedPet] = useState(patientId ?? pets?.[0]?.id ?? '');
  const [date, setDate] = useState(todayMexicoYmd());
  const [time, setTime] = useState(hours.includes('10:00') ? '10:00' : (hours[0] ?? '10:00'));
  const [reason, setReason] = useState(defaultReason);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const chosen = pets?.find((pet) => pet.id === selectedPet);
  const label = patientName ?? chosen?.name ?? 'tu mascota';
  const openDay = branchIsOpenOn(days, date);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setDone(false);
    if (!selectedPet) {
      setError('Elige una mascota.');
      return;
    }
    if (!openDay) {
      setError('Ese día el consultorio está cerrado.');
      return;
    }
    setLoading(true);
    const response = await fetch('/api/appointments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ patientId: selectedPet, date, time, reason }),
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agendar');
      return;
    }
    setDone(true);
    router.refresh();
  }

  return (
    <form id="agendar" onSubmit={submit} className="space-y-3">
      <p className="text-sm font-medium">Agendar para {label}</p>
      {branchName ? <p className="text-sm text-pe-muted">Se agenda en {branchName}.</p> : null}
      {pets && pets.length > 1 ? (
        <label className="block text-sm">
          Mascota
          <select className="pe-input mt-1" value={selectedPet} onChange={(e) => setSelectedPet(e.target.value)} required>
            {pets.map((pet) => (
              <option key={pet.id} value={pet.id}>
                {pet.name}
              </option>
            ))}
          </select>
        </label>
      ) : null}
      <div className="grid gap-2 sm:grid-cols-2">
        <label className="text-sm">
          Día
          <input type="date" className="pe-input mt-1" value={date} min={todayMexicoYmd()} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className="text-sm">
          Hora
          <select
            className="pe-input mt-1"
            value={time}
            onChange={(e) => setTime(e.target.value)}
            required
            disabled={!openDay}
          >
            {hours.map((hour) => (
              <option key={hour} value={hour}>
                {hour}
              </option>
            ))}
          </select>
        </label>
      </div>
      {!openDay ? <p className="text-sm text-pe-muted">El consultorio no abre ese día.</p> : null}
      <label className="block text-sm">
        Motivo
        <input
          className="pe-input mt-1"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Consulta, vacuna, seguimiento…"
        />
      </label>
      {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      {done ? <p className="text-sm text-pe-muted">Cita agendada. Queda en la agenda del consultorio.</p> : null}
      <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={loading || !openDay}>
        {loading ? 'Agendando…' : 'Confirmar cita'}
      </button>
    </form>
  );
}
