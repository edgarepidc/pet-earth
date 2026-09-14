import Link from 'next/link';

import { patientAgeLabel, SEX_LABELS, SPECIES_LABELS, type Sex, type Species } from '@petearth/shared';

export function PatientHeader({
  name,
  species,
  sex,
  breed,
  birthDate,
  tutorName,
  tutorPhone,
  alerts,
  allergies,
  weightKg,
  href,
}: {
  name: string;
  species: Species;
  sex?: Sex | null;
  breed?: string | null;
  birthDate?: string | null;
  tutorName?: string | null;
  tutorPhone?: string | null;
  alerts?: string | null;
  allergies?: string | null;
  weightKg?: number | null;
  href?: string;
}) {
  const title = href ? (
    <Link href={href} className="font-serif text-2xl font-semibold text-[#2a221c] no-underline hover:underline">
      {name}
    </Link>
  ) : (
    <h1 className="font-serif text-2xl font-semibold text-[#2a221c]">{name}</h1>
  );

  return (
    <header className="pe-card p-4">
      <p className="pe-kicker">Paciente</p>
      {title}
      <p className="mt-1 text-sm text-[#6b5e55]">
        {SPECIES_LABELS[species]}
        {sex ? ` · ${SEX_LABELS[sex]}` : ''}
        {breed ? ` · ${breed}` : ''}
        {patientAgeLabel(birthDate ?? null) ? ` · ${patientAgeLabel(birthDate ?? null)}` : ''}
        {weightKg != null ? ` · ${weightKg} kg` : ''}
      </p>
      <p className="text-sm text-[#6b5e55]">
        Tutor: {tutorName ?? '—'}
        {tutorPhone ? ` · ${tutorPhone}` : ''}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {alerts ? <span className="pe-pill bg-amber-100 text-amber-900">Alerta: {alerts}</span> : null}
        {allergies ? <span className="pe-pill bg-red-100 text-red-800">Alergias: {allergies}</span> : null}
      </div>
    </header>
  );
}
