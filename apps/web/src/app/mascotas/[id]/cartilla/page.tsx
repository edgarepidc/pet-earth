import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';

import { formatMexicoDate } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { PrintButton } from '@/components/PrintButton';
import { getTutorContext } from '@/lib/tutor';

export const dynamic = 'force-dynamic';

export default async function TutorCartillaPage({ params }: { params: Promise<{ id: string }> }) {
  const tutor = await getTutorContext();
  if (!tutor) redirect('/login');
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, breed')
    .eq('id', id)
    .eq('client_id', tutor.clientId)
    .maybeSingle();
  if (!patient) notFound();
  const { data: vaccines } = await supabase
    .from('vaccine_records')
    .select('name, applied_on, next_due, lot')
    .eq('patient_id', id)
    .order('applied_on', { ascending: false });

  return (
    <div className="pe-app min-h-screen px-4 py-6">
      <div className="pe-no-print mx-auto mb-4 flex max-w-3xl items-center justify-between">
        <Link href={`/mascotas/${id}`} className="text-sm font-medium text-[#b85c38] underline">
          Volver
        </Link>
        <PrintButton />
      </div>
      <article className="pe-print-sheet mx-auto max-w-3xl p-8">
        <p className="pe-kicker">{tutor.clinicName}</p>
        <h1 className="mt-2 font-serif text-3xl font-semibold">Cartilla de vacunación</h1>
        <p className="mt-2 text-sm">
          {patient.name}
          {patient.breed ? ` · ${patient.breed}` : ''} · Tutor {tutor.clientName}
        </p>
        <table className="mt-6 w-full text-left text-sm">
          <thead>
            <tr className="border-b border-[var(--pe-line)]">
              <th className="py-2">Vacuna</th>
              <th>Aplicada</th>
              <th>Lote</th>
              <th>Próxima</th>
            </tr>
          </thead>
          <tbody>
            {(vaccines ?? []).map((row, index) => (
              <tr key={`${row.name}-${index}`} className="border-b border-[var(--pe-line)]">
                <td className="py-2">{row.name}</td>
                <td>{formatMexicoDate(row.applied_on)}</td>
                <td>{row.lot || '—'}</td>
                <td>{row.next_due ? formatMexicoDate(row.next_due) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </article>
    </div>
  );
}
