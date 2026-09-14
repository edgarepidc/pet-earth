import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { formatMexicoDateTime, patientAgeLabel, SEX_LABELS, SPECIES_LABELS } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { LogoutButton } from '@/components/LogoutButton';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function PetProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*')
    .eq('id', id)
    .eq('client_id', tutor.clientId)
    .maybeSingle();
  if (!patient) notFound();

  const [{ data: visits }, { data: vaccines }, { data: appointments }] = await Promise.all([
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
  ]);

  return (
    <main className="mx-auto min-h-screen max-w-3xl px-4 py-8">
      <header className="mb-6 flex items-center justify-between">
        <Link href="/" className="text-sm font-medium text-[#245a4c] underline">
          Volver
        </Link>
        <LogoutButton />
      </header>
      <h1 className="text-3xl font-bold">{patient.name}</h1>
      <p className="text-slate-500">
        {SPECIES_LABELS[patient.species]} · {SEX_LABELS[patient.sex]}
        {patientAgeLabel(patient.birth_date) ? ` · ${patientAgeLabel(patient.birth_date)}` : ''}
      </p>
      {patient.allergies ? <p className="mt-2 text-sm text-red-700">Alergias: {patient.allergies}</p> : null}

      <section className="pe-glass-card mt-6 p-4">
        <h2 className="font-semibold">Próximas citas</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(appointments ?? []).map((row) => (
            <li key={row.starts_at}>
              {formatMexicoDateTime(row.starts_at)} {row.reason ? `· ${row.reason}` : ''}
            </li>
          ))}
          {(appointments ?? []).length === 0 ? <li className="text-slate-500">Sin citas abiertas.</li> : null}
        </ul>
      </section>

      <section className="pe-glass-card mt-4 p-4">
        <h2 className="font-semibold">Cartilla de vacunas</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {(vaccines ?? []).map((row, index) => (
            <li key={`${row.name}-${index}`}>
              {row.name} · aplicada {row.applied_on}
              {row.next_due ? ` · próxima ${row.next_due}` : ''}
            </li>
          ))}
        </ul>
      </section>

      <section className="pe-glass-card mt-4 p-4">
        <h2 className="font-semibold">Historial de altas</h2>
        <ul className="mt-2 space-y-3 text-sm">
          {(visits ?? []).map((visit) => (
            <li key={visit.id}>
              <p className="font-medium">{formatMexicoDateTime(visit.started_at)}</p>
              {visit.weight_kg ? <p className="text-slate-500">Peso: {Number(visit.weight_kg)} kg</p> : null}
              {visit.assessment ? <p>{visit.assessment}</p> : null}
              {visit.plan ? <p className="text-slate-600">Plan: {visit.plan}</p> : null}
            </li>
          ))}
          {(visits ?? []).length === 0 ? <li className="text-slate-500">Aún no hay altas para mostrar.</li> : null}
        </ul>
      </section>
    </main>
  );
}
