'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { ClientFiscalForm } from '@/components/ClientFiscalForm';
import { PageHeading, SectionMark, petAvatarSrc, type SectionMarkName } from '@/components/SectionTitle';
import { formatMexicoDateTime, speciesLabel, type ClinicListOption } from '@petearth/shared';

type Patient = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  alerts: string | null;
  is_active: boolean;
  microchip?: string | null;
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

export type UpcomingPatientAppointment = {
  id: string;
  starts_at: string;
  reason: string | null;
};

export function PatientsDirectory({
  clients,
  title = 'Pacientes',
  kicker = 'Clínico',
  description = 'Tutor y mascota van separados. Busca por cualquiera de los dos, o por chip.',
  showFiscal = false,
  mark = 'pacientes',
  speciesOptions,
  upcoming = {},
}: {
  clients: Client[];
  title?: string;
  kicker?: string;
  description?: string;
  showFiscal?: boolean;
  mark?: SectionMarkName;
  speciesOptions: ClinicListOption[];
  upcoming?: Record<string, UpcomingPatientAppointment>;
}) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(speciesOptions[0]?.slug ?? 'dog');
  const [selectedClient, setSelectedClient] = useState(clients[0]?.id ?? '');
  const tutorId = clients.some((client) => client.id === selectedClient) ? selectedClient : (clients[0]?.id ?? '');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const digits = q.replace(/\D/g, '');
    const rows: Client[] = [];
    for (const client of clients) {
      const pets = (client.patients ?? []).filter((pet) => (species ? pet.species === species : true));
      let nextPets = pets;
      if (q) {
        const inTutor = `${client.full_name} ${client.phone ?? ''} ${client.email ?? ''}`.toLowerCase().includes(q);
        const matchingPets = pets.filter((pet) => {
          const hay = `${pet.name} ${pet.breed ?? ''} ${pet.microchip ?? ''}`.toLowerCase();
          if (hay.includes(q)) return true;
          return Boolean(digits.length >= 4 && pet.microchip?.includes(digits));
        });
        if (!inTutor && matchingPets.length === 0) continue;
        nextPets = inTutor ? pets : matchingPets;
      } else if (species && pets.length === 0) {
        continue;
      }
      rows.push({ ...client, patients: nextPets });
    }
    return rows;
  }, [clients, query, species]);

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
      body: JSON.stringify({ clientId: tutorId, name: petName, species: petSpecies }),
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
      <div className="flex flex-wrap items-end gap-3">
        <input
          className="pe-input max-w-md"
          placeholder="Buscar tutor, mascota o chip"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${species === '' ? 'pe-chip-active' : ''}`}
            onClick={() => setSpecies('')}
          >
            Todas
          </button>
          {speciesOptions.map((item) => (
            <button
              key={item.slug}
              type="button"
              className={`pe-btn-ghost px-3 py-1.5 text-sm ${species === item.slug ? 'pe-chip-active' : ''}`}
              onClick={() => setSpecies(item.slug)}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
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
          <select className="pe-input" value={tutorId} onChange={(e) => setSelectedClient(e.target.value)}>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.full_name}
              </option>
            ))}
          </select>
          <input className="pe-input" required placeholder="Nombre de la mascota" value={petName} onChange={(e) => setPetName(e.target.value)} />
          <select className="pe-input" value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}>
            {speciesOptions.map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={!tutorId}>
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
                        {speciesLabel(pet.species, speciesOptions)}
                        {pet.breed ? ` · ${pet.breed}` : ''}
                        {pet.microchip ? ` · ${pet.microchip}` : ''}
                        {!pet.is_active ? ' · Baja' : ''}
                      </span>
                      {upcoming[pet.id] ? (
                        <span className="mt-1 block truncate text-xs font-medium text-pe-clay-700">
                          Próxima {formatMexicoDateTime(upcoming[pet.id].starts_at)}
                          {upcoming[pet.id].reason?.trim() ? ` · ${upcoming[pet.id].reason}` : ''}
                        </span>
                      ) : null}
                      {pet.alerts ? (
                        <span className="pe-pill mt-1 inline-block max-w-full truncate bg-amber-100 text-amber-900">
                          {pet.alerts}
                        </span>
                      ) : null}
                    </span>
                  </Link>
                </li>
              ))}
              {(client.patients ?? []).length === 0 ? (
                <li className="px-1 py-1.5 text-xs text-pe-muted">Sin mascotas aún.</li>
              ) : null}
            </ul>
          </article>
        ))}
      </div>
      {filtered.length === 0 ? (
        <p className="pe-card p-6 text-sm text-pe-muted">
          {clients.length === 0
            ? 'Aún no hay tutores. Da de alta el primero para colgar las mascotas.'
            : 'Nadie coincide con esa búsqueda.'}
        </p>
      ) : null}
    </section>
  );
}
