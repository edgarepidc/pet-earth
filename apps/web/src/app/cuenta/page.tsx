import Link from 'next/link';
import { redirect } from 'next/navigation';

import { REMINDER_KIND_LABELS, speciesLabel, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { loadPublicClinic } from '@/lib/clinic';
import { SectionMark, speciesMark } from '@/components/SectionTitle';
import { TutorShell } from '@/components/TutorShell';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function TutorHomePage({
  searchParams,
}: {
  searchParams: Promise<{ agendar?: string }>;
}) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { agendar } = await searchParams;
  const supabase = createAdminClient();
  const [{ data: patients }, { data: reminders }, { data: speciesRows }, clinic] = await Promise.all([
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
      .order('due_on'),
    supabase
      .from('clinic_lists')
      .select('slug, label')
      .eq('organization_id', tutor.organizationId)
      .eq('list_key', 'species'),
    loadPublicClinic(),
  ]);
  const speciesOptions = speciesRows ?? [];
  const service = clinic.services.find((item) => item.sku === agendar) ?? clinic.products.find((item) => item.sku === agendar);

  const today = todayMexicoYmd();

  return (
    <TutorShell clinicName={tutor.clinicName} tutorName={tutor.clientName}>
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <SectionMark name="pacientes" size="sm" />
          Tus mascotas
        </h2>
        {agendar ? (
          <p className="pe-callout-amber p-3 text-sm">
            Elige una mascota para agendar{service ? ` ${service.name}` : ''}.
          </p>
        ) : null}
        <div className="grid gap-3 sm:grid-cols-2">
          {(patients ?? []).map((pet) => {
            const href = agendar
              ? `/mascotas/${pet.id}?agendar=${encodeURIComponent(agendar)}`
              : `/mascotas/${pet.id}`;
            return (
              <Link key={pet.id} href={href} className="pe-card flex items-start gap-3 p-4">
                <SectionMark name={speciesMark(pet.species)} size="sm" />
                <span className="min-w-0 flex-1">
                  <p className="font-serif text-xl font-semibold">{pet.name}</p>
                  <p className="text-sm text-pe-muted">
                    {speciesLabel(pet.species, speciesOptions)} {pet.breed ? `· ${pet.breed}` : ''}
                  </p>
                  {pet.alerts ? <p className="mt-2 text-xs text-amber-800">{pet.alerts}</p> : null}
                  {agendar ? <p className="mt-3 text-sm font-semibold text-pe-clay">Agendar</p> : null}
                </span>
              </Link>
            );
          })}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
          <SectionMark name="seguimiento" size="sm" />
          Pendientes
        </h2>
        <ul className="mt-3 space-y-2">
          {(reminders ?? []).map((row) => {
            const pet = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <li key={row.id} className="pe-card p-4 text-sm">
                <p className="font-medium">{row.title}</p>
                <p className="text-pe-muted">
                  {pet?.name} · {REMINDER_KIND_LABELS[row.kind]} · {row.due_on}
                  {row.due_on <= today ? ' · por atender' : ''}
                </p>
              </li>
            );
          })}
          {(reminders ?? []).length === 0 ? <li className="text-sm text-pe-muted">Nada pendiente.</li> : null}
        </ul>
      </section>
    </TutorShell>
  );
}
