import { formatMexicoDate } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import { notFound } from 'next/navigation';

import { PrintSheet } from '@/components/PrintSheet';
import { loadClinicSession } from '@/lib/auth';
import { loadLetterhead } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function CartillaPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await loadClinicSession();
  const { id } = await params;
  const supabase = createAdminClient();
  const letterhead = await loadLetterhead(staff.organizationId, staff.branchId);
  const { data: patient } = await supabase
    .from('patients')
    .select('id, name, species, breed, sex, birth_date, clients(full_name)')
    .eq('id', id)
    .eq('organization_id', staff.organizationId)
    .maybeSingle();
  if (!patient) notFound();
  const { data: vaccines } = await supabase
    .from('vaccine_records')
    .select('name, applied_on, next_due, lot')
    .eq('patient_id', id)
    .order('applied_on', { ascending: false });
  const client = Array.isArray(patient.clients) ? patient.clients[0] : patient.clients;

  return (
    <PrintSheet
      backHref={`/pacientes/${id}`}
      clinicName={letterhead.clinicName}
      branchName={letterhead.branchName}
      branchAddress={letterhead.branchAddress}
      fiscal={letterhead.fiscal}
    >
      <h1 className="mt-4 font-serif text-3xl font-semibold">Cartilla de vacunación</h1>
      <section className="mt-6 text-sm">
        <p>
          <strong>{patient.name}</strong>
          {patient.breed ? ` · ${patient.breed}` : ''}
        </p>
        <p>Tutor: {client?.full_name ?? '—'}</p>
      </section>
      <table className="mt-6 w-full text-left text-sm">
        <thead>
          <tr className="border-b border-pe-line">
            <th className="py-2">Vacuna</th>
            <th>Aplicada</th>
            <th>Lote</th>
            <th>Próxima</th>
          </tr>
        </thead>
        <tbody>
          {(vaccines ?? []).map((row, index) => (
            <tr key={`${row.name}-${index}`} className="border-b border-pe-line">
              <td className="py-2">{row.name}</td>
              <td>{formatMexicoDate(row.applied_on)}</td>
              <td>{row.lot || '—'}</td>
              <td>{row.next_due ? formatMexicoDate(row.next_due) : '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {(vaccines ?? []).length === 0 ? <p className="mt-4 text-sm text-pe-muted">Aún no hay vacunas registradas.</p> : null}
    </PrintSheet>
  );
}
