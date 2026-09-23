'use client';

import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_SPECIES_OPTIONS, formatMexicoDate, todayMexicoYmd, type ClinicListOption } from '@petearth/shared';

import { startAppointmentVisit, type ClinicVet } from '@/components/AppointmentPeek';
import { clinicSlotClocks } from '@/lib/day-slots';

type PatientOption = {
  id: string;
  name: string;
  species: string;
  is_active?: boolean;
};

type ClientOption = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  patients: PatientOption[] | null;
};

export type BookSlotPreset = {
  clientId?: string;
  patientId?: string;
  patientName?: string;
  clientName?: string;
  reason?: string;
  reminderId?: string;
};

export function BookSlotDialog({
  date,
  time,
  vets = [],
  openMin,
  closeMin,
  preset,
  startAfterCreate = false,
  onClose,
  onCreated,
}: {
  date: string;
  time: string;
  vets?: ClinicVet[];
  openMin?: number;
  closeMin?: number;
  preset?: BookSlotPreset;
  startAfterCreate?: boolean;
  onClose: () => void;
  onCreated: (result?: { id: string; visitId?: string }) => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [species, setSpecies] = useState<ClinicListOption[]>(DEFAULT_SPECIES_OPTIONS);
  const [query, setQuery] = useState(preset?.clientName ?? preset?.patientName ?? '');
  const [clientId, setClientId] = useState<string | null>(preset?.clientId ?? null);
  const [patientId, setPatientId] = useState<string | null>(preset?.patientId ?? null);
  const [newPet, setNewPet] = useState(false);
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(DEFAULT_SPECIES_OPTIONS[0]?.slug ?? 'dog');
  const [petAlerts, setPetAlerts] = useState('');
  const [reason, setReason] = useState(preset?.reason ?? '');
  const [vetId, setVetId] = useState(vets[0]?.id ?? '');
  const [slotDate, setSlotDate] = useState(date);
  const [slotTime, setSlotTime] = useState(time);
  const hours = useMemo(() => clinicSlotClocks(openMin, closeMin), [openMin, closeMin]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const lockedPatient = Boolean(preset?.patientId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    setSlotTime(hours.includes(time) ? time : hours[0] ?? time);
  }, [time, hours]);

  useEffect(() => {
    void fetch('/api/clinic/lists?key=species')
      .then((response) => response.json() as Promise<{ items?: (ClinicListOption & { is_active?: boolean })[] }>)
      .then((listPayload) => {
        const items = (listPayload.items ?? []).filter((item) => item.is_active !== false);
        if (items.length) {
          setSpecies(items);
          setPetSpecies((current) => (items.some((item) => item.slug === current) ? current : items[0].slug));
        }
      });
  }, []);

  useEffect(() => {
    if (preset?.clientId) {
      void fetch(`/api/clients?id=${encodeURIComponent(preset.clientId)}`)
        .then((response) => response.json() as Promise<{ clients?: ClientOption[] }>)
        .then((payload) => {
          setClients(payload.clients ?? []);
          const owner = payload.clients?.[0];
          if (owner) {
            setClientId(owner.id);
            const pet = (owner.patients ?? []).find((item) => item.id === preset.patientId);
            setPatientId(pet?.id ?? preset.patientId ?? null);
            setNewPet(false);
          }
        });
    }
  }, [preset?.clientId, preset?.patientId]);

  useEffect(() => {
    if (lockedPatient) return;
    const q = query.trim();
    if (q.length < 2) {
      setClients([]);
      return;
    }
    const handle = window.setTimeout(() => {
      void fetch(`/api/clients?q=${encodeURIComponent(q)}`)
        .then((response) => response.json() as Promise<{ clients?: ClientOption[] }>)
        .then((payload) => setClients(payload.clients ?? []));
    }, 250);
    return () => window.clearTimeout(handle);
  }, [query, lockedPatient]);

  const selectedClient = clients.find((client) => client.id === clientId) ?? null;
  const pets = (selectedClient?.patients ?? []).filter((pet) => pet.is_active !== false);

  async function createClient(): Promise<string> {
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: tutorName, phone: tutorPhone, email: tutorEmail }),
    });
    const payload = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !payload.id) throw new Error(payload.error ?? 'No se pudo crear el tutor');
    return payload.id;
  }

  async function createPatient(ownerId: string): Promise<string> {
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: ownerId, name: petName, species: petSpecies, alerts: petAlerts }),
    });
    const payload = (await response.json()) as { id?: string; error?: string };
    if (!response.ok || !payload.id) throw new Error(payload.error ?? 'No se pudo crear la mascota');
    return payload.id;
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let nextPatientId = patientId;
      if (mode === 'new') {
        if (!tutorName.trim() || !petName.trim()) throw new Error('Tutor y mascota son obligatorios.');
        const ownerId = await createClient();
        nextPatientId = await createPatient(ownerId);
      } else if (newPet || !nextPatientId) {
        if (!clientId) throw new Error('Elige un tutor.');
        if (!petName.trim()) throw new Error('El nombre de la mascota es obligatorio.');
        nextPatientId = await createPatient(clientId);
      }
      if (!nextPatientId) throw new Error('Elige una mascota.');
      const response = await fetch('/api/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          patientId: nextPatientId,
          date: slotDate,
          time: slotTime,
          reason,
          vetId: vetId || null,
          reminderId: preset?.reminderId,
        }),
      });
      const payload = (await response.json()) as { error?: string; id?: string };
      if (!response.ok || !payload.id) throw new Error(payload.error ?? 'No se pudo agendar');
      let visitId: string | undefined;
      if (startAfterCreate && slotDate === todayMexicoYmd()) {
        const started = await startAppointmentVisit(payload.id);
        if (!started.ok) throw new Error(started.error);
        visitId = started.visitId;
      }
      onCreated({ id: payload.id, visitId });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo agendar');
      setBusy(false);
      return;
    }
    setBusy(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <button type="button" className="absolute inset-0 bg-black/40" aria-label="Cerrar" onClick={onClose} />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby="book-slot-title"
        className="pe-card relative z-10 w-full max-w-lg p-5"
        onSubmit={(event) => void submit(event)}
      >
        <p className="pe-kicker">{startAfterCreate ? 'Llegó sin cita' : 'Nueva cita'}</p>
        <h2 id="book-slot-title" className="mt-1 text-xl font-semibold tracking-tight">
          {formatMexicoDate(slotDate, { weekday: 'long', day: 'numeric', month: 'long' })}
        </h2>
        <p className="mt-1 text-sm text-pe-muted">
          {startAfterCreate
            ? 'Toma el hueco de ahora y abre la consulta.'
            : 'Consulta de una hora. Si otro veterinario ya tiene este horario, se agenda en paralelo.'}
        </p>

        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className="block text-sm font-medium">
            Día
            <input className="pe-input mt-1" type="date" value={slotDate} onChange={(event) => setSlotDate(event.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Hora
            <select className="pe-input mt-1" value={slotTime} onChange={(event) => setSlotTime(event.target.value)}>
              {hours.map((hour) => (
                <option key={hour} value={hour}>
                  {hour}
                </option>
              ))}
            </select>
          </label>
        </div>

        {lockedPatient ? (
          <p className="mt-4 text-sm">
            <span className="font-medium">{preset?.patientName ?? 'Paciente'}</span>
            <span className="text-pe-muted"> · {preset?.clientName ?? selectedClient?.full_name ?? 'Tutor'}</span>
          </p>
        ) : (
          <>
            <div className="mt-4 flex gap-2">
              <button
                type="button"
                className={`pe-btn-ghost px-3 py-1.5 text-sm ${mode === 'existing' ? 'pe-chip-active' : ''}`}
                onClick={() => setMode('existing')}
              >
                Tutor existente
              </button>
              <button
                type="button"
                className={`pe-btn-ghost px-3 py-1.5 text-sm ${mode === 'new' ? 'pe-chip-active' : ''}`}
                onClick={() => setMode('new')}
              >
                Tutor nuevo
              </button>
            </div>

            {mode === 'existing' ? (
              <div className="mt-4 space-y-3">
                <input
                  className="pe-input"
                  placeholder="Buscar tutor, teléfono o mascota"
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                />
                <ul className="max-h-40 overflow-y-auto rounded-md border border-pe-line">
                  {query.trim().length < 2 ? (
                    <li className="px-3 py-2 text-sm text-pe-muted">Escribe al menos 2 letras.</li>
                  ) : clients.length === 0 ? (
                    <li className="px-3 py-2 text-sm text-pe-muted">Sin coincidencias. Cambia a tutor nuevo.</li>
                  ) : (
                    clients.map((client) => (
                      <li key={client.id}>
                        <button
                          type="button"
                          className={`block w-full px-3 py-2 text-left text-sm ${
                            clientId === client.id ? 'bg-pe-wash font-medium' : 'hover:bg-pe-wash'
                          }`}
                          onClick={() => {
                            setClientId(client.id);
                            const first = (client.patients ?? []).find((pet) => pet.is_active !== false);
                            setNewPet(!first);
                            setPatientId(first?.id ?? null);
                          }}
                        >
                          {client.full_name}
                          <span className="ml-2 text-pe-muted">
                            {client.phone ?? (client.patients ?? []).map((pet) => pet.name).join(', ')}
                          </span>
                        </button>
                      </li>
                    ))
                  )}
                </ul>
                {selectedClient ? (
                  <div className="space-y-2">
                    <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Mascota</p>
                    {pets.map((pet) => (
                      <label key={pet.id} className="flex items-center gap-2 text-sm">
                        <input
                          type="radio"
                          name="slot-pet"
                          checked={!newPet && patientId === pet.id}
                          onChange={() => {
                            setNewPet(false);
                            setPatientId(pet.id);
                          }}
                        />
                        {pet.name}
                      </label>
                    ))}
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="radio"
                        name="slot-pet"
                        checked={newPet}
                        onChange={() => {
                          setNewPet(true);
                          setPatientId(null);
                        }}
                      />
                      Nueva mascota
                    </label>
                    {newPet ? (
                      <div className="grid gap-2 sm:grid-cols-2">
                        <input
                          className="pe-input"
                          required
                          placeholder="Nombre de la mascota"
                          value={petName}
                          onChange={(event) => setPetName(event.target.value)}
                        />
                        <select className="pe-input" value={petSpecies} onChange={(event) => setPetSpecies(event.target.value)}>
                          {species.map((item) => (
                            <option key={item.slug} value={item.slug}>
                              {item.label}
                            </option>
                          ))}
                        </select>
                        <input
                          className="pe-input sm:col-span-2"
                          placeholder="Alertas de manejo: muerde, sale si se abre la jaula…"
                          value={petAlerts}
                          onChange={(event) => setPetAlerts(event.target.value)}
                        />
                      </div>
                    ) : null}
                  </div>
                ) : null}
              </div>
            ) : (
              <div className="mt-4 grid gap-3">
                <input
                  className="pe-input"
                  required
                  placeholder="Nombre del tutor"
                  value={tutorName}
                  onChange={(event) => setTutorName(event.target.value)}
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    className="pe-input"
                    placeholder="Teléfono"
                    value={tutorPhone}
                    onChange={(event) => setTutorPhone(event.target.value)}
                  />
                  <input
                    className="pe-input"
                    type="email"
                    placeholder="Correo"
                    value={tutorEmail}
                    onChange={(event) => setTutorEmail(event.target.value)}
                  />
                </div>
                <input
                  className="pe-input"
                  required
                  placeholder="Nombre de la mascota"
                  value={petName}
                  onChange={(event) => setPetName(event.target.value)}
                />
                <select className="pe-input" value={petSpecies} onChange={(event) => setPetSpecies(event.target.value)}>
                  {species.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </select>
                <input
                  className="pe-input"
                  placeholder="Alertas de manejo: muerde, sale si se abre la jaula…"
                  value={petAlerts}
                  onChange={(event) => setPetAlerts(event.target.value)}
                />
              </div>
            )}
          </>
        )}

        <label className="mt-4 block text-sm font-medium">
          Motivo
          <input
            className="pe-input mt-1"
            placeholder="Vacuna, control, cojera…"
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </label>

        <label className="mt-4 block text-sm font-medium">
          Veterinario
          <select className="pe-input mt-1" value={vetId} onChange={(event) => setVetId(event.target.value)}>
            <option value="">Sin asignar</option>
            {vets.map((vet) => (
              <option key={vet.id} value={vet.id}>
                {vet.full_name}
              </option>
            ))}
          </select>
        </label>

        {error ? <p className="pe-callout-amber mt-3 p-3 text-sm">{error}</p> : null}

        <div className="mt-5 flex flex-wrap justify-end gap-2">
          <button type="button" className="pe-btn-ghost px-4 py-2 text-sm" onClick={onClose}>
            Cancelar
          </button>
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={busy}>
            {busy ? 'Guardando…' : startAfterCreate ? 'Abrir consulta' : 'Agendar consulta'}
          </button>
        </div>
      </form>
    </div>
  );
}
