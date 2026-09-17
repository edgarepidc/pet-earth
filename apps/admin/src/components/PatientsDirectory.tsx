'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ClientFiscalForm } from '@/components/ClientFiscalForm';
import { PageHeading, SectionMark, petAvatarSrc, type SectionMarkName } from '@/components/SectionTitle';
import { SPECIES_LABELS, type Species } from '@petearth/shared';

type Patient = {
  id: string;
  name: string;
  species: Species;
  breed: string | null;
  alerts: string | null;
  is_active: boolean;
  photo_url?: string | null;
};

type Client = {
  id: string;
  full_name: string;
  phone: string | null;
  email: string | null;
  rfc?: string | null;
  tax_zip?: string | null;
  uso_cfdi?: string | null;
  fiscal_name?: string | null;
  patients: Patient[] | null;
};

export function PatientsDirectory({
  clients,
  title = 'Pacientes',
  kicker = 'Clínico',
  description = 'Tutor y mascota van separados. Busca por cualquiera de los dos.',
  showFiscal = false,
  mark = 'pacientes',
}: {
  clients: Client[];
  title?: string;
  kicker?: string;
  description?: string;
  showFiscal?: boolean;
  mark?: SectionMarkName;
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
      <PageHeading mark={mark} kicker={kicker} title={title} description={description} />
      <input
        className="pe-input max-w-md"
        placeholder="Buscar tutor o mascota"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="grid gap-4 lg:grid-cols-2">
        <form onSubmit={createTutor} className="pe-glass-card space-y-3 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <SectionMark name="tutores" size="sm" />
            Nuevo tutor
          </h2>
          <input className="pe-input" required placeholder="Nombre" value={tutorName} onChange={(e) => setTutorName(e.target.value)} />
          <input className="pe-input" placeholder="Teléfono" value={tutorPhone} onChange={(e) => setTutorPhone(e.target.value)} />
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
            Guardar tutor
          </button>
        </form>
        <form onSubmit={createPet} className="pe-glass-card space-y-3 p-4">
          <h2 className="flex items-center gap-2 font-semibold">
            <SectionMark name="pacientes" size="sm" />
            Nueva mascota
          </h2>
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
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.map((client) => (
          <article key={client.id} className="pe-glass-card p-3">
            <h2 className="truncate text-sm font-semibold text-pe-ink">{client.full_name}</h2>
            <p className="truncate text-xs text-pe-muted">
              {client.phone ?? 'Sin teléfono'}
              {client.email ? ` · ${client.email}` : ''}
            </p>
            {showFiscal ? (
              <ClientFiscalForm
                clientId={client.id}
                rfc={client.rfc ?? null}
                taxZip={client.tax_zip ?? null}
                usoCfdi={client.uso_cfdi ?? null}
                fiscalName={client.fiscal_name ?? null}
              />
            ) : null}
            <ul className="mt-2 space-y-1">
              {(client.patients ?? []).map((pet) => (
                <li key={pet.id}>
                  <Link
                    href={`/pacientes/${pet.id}`}
                    className="flex items-start gap-2 rounded-lg px-1 py-1.5 hover:bg-pe-wash"
                  >
                    <span className="pe-avatar mt-0.5">
                      <img src={petAvatarSrc(pet.species, pet.photo_url)} alt={pet.name} />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{pet.name}</span>
                      <span className="block truncate text-xs text-pe-muted">
                        {SPECIES_LABELS[pet.species]}
                        {pet.breed ? ` · ${pet.breed}` : ''}
                      </span>
                      {pet.alerts ? (
                        <span className="pe-pill mt-1 inline-block max-w-full truncate bg-amber-100 text-amber-900">
                          {pet.alerts}
                        </span>
                      ) : null}
                    </span>
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
