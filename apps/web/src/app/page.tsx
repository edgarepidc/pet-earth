import Link from 'next/link';
import { redirect } from 'next/navigation';

import { REMINDER_KIND_LABELS, SPECIES_LABELS, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { LogoutButton } from '@/components/LogoutButton';
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
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-wide text-slate-500">{tutor.clinicName}</p>
          <h1 className="text-2xl font-bold">Hola, {tutor.clientName}</h1>
        </div>
        <LogoutButton />
      </header>
      <section className="space-y-3">
        <h2 className="font-semibold">Tus mascotas</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {(patients ?? []).map((pet) => (
            <Link key={pet.id} href={`/mascotas/${pet.id}`} className="pe-glass-card block p-4">
              <p className="text-lg font-semibold">{pet.name}</p>
              <p className="text-sm text-slate-500">
                {SPECIES_LABELS[pet.species]} {pet.breed ? `· ${pet.breed}` : ''}
              </p>
            </Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="font-semibold">Pendientes</h2>
        <ul className="mt-3 space-y-2">
          {(reminders ?? []).map((row) => {
            const pet = Array.isArray(row.patients) ? row.patients[0] : row.patients;
            return (
              <li key={row.id} className="pe-glass-card p-4 text-sm">
                <p className="font-medium">{row.title}</p>
                <p className="text-slate-500">
                  {pet?.name} · {REMINDER_KIND_LABELS[row.kind]} · {row.due_on}
                  {row.due_on <= today ? ' · pendiente' : ''}
                </p>
              </li>
            );
          })}
          {(reminders ?? []).length === 0 ? <li className="text-sm text-slate-500">Nada pendiente.</li> : null}
        </ul>
      </section>
    </main>
  );
}
