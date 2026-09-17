import Link from 'next/link';

import { patientAgeLabel, SEX_LABELS, speciesLabel, type ClinicListOption, type Sex, whatsappHref } from '@petearth/shared';

import { SectionMark, speciesMark } from '@/components/SectionTitle';

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
  clinicName,
  speciesOptions,
}: {
  name: string;
  species: string;
  sex?: Sex | null;
  breed?: string | null;
  birthDate?: string | null;
  tutorName?: string | null;
  tutorPhone?: string | null;
  alerts?: string | null;
  allergies?: string | null;
  weightKg?: number | null;
  href?: string;
  clinicName?: string;
  speciesOptions?: ClinicListOption[];
}) {
  const title = href ? (
    <Link href={href} className="text-2xl font-semibold tracking-tight text-pe-ink no-underline hover:underline">
      {name}
    </Link>
  ) : (
    <h1 className="text-2xl font-semibold tracking-tight text-pe-ink">{name}</h1>
  );
  const wa = whatsappHref(
    tutorPhone,
    `Hola ${tutorName ?? 'tutor'}, te escribe ${clinicName ?? 'la clínica'} por ${name}.`,
  );

  return (
    <header className="pe-card p-4">
      <p className="pe-kicker">Paciente</p>
      <div className="mt-1 flex items-center gap-3">
        <SectionMark name={speciesMark(species)} />
        {title}
      </div>
      <p className="mt-1 text-sm text-pe-muted">
        {speciesLabel(species, speciesOptions)}
        {sex ? ` · ${SEX_LABELS[sex]}` : ''}
        {breed ? ` · ${breed}` : ''}
        {patientAgeLabel(birthDate ?? null) ? ` · ${patientAgeLabel(birthDate ?? null)}` : ''}
        {weightKg != null ? ` · ${weightKg} kg` : ''}
      </p>
      <p className="text-sm text-pe-muted">
        Tutor: {tutorName ?? '—'}
        {tutorPhone ? ` · ${tutorPhone}` : ''}
        {wa ? (
          <>
            {' · '}
            <a href={wa} target="_blank" rel="noreferrer" className="pe-link">
              WhatsApp
            </a>
          </>
        ) : null}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {alerts ? <span className="pe-pill bg-amber-100 text-amber-900">Alerta: {alerts}</span> : null}
        {allergies ? <span className="pe-pill bg-red-100 text-red-800">Alergias: {allergies}</span> : null}
      </div>
    </header>
  );
}
