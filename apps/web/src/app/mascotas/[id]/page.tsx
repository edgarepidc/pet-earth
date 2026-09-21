import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { formatMexicoDateTime, patientAgeLabel, SEX_LABELS, speciesLabel } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { SectionMark, speciesMark } from '@/components/SectionTitle';
import { TutorScheduleForm } from '@/components/TutorScheduleForm';
import { TutorShell } from '@/components/TutorShell';
import { loadPublicClinic } from '@/lib/clinic';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function PetProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ agendar?: string }>;
}) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { id } = await params;
  const { agendar } = await searchParams;
  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('client_id', tutor.clientId)
    .maybeSingle();
  if (!patient) notFound();

  const [{ data: visits }, { data: vaccines }, { data: appointments }, { data: speciesRows }, clinic] = await Promise.all([
    supabase
      .from('visits')
      .select('id, started_at, plan, assessment, weight_kg')
      .eq('patient_id', id)
      .eq('status', 'completed')
      .order('started_at', { ascending: false }),
    supabase
      .from('vaccine_records')
      .select('name, applied_on, next_due')
      .eq('patient_id', id)
      .order('applied_on', { ascending: false }),
    supabase
      .from('appointments')
      .select('starts_at, status, reason')
      .eq('patient_id', id)
      .in('status', ['scheduled', 'confirmed', 'waiting', 'in_consult'])
      .order('starts_at'),
    supabase
      .from('clinic_lists')
      .select('slug, label')
      .eq('organization_id', tutor.organizationId)
      .eq('list_key', 'species'),
    loadPublicClinic(),
  ]);
  const service = clinic.services.find((item) => item.sku === agendar) ?? clinic.products.find((item) => item.sku === agendar);

  return (
    <TutorShell clinicName={tutor.clinicName} tutorName={tutor.clientName}>
      <Link href="/cuenta" className="text-sm pe-link">
        Todas las mascotas
      </Link>
      <h2 className="mt-4 flex items-center gap-3 font-serif text-3xl font-semibold">
        <SectionMark name={speciesMark(patient.species)} />
        {patient.name}
      </h2>
      <p className="text-pe-muted">
        {speciesLabel(patient.species, speciesRows ?? [])} · {SEX_LABELS[patient.sex]}
        {patientAgeLabel(patient.birth_date) ? ` · ${patientAgeLabel(patient.birth_date)}` : ''}
      </p>
      {patient.allergies ? <p className="mt-2 text-sm text-red-800">Alergias: {patient.allergies}</p> : null}

      <section className="pe-card mt-6 p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <SectionMark name="agenda" size="sm" />
          Próximas citas
        </h3>
        <ul className="mt-2 space-y-1 text-sm">
          {(appointments ?? []).map((row) => (
            <li key={row.starts_at}>
              {formatMexicoDateTime(row.starts_at)} {row.reason ? `· ${row.reason}` : ''}
            </li>
          ))}
          {(appointments ?? []).length === 0 ? <li className="text-pe-muted">Sin citas abiertas.</li> : null}
        </ul>
        <TutorScheduleForm
          patientId={patient.id}
          patientName={patient.name}
          defaultReason={service?.name ?? ''}
          branchName={clinic.branchName}
        />
      </section>

      <section className="pe-card mt-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <h3 className="flex items-center gap-2 font-semibold">
            <SectionMark name="cartilla" size="sm" />
            Cartilla de vacunas
          </h3>
          <Link href={`/mascotas/${id}/cartilla`} className="text-sm pe-link">
            Imprimir
          </Link>
        </div>
        <ol className="mt-3 space-y-3 border-l border-[rgba(42,34,28,0.15)] pl-4 text-sm">
          {(vaccines ?? []).map((row, index) => (
            <li key={`${row.name}-${index}`}>
              <p className="font-medium">{row.name}</p>
              <p className="text-pe-muted">
                Aplicada {row.applied_on}
                {row.next_due ? ` · próxima ${row.next_due}` : ''}
              </p>
            </li>
          ))}
          {(vaccines ?? []).length === 0 ? <li className="text-pe-muted">Aún no hay vacunas registradas.</li> : null}
        </ol>
      </section>

      <section className="pe-card mt-4 p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <SectionMark name="consulta" size="sm" />
          Altas de consulta
        </h3>
        <ul className="mt-2 space-y-3 text-sm">
          {(visits ?? []).map((visit) => (
            <li key={visit.id}>
              <p className="font-medium">{formatMexicoDateTime(visit.started_at)}</p>
              {visit.weight_kg ? <p className="text-pe-muted">Peso: {Number(visit.weight_kg)} kg</p> : null}
              {visit.assessment ? <p>{visit.assessment}</p> : null}
              {visit.plan ? <p className="text-pe-muted">Plan: {visit.plan}</p> : null}
            </li>
          ))}
          {(visits ?? []).length === 0 ? <li className="text-pe-muted">Aún no hay altas para mostrar.</li> : null}
        </ul>
      </section>
    </TutorShell>
  );
}
