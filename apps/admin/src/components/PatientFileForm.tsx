'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SEX_LABELS, SEXES, type ClinicListOption, type Sex } from '@petearth/shared';

import { SectionMark } from '@/components/SectionTitle';

export function PatientFileForm({
  patientId,
  name,
  species,
  breed,
  sex,
  neutered,
  birthDate,
  microchip,
  color,
  allergies,
  alerts,
  isActive,
  speciesOptions,
}: {
  patientId: string;
  name: string;
  species: string;
  breed: string | null;
  sex: Sex;
  neutered: boolean;
  birthDate: string | null;
  microchip: string | null;
  color: string | null;
  allergies: string | null;
  alerts: string | null;
  isActive: boolean;
  speciesOptions: ClinicListOption[];
}) {
  const router = useRouter();
  const [petName, setPetName] = useState(name);
  const [petSpecies, setPetSpecies] = useState(species);
  const [petBreed, setPetBreed] = useState(breed ?? '');
  const [petSex, setPetSex] = useState<Sex>(sex);
  const [petNeutered, setPetNeutered] = useState(neutered);
  const [petBirthDate, setPetBirthDate] = useState(birthDate ?? '');
  const [petMicrochip, setPetMicrochip] = useState(microchip ?? '');
  const [petColor, setPetColor] = useState(color ?? '');
  const [petAllergies, setPetAllergies] = useState(allergies ?? '');
  const [petAlerts, setPetAlerts] = useState(alerts ?? '');
  const [petActive, setPetActive] = useState(isActive);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSaved(false);
    setSaving(true);
    const response = await fetch('/api/patients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: patientId,
        name: petName,
        species: petSpecies,
        breed: petBreed,
        sex: petSex,
        neutered: petNeutered,
        birthDate: petBirthDate,
        microchip: petMicrochip,
        color: petColor,
        allergies: petAllergies,
        alerts: petAlerts,
        isActive: petActive,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setSaving(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar la ficha.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void save(event)} className="pe-glass-card space-y-3 p-4">
      <h2 className="flex items-center gap-2 font-semibold">
        <SectionMark name="pacientes" size="sm" />
        Ficha
      </h2>
      <p className="text-sm text-pe-muted">Nombre, manejo y datos clínicos. Vacía un campo para quitarlo.</p>
      <div className="grid gap-3 xl:grid-cols-2">
        <label className="block text-sm">
          Nombre
          <input className="pe-input mt-1" required value={petName} onChange={(e) => setPetName(e.target.value)} />
        </label>
        <label className="block text-sm">
          Especie
          <select className="pe-input mt-1" value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}>
            {(speciesOptions.some((item) => item.slug === petSpecies)
              ? speciesOptions
              : [{ slug: petSpecies, label: petSpecies }, ...speciesOptions]
            ).map((item) => (
              <option key={item.slug} value={item.slug}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Raza
          <input className="pe-input mt-1" value={petBreed} onChange={(e) => setPetBreed(e.target.value)} />
        </label>
        <label className="block text-sm">
          Sexo
          <select className="pe-input mt-1" value={petSex} onChange={(e) => setPetSex(e.target.value as Sex)}>
            {SEXES.map((item) => (
              <option key={item} value={item}>
                {SEX_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-sm">
          Nacimiento
          <input className="pe-input mt-1" type="date" value={petBirthDate} onChange={(e) => setPetBirthDate(e.target.value)} />
        </label>
        <label className="block text-sm">
          Color
          <input className="pe-input mt-1" value={petColor} onChange={(e) => setPetColor(e.target.value)} />
        </label>
        <label className="block text-sm">
          Microchip
          <input className="pe-input mt-1" value={petMicrochip} onChange={(e) => setPetMicrochip(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" checked={petNeutered} onChange={(e) => setPetNeutered(e.target.checked)} />
          Esterilizado / castrado
        </label>
        <label className="block text-sm xl:col-span-2">
          Alertas de manejo
          <input
            className="pe-input mt-1"
            placeholder="Ansiosa en mesa, sale si se abre la jaula…"
            value={petAlerts}
            onChange={(e) => setPetAlerts(e.target.value)}
          />
        </label>
        <label className="block text-sm xl:col-span-2">
          Alergias
          <textarea className="pe-input mt-1 min-h-20" value={petAllergies} onChange={(e) => setPetAllergies(e.target.value)} />
        </label>
        <label className="flex items-center gap-2 text-sm xl:col-span-2">
          <input type="checkbox" checked={petActive} onChange={(e) => setPetActive(e.target.checked)} />
          Paciente activo
        </label>
      </div>
      {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      {saved ? <p className="text-sm text-pe-muted">Ficha guardada.</p> : null}
      <button type="submit" disabled={saving} className="pe-btn-primary px-4 py-2 text-sm">
        {saving ? 'Guardando…' : 'Guardar ficha'}
      </button>
    </form>
  );
}
