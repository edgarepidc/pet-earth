import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { formatMexicoDateTime, patientAgeLabel, SEX_LABELS, speciesLabel } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { SectionMark, speciesMark } from '@/components/SectionTitle';
import { TutorScheduleForm } from '@/components/TutorScheduleForm';
import { TutorShell } from '@/components/TutorShell';
import { loadPublicClinic } from '@/lib/clinic';
import { loadTutorMedia } from '@/lib/media';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function PetProfilePage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ agendar?: string; motivo?: string }>;
}) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { id } = await params;
  const { agendar, motivo } = await searchParams;
  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('client_id', tutor.clientId)
    .maybeSingle();
  if (!patient) notFound();

  const [{ data: visits }, { data: vaccines }, { data: appointments }, { data: speciesRows }, clinic, media] = await Promise.all([
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
    loadPublicClinic(tutor.preferredBranchId),
    loadTutorMedia([id]),
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
        <div className="mt-4 border-t border-[rgba(31,36,40,0.08)] pt-4">
          <TutorScheduleForm
            patientId={patient.id}
            patientName={patient.name}
            defaultReason={service?.name ?? motivo ?? ''}
            branchName={clinic.branchName}
          />
        </div>
      </section>

      <section className="pe-card mt-4 p-4">
        <h3 className="flex items-center gap-2 font-semibold">
          <SectionMark name="informes" size="sm" />
          Estudios y documentos
        </h3>
        <p className="mt-1 text-sm text-pe-muted">
          Lo que la clínica cargó al expediente: laboratorios, radiografías u otros archivos.
        </p>
        {media.length === 0 ? (
          <p className="mt-3 text-sm text-pe-muted">Aún no hay estudios ni documentos.</p>
        ) : (
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {media.map((item) => (
              <li key={item.id} className="overflow-hidden rounded-md border border-[rgba(31,36,40,0.08)] bg-white">
                {item.url && item.content_type?.startsWith('image/') ? (
                  <a href={item.url} target="_blank" rel="noreferrer">
                    <img src={item.url} alt={item.caption || 'Documento clínico'} className="h-40 w-full object-cover" />
                  </a>
                ) : item.url ? (
                  <a href={item.url} target="_blank" rel="noreferrer" className="block p-3 text-sm underline">
                    Abrir documento
                  </a>
                ) : (
                  <p className="p-3 text-sm text-pe-muted">No se pudo abrir el archivo.</p>
                )}
                <p className="p-2 text-xs text-pe-muted">
                  {item.kind === 'study' ? 'Estudio' : 'Foto'}
                  {item.caption ? ` · ${item.caption}` : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
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
