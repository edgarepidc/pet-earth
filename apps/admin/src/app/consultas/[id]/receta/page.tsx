import { formatMexicoDate, formatMoney } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import { notFound } from 'next/navigation';

import { PrintSheet } from '@/components/PrintSheet';
import { loadClinicSession } from '@/lib/auth';
import { loadLetterhead } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function RecetaPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await loadClinicSession();
  const { id } = await params;
  const supabase = createAdminClient();
  const letterhead = await loadLetterhead(staff.organizationId, staff.branchId);
  const { data: visit } = await supabase
    .from('visits')
    .select(
      '*, patients(name, species, breed, sex, birth_date, allergies), clients(full_name, phone), visit_lines(*), vaccine_records(name, lot, next_due, applied_on)',
    )
    .eq('id', id)
    .eq('organization_id', staff.organizationId)
    .maybeSingle();
  if (!visit) notFound();
  const patient = Array.isArray(visit.patients) ? visit.patients[0] : visit.patients;
  const client = Array.isArray(visit.clients) ? visit.clients[0] : visit.clients;
  const lines = Array.isArray(visit.visit_lines) ? visit.visit_lines : visit.visit_lines ? [visit.visit_lines] : [];
  const vaccines = Array.isArray(visit.vaccine_records)
    ? visit.vaccine_records
    : visit.vaccine_records
      ? [visit.vaccine_records]
      : [];
  const meds = lines.filter((line) => line.kind === 'product');
  const dateLabel = formatMexicoDate((visit.completed_at ?? visit.started_at).slice(0, 10));

  return (
    <PrintSheet
      backHref={`/consultas/${id}`}
      clinicName={letterhead.clinicName}
      branchName={letterhead.branchName}
      branchAddress={letterhead.branchAddress}
      fiscal={letterhead.fiscal}
    >
      <h1 className="mt-4 font-serif text-3xl font-semibold">Receta y alta</h1>
      <p className="text-sm text-pe-muted">
        {dateLabel} · {staff.fullName ?? staff.email}
      </p>
      <section className="mt-6 grid gap-2 text-sm">
        <p>
          <strong>Paciente:</strong> {patient?.name}
          {patient?.breed ? ` · ${patient.breed}` : ''}
        </p>
        <p>
          <strong>Tutor:</strong> {client?.full_name}
          {client?.phone ? ` · ${client.phone}` : ''}
        </p>
        {patient?.allergies ? (
          <p>
            <strong>Alergias:</strong> {patient.allergies}
          </p>
        ) : null}
        <p>
          Peso {visit.weight_kg ?? '—'} kg · Temp {visit.temperature_c ?? '—'} °C · FC {visit.heart_rate ?? '—'} · FR{' '}
          {visit.respiratory_rate ?? '—'}
        </p>
      </section>
      <section className="mt-6">
        <h2 className="font-semibold">Evaluación</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm">{visit.assessment || '—'}</p>
      </section>
      <section className="mt-4">
        <h2 className="font-semibold">Plan / indicaciones</h2>
        <p className="mt-1 whitespace-pre-wrap text-sm">{visit.plan || '—'}</p>
      </section>
      <section className="mt-4">
        <h2 className="font-semibold">Medicamentos</h2>
        <ul className="mt-2 space-y-1 text-sm">
          {meds.map((line) => (
            <li key={line.id}>
              {line.description} · {Number(line.quantity)} · {formatMoney(Number(line.unit_price))}
            </li>
          ))}
          {meds.length === 0 ? <li>Sin medicamentos en el ticket.</li> : null}
        </ul>
      </section>
      {(vaccines ?? []).length > 0 ? (
        <section className="mt-4">
          <h2 className="font-semibold">Vacunas aplicadas hoy</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {vaccines.map((row) => (
              <li key={row.name}>
                {row.name}
                {row.lot ? ` · lote ${row.lot}` : ''}
                {row.next_due ? ` · próxima ${row.next_due}` : ''}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <p className="mt-10 text-sm text-pe-muted">
        Firma y sello ________________________________ · {letterhead.fiscal.razonSocial || staff.organizationName}
      </p>
    </PrintSheet>
  );
}
