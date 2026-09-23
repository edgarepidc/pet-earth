'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import {
  CFDI_USO_LABELS,
  CFDI_USOS,
  formatMexicoDateTime,
  speciesLabel,
  whatsappHref,
  type CfdiUso,
  type ClinicListOption,
} from '@petearth/shared';

import { ClientFiscalForm } from '@/components/ClientFiscalForm';
import { PageHeading, SectionMark, speciesMark, type SectionMarkName } from '@/components/SectionTitle';

type Patient = {
  id: string;
  name: string;
  species: string;
  breed: string | null;
  alerts: string | null;
  is_active: boolean;
  microchip?: string | null;
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

function petMeta(pet: Patient, speciesOptions: ClinicListOption[]): string {
  return [
    speciesLabel(pet.species, speciesOptions),
    pet.breed,
    pet.is_active ? null : 'Baja',
  ]
    .filter(Boolean)
    .join(' · ');
}

function UpcomingLine({ row }: { row?: UpcomingPatientAppointment }) {
  if (!row) return null;
  return (
    <p className="mt-1 truncate text-xs font-medium text-pe-clay-700">
      Próxima {formatMexicoDateTime(row.starts_at)}
      {row.reason?.trim() ? ` · ${row.reason}` : ''}
    </p>
  );
}

function AlertPill({ alerts }: { alerts: string | null }) {
  if (!alerts) return null;
  return <span className="pe-pill mt-1 inline-block max-w-full truncate bg-amber-100 text-amber-900">{alerts}</span>;
}

function directoryHref(tutors: boolean, table: boolean) {
  const params = new URLSearchParams();
  if (tutors) params.set('vista', 'tutores');
  if (table) params.set('lista', 'tabla');
  const query = params.toString();
  return query ? `/pacientes?${query}` : '/pacientes';
}

function tabClass(active: boolean) {
  return `whitespace-nowrap px-3 py-1.5 text-sm ${active ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`;
}

export function PatientsDirectory({
  clients,
  title = 'Pacientes',
  kicker = 'Clínico',
  description = 'Una ficha por mascota. El tutor va en el subtítulo.',
  showFiscal = false,
  mark = 'pacientes',
  table = false,
  speciesOptions,
  upcoming = {},
  clinicName,
}: {
  clients: Client[];
  title?: string;
  kicker?: string;
  description?: string;
  showFiscal?: boolean;
  mark?: SectionMarkName;
  table?: boolean;
  speciesOptions: ClinicListOption[];
  upcoming?: Record<string, UpcomingPatientAppointment>;
  clinicName?: string;
}) {
  const router = useRouter();
  const byPet = mark === 'pacientes';
  const [query, setQuery] = useState('');
  const [species, setSpecies] = useState('');
  const [alta, setAlta] = useState<null | 'tutor' | 'pet'>(null);
  const [error, setError] = useState<string | null>(null);
  const [tutorName, setTutorName] = useState('');
  const [tutorPhone, setTutorPhone] = useState('');
  const [tutorEmail, setTutorEmail] = useState('');
  const [tutorRfc, setTutorRfc] = useState('');
  const [tutorTaxZip, setTutorTaxZip] = useState('');
  const [tutorFiscalName, setTutorFiscalName] = useState('');
  const [tutorUso, setTutorUso] = useState<CfdiUso>('G03');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(speciesOptions[0]?.slug ?? 'dog');
  const [petAlerts, setPetAlerts] = useState('');
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

  const pets = useMemo(
    () =>
      filtered
        .flatMap((client) => (client.patients ?? []).map((pet) => ({ pet, client })))
        .sort((a, b) => a.pet.name.localeCompare(b.pet.name, 'es')),
    [filtered],
  );

  function toggleAlta(next: 'tutor' | 'pet') {
    setAlta((current) => (current === next ? null : next));
    setError(null);
  }

  async function createTutor(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const hasFiscal = Boolean(tutorRfc.trim() || tutorTaxZip.trim() || tutorFiscalName.trim());
    const response = await fetch('/api/clients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fullName: tutorName,
        phone: tutorPhone,
        email: tutorEmail,
        rfc: hasFiscal ? tutorRfc : undefined,
        taxZip: hasFiscal ? tutorTaxZip : undefined,
        fiscalName: hasFiscal ? tutorFiscalName : undefined,
        usoCfdi: hasFiscal ? tutorUso : undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo crear el tutor');
      return;
    }
    setTutorName('');
    setTutorPhone('');
    setTutorEmail('');
    setTutorRfc('');
    setTutorTaxZip('');
    setTutorFiscalName('');
    setTutorUso('G03');
    setAlta(null);
    router.refresh();
  }

  async function createPet(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/patients', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId: tutorId, name: petName, species: petSpecies, alerts: petAlerts }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo crear la mascota');
      return;
    }
    setPetName('');
    setPetAlerts('');
    setAlta(null);
    router.refresh();
  }

  const empty =
    (byPet ? pets.length === 0 : filtered.length === 0) ? (
      <p className="pe-card p-6 text-sm text-pe-muted">
        {clients.length === 0
          ? 'Aún no hay tutores. Da de alta el primero para colgar las mascotas.'
          : 'Nadie coincide con esa búsqueda.'}
      </p>
    ) : null;

  return (
    <section className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        <PageHeading mark={mark} kicker={kicker} title={title} description={description} />
        <div className="flex shrink-0 flex-col items-end gap-2">
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <Link href={directoryHref(false, table)} className={tabClass(byPet)}>
              Pacientes
            </Link>
            <Link href={directoryHref(true, table)} className={tabClass(!byPet)}>
              Tutores
            </Link>
          </div>
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <button
              type="button"
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${alta === 'tutor' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
              onClick={() => toggleAlta('tutor')}
            >
              Nuevo tutor
            </button>
            <button
              type="button"
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${alta === 'pet' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'}`}
              onClick={() => toggleAlta('pet')}
              disabled={clients.length === 0}
            >
              Nueva mascota
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <input
            className="pe-input max-w-md"
            placeholder="Buscar tutor, mascota o chip"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
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
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <Link href={directoryHref(!byPet, false)} className={tabClass(!table)}>
            Tarjetas
          </Link>
          <Link href={directoryHref(!byPet, true)} className={tabClass(table)}>
            Tabla
          </Link>
        </div>
      </div>

      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}

      {alta === 'tutor' ? (
        <form onSubmit={createTutor} className="pe-card space-y-3 p-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <label className="block text-sm font-medium">
              Nombre
              <input
                className="pe-input mt-1"
                autoComplete="name"
                required
                value={tutorName}
                onChange={(event) => setTutorName(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Teléfono
              <input
                className="pe-input mt-1"
                type="tel"
                autoComplete="tel"
                value={tutorPhone}
                onChange={(event) => setTutorPhone(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Correo
              <input
                className="pe-input mt-1"
                type="email"
                autoComplete="email"
                value={tutorEmail}
                onChange={(event) => setTutorEmail(event.target.value)}
              />
            </label>
          </div>
          <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">Facturación (opcional)</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <label className="block text-sm font-medium">
              RFC
              <input className="pe-input mt-1" value={tutorRfc} onChange={(event) => setTutorRfc(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              C.P. fiscal
              <input className="pe-input mt-1" value={tutorTaxZip} onChange={(event) => setTutorTaxZip(event.target.value)} />
            </label>
            <label className="block text-sm font-medium">
              Razón social
              <input
                className="pe-input mt-1"
                value={tutorFiscalName}
                onChange={(event) => setTutorFiscalName(event.target.value)}
              />
            </label>
            <label className="block text-sm font-medium">
              Uso CFDI
              <select className="pe-input mt-1" value={tutorUso} onChange={(event) => setTutorUso(event.target.value as CfdiUso)}>
                {CFDI_USOS.map((item) => (
                  <option key={item} value={item}>
                    {CFDI_USO_LABELS[item]}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
            Guardar tutor
          </button>
        </form>
      ) : null}

      {alta === 'pet' ? (
        <form onSubmit={createPet} className="pe-card grid gap-3 p-4 sm:grid-cols-4 sm:items-end">
          <label className="block text-sm font-medium">
            Tutor
            <select className="pe-input mt-1" value={tutorId} onChange={(event) => setSelectedClient(event.target.value)}>
              {clients.map((client) => (
                <option key={client.id} value={client.id}>
                  {client.full_name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium sm:col-span-2">
            Nombre de la mascota
            <input className="pe-input mt-1" required value={petName} onChange={(event) => setPetName(event.target.value)} />
          </label>
          <label className="block text-sm font-medium">
            Especie
            <select className="pe-input mt-1" value={petSpecies} onChange={(event) => setPetSpecies(event.target.value)}>
              {speciesOptions.map((item) => (
                <option key={item.slug} value={item.slug}>
                  {item.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-medium sm:col-span-4">
            Alertas de manejo
            <input
              className="pe-input mt-1"
              placeholder="Muerde si lo sujetan del lomo, sale si se abre la jaula…"
              value={petAlerts}
              onChange={(event) => setPetAlerts(event.target.value)}
            />
          </label>
          <div className="sm:col-span-4">
            <button type="submit" className="pe-btn-primary px-4 py-2 text-sm" disabled={!tutorId}>
              Guardar
            </button>
          </div>
        </form>
      ) : null}

      {table ? (
        byPet ? (
          <div className="pe-card overflow-x-auto px-1 py-2">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                  <th className="px-3 py-2.5">Mascota</th>
                  <th className="px-3 py-2.5">Tutor</th>
                  <th className="px-3 py-2.5">Ficha</th>
                  <th className="px-3 py-2.5">Próxima</th>
                  <th className="px-3 py-2.5">Alertas</th>
                </tr>
              </thead>
              <tbody>
                {pets.length === 0 ? (
                  <tr className="border-b border-pe-line">
                    <td className="px-3 py-6 text-pe-muted" colSpan={5}>
                      {clients.length === 0
                        ? 'Aún no hay tutores. Da de alta el primero para colgar las mascotas.'
                        : 'Nadie coincide con esa búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  pets.map(({ pet, client }) => {
                    const next = upcoming[pet.id];
                    return (
                    <tr
                      key={pet.id}
                      className={`cursor-pointer border-b border-pe-line last:border-0 hover:bg-white ${
                        pet.is_active
                          ? 'bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)]'
                          : 'bg-pe-wash/40 text-pe-muted'
                      }`}
                      onClick={() => router.push(`/pacientes/${pet.id}`)}
                    >
                      <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2.5">
                        <span className="flex items-center gap-2">
                          <SectionMark name={speciesMark(pet.species)} size="sm" square />
                          <Link href={`/pacientes/${pet.id}`} className="truncate font-medium text-pe-ink">
                            {pet.name}
                          </Link>
                        </span>
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 text-pe-muted">{client.full_name}</td>
                      <td className="px-3 py-2.5 text-pe-muted">{petMeta(pet, speciesOptions)}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 text-pe-clay-700">
                        {next
                          ? `${formatMexicoDateTime(next.starts_at)}${next.reason?.trim() ? ` · ${next.reason}` : ''}`
                          : '—'}
                      </td>
                      <td className="max-w-[14rem] truncate px-3 py-2.5">
                        {pet.alerts ? <span className="font-medium text-amber-800">{pet.alerts}</span> : '—'}
                      </td>
                    </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="pe-card overflow-x-auto px-1 py-2">
            <table className="w-full min-w-[48rem] text-left text-sm">
              <thead>
                <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                  <th className="px-3 py-2.5">Tutor</th>
                  <th className="px-3 py-2.5">Teléfono</th>
                  <th className="px-3 py-2.5">Correo</th>
                  <th className="px-3 py-2.5">Mascotas</th>
                  {showFiscal ? <th className="px-3 py-2.5">RFC</th> : null}
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr className="border-b border-pe-line">
                    <td className="px-3 py-6 text-pe-muted" colSpan={showFiscal ? 5 : 4}>
                      {clients.length === 0
                        ? 'Aún no hay tutores. Da de alta el primero para colgar las mascotas.'
                        : 'Nadie coincide con esa búsqueda.'}
                    </td>
                  </tr>
                ) : (
                  filtered.map((client) => {
                    const wa = whatsappHref(
                      client.phone,
                      `Hola ${client.full_name}, te escribe ${clinicName ?? 'la clínica'}.`,
                    );
                    return (
                      <tr
                        key={client.id}
                        className="border-b border-pe-line bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)] last:border-0 hover:bg-white"
                      >
                        <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2.5 font-medium text-pe-ink">
                          {client.full_name}
                        </td>
                        <td className="px-3 py-2.5 text-pe-muted">
                          {client.phone ?? '—'}
                          {wa ? (
                            <>
                              {' · '}
                              <a href={wa} target="_blank" rel="noreferrer" className="pe-link">
                                WhatsApp
                              </a>
                            </>
                          ) : null}
                        </td>
                        <td className="max-w-[14rem] truncate px-3 py-2.5 text-pe-muted">{client.email ?? '—'}</td>
                        <td className="px-3 py-2.5">
                          {(client.patients ?? []).length === 0 ? (
                            <span className="text-pe-muted">Sin mascotas aún.</span>
                          ) : (
                            <span className="flex flex-wrap gap-x-2 gap-y-1">
                              {(client.patients ?? []).map((pet) => (
                                <Link
                                  key={pet.id}
                                  href={`/pacientes/${pet.id}`}
                                  className="pe-link inline-flex items-center gap-1"
                                >
                                  <SectionMark name={speciesMark(pet.species)} size="sm" square />
                                  {pet.name}
                                </Link>
                              ))}
                            </span>
                          )}
                        </td>
                        {showFiscal ? (
                          <td className="px-3 py-2.5" onClick={(event) => event.stopPropagation()}>
                            <p className="font-mono text-xs text-pe-muted">{client.rfc?.trim() || '—'}</p>
                            <ClientFiscalForm
                              clientId={client.id}
                              rfc={client.rfc ?? null}
                              taxZip={client.tax_zip ?? null}
                              usoCfdi={client.uso_cfdi ?? null}
                              fiscalName={client.fiscal_name ?? null}
                            />
                          </td>
                        ) : null}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )
      ) : byPet ? (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {pets.map(({ pet, client }) => (
            <article key={pet.id} className="pe-card p-4 hover:bg-pe-wash/60">
              <Link href={`/pacientes/${pet.id}`} className="flex items-start gap-3">
                <SectionMark name={speciesMark(pet.species)} square />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-semibold tracking-tight">{pet.name}</span>
                  <span className="mt-0.5 block truncate text-sm text-pe-muted">
                    {client.full_name} · {petMeta(pet, speciesOptions)}
                  </span>
                  <UpcomingLine row={upcoming[pet.id]} />
                  <AlertPill alerts={pet.alerts} />
                </span>
              </Link>
            </article>
          ))}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {filtered.map((client) => {
            const wa = whatsappHref(
              client.phone,
              `Hola ${client.full_name}, te escribe ${clinicName ?? 'la clínica'}.`,
            );
            return (
              <article key={client.id} className="pe-card p-4">
                <h2 className="truncate text-base font-semibold tracking-tight">{client.full_name}</h2>
                <p className="mt-0.5 truncate text-sm text-pe-muted">
                  {client.phone ?? 'Sin teléfono'}
                  {client.email ? ` · ${client.email}` : ''}
                  {wa ? (
                    <>
                      {' · '}
                      <a href={wa} target="_blank" rel="noreferrer" className="pe-link" onClick={(event) => event.stopPropagation()}>
                        WhatsApp
                      </a>
                    </>
                  ) : null}
                </p>
                <ul className="mt-3 divide-y divide-pe-line">
                  {(client.patients ?? []).map((pet) => (
                    <li key={pet.id}>
                      <Link href={`/pacientes/${pet.id}`} className="flex items-start gap-3 py-2.5 hover:bg-pe-wash">
                        <SectionMark name={speciesMark(pet.species)} size="sm" square />
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium">{pet.name}</span>
                          <span className="block truncate text-sm text-pe-muted">{petMeta(pet, speciesOptions)}</span>
                          <UpcomingLine row={upcoming[pet.id]} />
                          <AlertPill alerts={pet.alerts} />
                        </span>
                      </Link>
                    </li>
                  ))}
                  {(client.patients ?? []).length === 0 ? (
                    <li className="py-2.5 text-sm text-pe-muted">Sin mascotas aún.</li>
                  ) : null}
                </ul>
                {showFiscal ? (
                  <ClientFiscalForm
                    clientId={client.id}
                    rfc={client.rfc ?? null}
                    taxZip={client.tax_zip ?? null}
                    usoCfdi={client.uso_cfdi ?? null}
                    fiscalName={client.fiscal_name ?? null}
                  />
                ) : null}
              </article>
            );
          })}
        </div>
      )}
      {table ? null : empty}
    </section>
  );
}
