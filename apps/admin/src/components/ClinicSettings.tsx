'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { PageHeading } from '@/components/SectionTitle';
import type { ClinicListRow } from '@/lib/clinicLists';

export function ClinicSettings({ species }: { species: ClinicListRow[] }) {
  const router = useRouter();
  const [label, setLabel] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  async function addSpecies(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/clinic/lists', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: 'species', label }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agregar.');
      return;
    }
    setLabel('');
    router.refresh();
  }

  async function patch(id: string, body: { label?: string; isActive?: boolean }) {
    setError(null);
    setBusyId(id);
    const response = await fetch('/api/clinic/lists', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, ...body }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusyId(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    router.refresh();
  }

  async function remove(id: string) {
    setError(null);
    setBusyId(id);
    const response = await fetch(`/api/clinic/lists?id=${id}`, { method: 'DELETE' });
    const payload = (await response.json()) as { error?: string };
    setBusyId(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo eliminar.');
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-5">
      <PageHeading
        mark="clinicas"
        kicker="Administración"
        title="Configuración"
        description="Listas de la clínica. Lo que pongas aquí es lo que aparece en los menús del expediente."
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      <div className="pe-glass-card p-4">
        <h2 className="font-semibold">Especies</h2>
        <p className="mt-1 text-sm text-pe-muted">
          Perro y gato vienen de fábrica. Agrega conejo, ave, hurón u otra según esta veterinaria.
        </p>
        <form onSubmit={(event) => void addSpecies(event)} className="mt-3 flex flex-wrap gap-2">
          <input
            className="pe-input min-w-[12rem] flex-1"
            placeholder="Nueva especie"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            required
          />
          <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
            Agregar
          </button>
        </form>
        <ul className="mt-4 divide-y divide-pe-line">
          {species.map((item) => (
            <li key={item.id} className="flex flex-wrap items-center gap-2 py-2">
              <input
                className="pe-input min-w-[10rem] flex-1"
                defaultValue={item.label}
                disabled={busyId === item.id}
                onBlur={(event) => {
                  const next = event.target.value.trim();
                  if (next && next !== item.label) void patch(item.id, { label: next });
                }}
              />
              <button
                type="button"
                className="pe-btn-ghost px-3 py-1.5 text-xs"
                disabled={busyId === item.id}
                onClick={() => void patch(item.id, { isActive: !item.is_active })}
              >
                {item.is_active ? 'Ocultar' : 'Mostrar'}
              </button>
              <button
                type="button"
                className="pe-btn-ghost px-3 py-1.5 text-xs text-pe-danger"
                disabled={busyId === item.id}
                onClick={() => void remove(item.id)}
              >
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
