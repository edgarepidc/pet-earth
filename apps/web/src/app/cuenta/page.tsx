import Link from 'next/link';
import { redirect } from 'next/navigation';

import { formatMexicoDate, formatMexicoDateTime, speciesLabel, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { loadPublicClinic } from '@/lib/clinic';
import { loadTutorMedia } from '@/lib/media';
import { SectionMark, speciesMark } from '@/components/SectionTitle';
import { TutorCart } from '@/components/TutorCart';
import { TutorScheduleForm } from '@/components/TutorScheduleForm';
import { TutorShell } from '@/components/TutorShell';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

const REMINDER_COPY: Record<string, string> = {
  vaccine: 'Vence este refuerzo. Aún no es una cita en agenda.',
  deworming: 'Vence la desparasitación. Aún no es una cita en agenda.',
  followup: 'Toca un control. Aún no es una cita en agenda.',
};

export default async function TutorHomePage({
  searchParams,
}: {
  searchParams: Promise<{ agendar?: string; mascota?: string; motivo?: string }>;
}) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { agendar, mascota, motivo } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: patients }, { data: reminders }, { data: appointments }, { data: speciesRows }, clinic] = await Promise.all([
    supabase
      .from('patients')
      .select('id, name, species, breed, alerts')
      .eq('client_id', tutor.clientId)
      .eq('is_active', true)
      .order('name'),
    supabase
      .from('reminders')
      .select('id, kind, title, due_on, patient_id, patients(name)')
      .eq('client_id', tutor.clientId)
      .eq('status', 'pending')
      .neq('kind', 'appointment')
      .order('due_on'),
    supabase
      .from('appointments')
      .select('id, starts_at, reason, patient_id, patients(name)')
      .eq('client_id', tutor.clientId)
      .in('status', ['scheduled', 'confirmed', 'waiting', 'in_consult'])
      .order('starts_at'),
    supabase
      .from('clinic_lists')
      .select('slug, label')
      .eq('organization_id', tutor.organizationId)
      .eq('list_key', 'species'),
    loadPublicClinic(),
  ]);
  const speciesOptions = speciesRows ?? [];
  const service = clinic.services.find((item) => item.sku === agendar) ?? clinic.products.find((item) => item.sku === agendar);
  const media = await loadTutorMedia((patients ?? []).map((pet) => pet.id));
  const mediaCount = new Map<string, number>();
  for (const item of media) {
    mediaCount.set(item.patient_id, (mediaCount.get(item.patient_id) ?? 0) + 1);
  }
  const today = todayMexicoYmd();
  const pets = (patients ?? []).map((pet) => ({ id: pet.id, name: pet.name }));

  return (
    <TutorShell clinicName={tutor.clinicName} tutorName={tutor.clientName}>
      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
            <SectionMark name="pacientes" size="sm" />
            Tus mascotas
          </h2>
          <a href="#agendar" className="pe-btn-primary px-4 py-2 text-sm">
            Agendar cita
          </a>
        </div>
        {agendar ? (
          <p className="pe-callout-amber p-3 text-sm">
            Elige mascota y horario para agendar{service ? ` ${service.name}` : ''}.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {(patients ?? []).map((pet) => {
            const files = mediaCount.get(pet.id) ?? 0;
            return (
              <article key={pet.id} className="pe-card flex h-full flex-col gap-3 p-4">
                <Link href={`/mascotas/${pet.id}`} className="flex items-start gap-3 no-underline">
                  <SectionMark name={speciesMark(pet.species)} size="sm" />
                  <span className="min-w-0 flex-1">
                    <p className="font-serif text-xl font-semibold text-pe-ink">{pet.name}</p>
                    <p className="text-sm text-pe-muted">
                      {speciesLabel(pet.species, speciesOptions)} {pet.breed ? `· ${pet.breed}` : ''}
                    </p>
                    {pet.alerts ? <p className="mt-2 text-xs text-amber-800">{pet.alerts}</p> : null}
                    {files > 0 ? (
                      <p className="mt-2 text-xs text-pe-muted">
                        {files} {files === 1 ? 'estudio o documento' : 'estudios o documentos'}
                      </p>
                    ) : null}
                  </span>
                </Link>
                <Link
                  href={`?mascota=${pet.id}#agendar`}
                  className="pe-btn-secondary mt-auto px-3 py-1.5 text-center text-sm"
                >
                  Agendar
                </Link>
              </article>
            );
          })}
        </div>
      </section>

      <TutorCart branchName={clinic.branchName} />

      <section className="pe-card mt-8 scroll-mt-8 p-5">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <SectionMark name="agenda" size="sm" />
          Agendar cita
        </h2>
        <p className="mt-1 text-sm text-pe-muted">
          Elige mascota, día y hora. Queda en la agenda del consultorio, no es un recordatorio.
        </p>
        <div className="mt-4">
          <TutorScheduleForm
            key={`${mascota ?? ''}-${motivo ?? ''}-${agendar ?? ''}`}
            pets={pets}
            patientId={mascota ?? (pets.length === 1 ? pets[0].id : undefined)}
            defaultReason={service?.name ?? motivo ?? ''}
            branchName={clinic.branchName}
          />
        </div>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <SectionMark name="agenda" size="sm" />
          Citas agendadas
        </h2>
        <p className="mt-1 text-sm text-pe-muted">Ya tienen día y hora en el consultorio.</p>
        <ul className="mt-3 space-y-2">
          {(appointments ?? []).map((row) => {
            const pet = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <li key={row.id} className="pe-card p-4 text-sm">
                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pe-clay">Cita agendada</p>
                <p className="mt-1 font-medium">{row.reason || 'Consulta'}</p>
                <p className="text-pe-muted">
                  {pet?.name} · {formatMexicoDateTime(row.starts_at)}
                </p>
              </li>
            );
          })}
          {(appointments ?? []).length === 0 ? (
            <li className="text-sm text-pe-muted">No hay citas en agenda. Usa Agendar cita arriba.</li>
          ) : null}
        </ul>
      </section>

      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <SectionMark name="seguimiento" size="sm" />
          Recordatorios
        </h2>
        <p className="mt-1 text-sm text-pe-muted">
          Fechas que vencen (vacuna, desparasitación). No ocupan un horario hasta que agendes.
        </p>
        <ul className="mt-3 space-y-2">
          {(reminders ?? []).map((row) => {
            const pet = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <li key={row.id} className="pe-card flex flex-wrap items-start justify-between gap-3 p-4 text-sm">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pe-muted">Recordatorio</p>
                  <p className="mt-1 font-medium">{row.title}</p>
                  <p className="text-pe-muted">
                    {pet?.name} · vence {formatMexicoDate(row.due_on)}
                    {row.due_on <= today ? ' · por atender' : ''}
                  </p>
                  <p className="mt-1 text-pe-muted">{REMINDER_COPY[row.kind] ?? 'Aún no es una cita.'}</p>
                </div>
                <Link
                  href={`?mascota=${row.patient_id}&motivo=${encodeURIComponent(row.title)}#agendar`}
                  className="pe-btn-secondary px-3 py-1.5 text-sm"
                >
                  Agendar visita
                </Link>
              </li>
            );
          })}
          {(reminders ?? []).length === 0 ? <li className="text-sm text-pe-muted">Nada por vencer.</li> : null}
        </ul>
      </section>
    </TutorShell>
  );
}
