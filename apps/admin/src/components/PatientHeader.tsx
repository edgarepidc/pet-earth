import Link from 'next/link';

import { patientAgeLabel, SEX_LABELS, speciesLabel, type ClinicListOption, type Sex, whatsappHref } from '@petearth/shared';

import { PageHeading, speciesMark } from '@/components/SectionTitle';

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
  microchip,
  href,
  clinicName,
  speciesOptions,
  boxed = true,
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
  microchip?: string | null;
  href?: string;
  clinicName?: string;
  speciesOptions?: ClinicListOption[];
  boxed?: boolean;
}) {
  const title = href ? (
    <Link href={href} className="no-underline hover:underline">
      {name}
    </Link>
  ) : (
    name
  );
  const meta = [
    speciesLabel(species, speciesOptions),
    sex ? SEX_LABELS[sex] : null,
    breed,
    patientAgeLabel(birthDate ?? null),
    weightKg != null ? `${weightKg} kg` : null,
    microchip,
  ]
    .filter(Boolean)
    .join(' · ');
  const wa = whatsappHref(
    tutorPhone,
    `Hola ${tutorName ?? 'tutor'}, te escribe ${clinicName ?? 'la clínica'} por ${name}.`,
  );

  const body = (
    <>
      <PageHeading mark={speciesMark(species)} kicker="Paciente" title={title} description={meta} />
      <p className="mt-1 text-sm text-pe-muted">
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
      {alerts || allergies ? (
        <div className="mt-3 flex flex-wrap gap-2">
          {alerts ? <span className="pe-pill bg-amber-100 text-amber-900">Alerta: {alerts}</span> : null}
          {allergies ? <span className="pe-pill bg-red-100 text-red-800">Alergias: {allergies}</span> : null}
        </div>
      ) : null}
    </>
  );

  if (!boxed) return <header className="min-w-0">{body}</header>;
  return <header className="pe-card p-4">{body}</header>;
}
