import { canEditClinical, formatMexicoDate } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import { notFound } from 'next/navigation';

import { PrintSheet } from '@/components/PrintSheet';
import { loadClinicSession } from '@/lib/auth';
import { loadLetterhead, loadPrescriber } from '@/lib/queries';

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
  const sheet = letterhead.letterhead;
  const prescriber = await loadPrescriber(visit.vet_id);
  const vetName =
    prescriber.name || (canEditClinical(staff.role) ? staff.fullName?.trim() || staff.email : null) || 'MVZ';
  const license = prescriber.license || (!visit.vet_id && canEditClinical(staff.role) ? staff.license?.trim() || null : null);

  return (
    <PrintSheet
      backHref={`/consultas/${id}`}
      clinicName={letterhead.clinicName}
      branchName={letterhead.branchName}
      branchAddress={letterhead.branchAddress}
      branchPhone={letterhead.branchPhone}
      logo={sheet.logo}
      footer={sheet.footer}
      fiscal={letterhead.fiscal}
      whatsApp={{
        phone: client?.phone,
        tutorName: client?.full_name ?? 'tutor',
        patientName: patient?.name ?? 'tu mascota',
      }}
    >
      <h1 className="mt-4 font-serif text-3xl font-semibold">Receta y alta</h1>
      <p className="text-sm text-pe-muted">
        {dateLabel} · {vetName}
        {license ? ` · Cédula ${license}` : ''}
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
      {sheet.showAssessment ? (
        <section className="mt-6">
          <h2 className="font-semibold">Evaluación</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{visit.assessment || '—'}</p>
        </section>
      ) : null}
      {sheet.showPlan ? (
        <section className="mt-4">
          <h2 className="font-semibold">Plan / indicaciones</h2>
          <p className="mt-1 whitespace-pre-wrap text-sm">{visit.plan || '—'}</p>
        </section>
      ) : null}
      {sheet.showMeds ? (
        <section className="mt-4">
          <h2 className="font-semibold">Medicamentos</h2>
          <ul className="mt-2 space-y-2 text-sm">
            {meds.map((line) => (
              <li key={line.id}>
                <p className="font-medium">{line.description}</p>
                <p className="text-pe-muted">{line.directions?.trim() || 'Según indicación del médico.'}</p>
              </li>
            ))}
            {meds.length === 0 ? <li>Sin medicamentos recetados.</li> : null}
          </ul>
        </section>
      ) : null}
      {sheet.showVaccines && (vaccines ?? []).length > 0 ? (
        <section className="mt-4">
          <h2 className="font-semibold">Vacunas aplicadas hoy</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {(vaccines ?? []).map((row) => (
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
        Firma y sello ________________________________
        {vetName ? ` · ${vetName}` : ''}
        {license ? ` · Cédula ${license}` : ''}
      </p>
    </PrintSheet>
  );
}
