'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { SPECIES_LABELS, type Species } from '@petearth/shared';

type Patient = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  alerts: string | null;
  is_active: boolean;
};

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  patients: Patient[] | null;
};

export function PatientsDirectory({
  clients,
  title = 'Pacientes',
  kicker = 'Clínico',
  description = 'Tutor y mascota van separados. Busca por cualquiera de los dos.',
}: {
  clients: Client[];
  title?: string;
  kicker?: string;
  description?: string;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState<Species>('dog');
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return clients;
    return clients.filter((client) => {
      const inTutor = `${client.full_name} ${client.phone ?? ''} ${client.email ?? ''}`.toLowerCase().includes(q);
      const inPets = (client.patients ?? []).some((pet) => pet.name.toLowerCase().includes(q));
      return inTutor || inPets;
    });
  }, [clients, query]);

  async function createTutor(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: tutorName, phone: tutorPhone }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo crear el tutor');
      return;
    }
    setTutorName('');
    setTutorPhone('');
    router.refresh();
  }

  async function createPet(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: selectedClient, name: petName, species: petSpecies }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo crear la mascota');
      return;
    }
    setPetName('');
    router.refresh();
  }

  return (
    <section className="space-y-5">
      <div>
        <p className="pe-kicker">{kicker}</p>
        <h1 className="font-serif text-2xl font-semibold">{title}</h1>
        <p className="text-sm text-[#6b5e55]">{description}</p>
      </div>
      <input
        className="pe-input max-w-md"
        placeholder="Buscar tutor o mascota"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createTutor} className="pe-glass-card space-y-3 p-4">
          <h2 className="font-semibold">Nuevo tutor</h2>
          <input className="pe-input" required placeholder="Nombre" value={tutorName} onChange={(e) => setTutorName(e.target.value)} />
          <input className="pe-input" placeholder="Teléfono" value={tutorPhone} onChange={(e) => setTutorPhone(e.target.value)} />
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
            Guardar tutor
          </button>
        </form>
        <form onSubmit={createPet} className="pe-glass-card space-y-3 p-4">
          <h2 className="font-semibold">Nueva mascota</h2>
          <select className="pe-input" value={selectedClient} onChange={(e) => setSelectedClient(e.target.value)}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
          <input className="pe-input" required placeholder="Nombre de la mascota" value={petName} onChange={(e) => setPetName(e.target.value)} />
          <select className="pe-input" value={petSpecies} onChange={(e) => setPetSpecies(e.target.value as Species)}>
            <option value="dog">Perro</option>
            <option value="cat">Gato</option>
            <option value="other">Otra</option>
          </select>
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={!selectedClient}>
            Guardar mascota
          </button>
        </form>
      </div>
      <div className="space-y-3">
        {filtered.map((client) => (
          <article key={client.id} className="pe-glass-card p-4">
            <h2 className="font-semibold text-slate-900">{client.full_name}</h2>
            <p className="text-sm text-slate-500">
              {client.phone ?? 'Sin teléfono'} {client.email ? `· ${client.email}` : ''}
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
              {(client.patients ?? []).map((pet) => (
                <li key={pet.id}>
                  <Link href={`/pacientes/${pet.id}`} className="block rounded-xl border border-slate-200 p-3 hover:bg-slate-50">
                    <p className="font-medium">{pet.name}</p>
                    <p className="text-xs text-slate-500">
                      {SPECIES_LABELS[pet.species]} {pet.breed ? `· ${pet.breed}` : ''}
                    </p>
                    {pet.alerts ? <p className="mt-1 text-xs text-amber-800">{pet.alerts}</p> : null}
                  </Link>
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </section>
  );
}
