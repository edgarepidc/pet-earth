'use client';

import { useEffect, useMemo, useState } from 'react';

import { DEFAULT_SPECIES_OPTIONS, formatMexicoDate, type ClinicListOption } from '@petearth/shared';

import type { ClinicVet } from '@/components/AppointmentPeek';

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

export function BookSlotDialog({
  date,
  time,
  vets = [],
  onClose,
  onCreated,
}: {
  date: string;
  time: string;
  vets?: ClinicVet[];
  onClose: () => void;
  onCreated: () => void;
}) {
  const [mode, setMode] = useState<'existing' | 'new'>('existing');
  const [clients, setClients] = useState<ClientOption[]>([]);
  const [species, setSpecies] = useState<ClinicListOption[]>(DEFAULT_SPECIES_OPTIONS);
  const [query, setQuery] = useState('');
  const [clientId, setClientId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState<string | null>(null);
  const [newPet, setNewPet] = useState(false);
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(DEFAULT_SPECIES_OPTIONS[0]?.slug ?? 'dog');
  const [reason, setReason] = useState('');
  const [vetId, setVetId] = useState(vets[0]?.id ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') onClose();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    void Promise.all([
      fetch('/api/clients').then((response) => response.json() as Promise<{ clients?: ClientOption[] }>),
      fetch('/api/clinic/lists?key=species').then(
        (response) => response.json() as Promise<{ items?: (ClinicListOption & { is_active?: boolean })[] }>,
      ),
    ]).then(([clientPayload, listPayload]) => {
      setClients(clientPayload.clients ?? []);
      const items = (listPayload.items ?? []).filter((item) => item.is_active !== false);
      if (items.length) {
        setSpecies(items);
        setPetSpecies((current) => (items.some((item) => item.slug === current) ? current : items[0].slug));
      }
    });
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients.slice(0, 8);
    return clients
      .filter((client) => {
        const hay = `${client.full_name} ${client.phone ?? ''} ${client.email ?? ''}`.toLowerCase();
        const pets = (client.patients ?? []).some((pet) => pet.name.toLowerCase().includes(q));
        return hay.includes(q) || pets;
      })
      .slice(0, 8);
  }, [clients, query]);

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
      body: JSON.stringify({ clientId: ownerId, name: petName, species: petSpecies }),
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
        body: JSON.stringify({ patientId: nextPatientId, date, time, reason, vetId: vetId || null }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(payload.error ?? 'No se pudo agendar');
      onCreated();
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
        <p className="pe-kicker">Nueva cita</p>
        <h2 id="book-slot-title" className="mt-1 text-xl font-semibold tracking-tight">
          {formatMexicoDate(date, { weekday: 'long', day: 'numeric', month: 'long' })} · {time}
        </h2>
        <p className="mt-1 text-sm text-pe-muted">
          Consulta de una hora. Si otro veterinario ya tiene este horario, se agenda en paralelo.
        </p>

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
              {filtered.length === 0 ? (
                <li className="px-3 py-2 text-sm text-pe-muted">Sin coincidencias. Cambia a tutor nuevo.</li>
              ) : (
                filtered.map((client) => (
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
          </div>
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
            {busy ? 'Guardando…' : 'Agendar consulta'}
          </button>
        </div>
      </form>
    </div>
  );
}
