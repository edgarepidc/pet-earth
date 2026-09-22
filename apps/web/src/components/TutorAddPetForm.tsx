'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DEFAULT_SPECIES_OPTIONS, type ClinicListOption } from '@petearth/shared';

export function TutorAddPetForm({ speciesOptions }: { speciesOptions: ClinicListOption[] }) {
  const router = useRouter();
  const options = speciesOptions.length ? speciesOptions : DEFAULT_SPECIES_OPTIONS;
  const [name, setName] = useState('');
  const [species, setSpecies] = useState(options[0]?.slug ?? 'dog');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch('/api/account/pets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, species }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    setName('');
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void submit(event)} className="pe-card space-y-3 p-4">
      <p className="text-sm font-medium">Agregar mascota</p>
      <input className="pe-input" required placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
      <select className="pe-input" value={species} onChange={(e) => setSpecies(e.target.value)}>
        {options.map((item) => (
          <option key={item.slug} value={item.slug}>
            {item.label}
          </option>
        ))}
      </select>
      {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      <button type="submit" className="pe-btn-secondary px-4 py-2 text-sm" disabled={busy}>
        Guardar mascota
      </button>
    </form>
  );
}
