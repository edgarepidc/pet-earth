import Link from 'next/link';
import { redirect } from 'next/navigation';

import { REMINDER_KIND_LABELS, SPECIES_LABELS, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { TutorShell } from '@/components/TutorShell';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function TutorHomePage() {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const supabase = createAdminClient();
  const [{ data: patients }, { data: reminders }] = await Promise.all([
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
  ]);

  const today = todayMexicoYmd();

  return (
    <TutorShell clinicName={tutor.clinicName} tutorName={tutor.clientName}>
      <section className="space-y-3">
        <h2 className="font-serif text-xl font-semibold">Tus mascotas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(patients ?? []).map((pet) => (
            <Link key={pet.id} href={`/mascotas/${pet.id}`} className="pe-card block p-4">
              <p className="font-serif text-xl font-semibold">{pet.name}</p>
              <p className="text-sm text-[#6b5e55]">
                {SPECIES_LABELS[pet.species]} {pet.breed ? `· ${pet.breed}` : ''}
              </p>
              {pet.alerts ? <p className="mt-2 text-xs text-amber-800">{pet.alerts}</p> : null}
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-serif text-xl font-semibold">Pendientes</h2>
        <ul className="mt-3 space-y-2">
          {(reminders ?? []).map((row) => {
            const pet = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <li key={row.id} className="pe-card p-4 text-sm">
                <p className="font-medium">{row.title}</p>
                <p className="text-[#6b5e55]">
                  {pet?.name} · {REMINDER_KIND_LABELS[row.kind]} · {row.due_on}
                  {row.due_on <= today ? ' · por atender' : ''}
                </p>
              </li>
            );
          })}
          {(reminders ?? []).length === 0 ? <li className="text-sm text-[#6b5e55]">Nada pendiente.</li> : null}
        </ul>
      </section>
    </TutorShell>
  );
}
