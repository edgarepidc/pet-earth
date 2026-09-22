import Link from 'next/link';
import { notFound } from 'next/navigation';

import { APPOINTMENT_STATUS_LABELS, formatMexicoDateTime, type AppointmentStatus } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { ClinicalMedia } from '@/components/ClinicalMedia';
import { ExpedienteLead } from '@/components/ExpedienteLead';
import { NewAppointmentForm } from '@/components/NewAppointmentForm';
import { PatientFileForm } from '@/components/PatientFileForm';
import { PatientHeader } from '@/components/PatientHeader';
import { ChartCard } from '@/components/SectionTitle';
import { StatusPill } from '@/components/StatusPill';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesOptions } from '@/lib/clinicLists';

export const dynamic = 'force-dynamic';

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await loadClinicSession();
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: patient } = await supabase
    .from('patients')
    .select('*, clients(full_name, phone, email)')
    .eq('id', id)
    .eq('organization_id', staff.organizationId)
    .maybeSingle();
  if (!patient) notFound();

  const [{ data: visits }, { data: vaccines }, { data: weights }, { data: appointments }, speciesOptions] = await Promise.all([
    supabase.from('visits').select('id, started_at, status, plan').eq('patient_id', id).order('started_at', { ascending: false }),
    supabase.from('vaccine_records').select('name, applied_on, next_due, lot').eq('patient_id', id).order('applied_on', { ascending: false }),
    supabase.from('weight_logs').select('weight_kg, recorded_at').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(6),
    supabase.from('appointments').select('id, starts_at, status, reason').eq('patient_id', id).order('starts_at', { ascending: false }).limit(8),
    loadSpeciesOptions(staff.organizationId),
  ]);

  const client = Array.isArray(patient.clients) ? patient.clients[0] : patient.clients;
  const latestWeight = weights?.[0]?.weight_kg != null ? Number(weights[0].weight_kg) : null;

  return (
    <AdminShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <ExpedienteLead cartillaHref={`/pacientes/${patient.id}/cartilla`} heading={
            <PatientHeader
              boxed={false}
              name={patient.name}
              species={patient.species}
              sex={patient.sex}
              breed={patient.breed}
              birthDate={patient.birth_date}
              tutorName={client?.full_name}
              tutorPhone={client?.phone}
              alerts={patient.alerts}
              allergies={patient.allergies}
              weightKg={latestWeight}
              microchip={patient.microchip}
              clinicName={staff.organizationName}
              speciesOptions={speciesOptions}
            />
          }>
            <PatientFileForm
              key={patient.updated_at}
              patientId={patient.id}
              name={patient.name}
              species={patient.species}
              breed={patient.breed}
              sex={patient.sex}
              neutered={patient.neutered}
              birthDate={patient.birth_date}
              microchip={patient.microchip}
              color={patient.color}
              allergies={patient.allergies}
              alerts={patient.alerts}
              isActive={patient.is_active}
              speciesOptions={speciesOptions}
            />
          </ExpedienteLead>
          {!patient.is_active ? <p className="pe-callout-amber p-3 text-sm">Esta mascota está dada de baja.</p> : null}
          <ChartCard mark="consulta" title="Consultas">
            <ul className="mt-3 divide-y divide-pe-line text-sm">
              {(visits ?? []).map((visit) => (
                <li key={visit.id} className="py-2.5">
                  <Link href={`/consultas/${visit.id}`} className="pe-link">
                    {formatMexicoDateTime(visit.started_at)} · {visit.status === 'completed' ? 'Alta' : 'En curso'}
                  </Link>
                  {visit.plan ? <p className="mt-0.5 text-pe-muted">{visit.plan}</p> : null}
                </li>
              ))}
              {(visits ?? []).length === 0 ? <li className="py-2.5 text-pe-muted">Sin consultas aún.</li> : null}
            </ul>
          </ChartCard>
          <ChartCard mark="cartilla" title="Cartilla">
            <ul className="mt-3 divide-y divide-pe-line text-sm">
              {(vaccines ?? []).map((row, index) => (
                <li key={`${row.name}-${index}`} className="py-2.5">
                  {row.name} · {row.applied_on}
                  {row.next_due ? ` · próxima ${row.next_due}` : ''}
                </li>
              ))}
              {(vaccines ?? []).length === 0 ? <li className="py-2.5 text-pe-muted">Sin vacunas en cartilla.</li> : null}
            </ul>
          </ChartCard>
          <ClinicalMedia patientId={patient.id} />
        </section>
        <aside className="space-y-4">
          <ChartCard mark="agenda" title="Citas">
            <NewAppointmentForm
              patientId={patient.id}
              branchName={staff.branchName}
              openMin={staff.branchOpenMin}
              closeMin={staff.branchCloseMin}
            />
            <ul className="mt-3 divide-y divide-pe-line text-sm">
              {(appointments ?? []).map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span>
                    {formatMexicoDateTime(row.starts_at)}
                    {row.reason?.trim() ? <span className="text-pe-muted"> · {row.reason}</span> : null}
                  </span>
                  <StatusPill status={row.status as AppointmentStatus} />
                </li>
              ))}
              {(appointments ?? []).length === 0 ? <li className="py-2.5 text-pe-muted">Sin citas aún.</li> : null}
            </ul>
          </ChartCard>
          <ChartCard mark="pacientes" title="Peso">
            <ul className="mt-3 divide-y divide-pe-line text-sm text-pe-muted">
              {(weights ?? []).map((row) => (
                <li key={row.recorded_at} className="py-2">
                  {Number(row.weight_kg)} kg · {formatMexicoDateTime(row.recorded_at)}
                </li>
              ))}
              {(weights ?? []).length === 0 ? <li className="py-2">Sin pesos registrados.</li> : null}
            </ul>
          </ChartCard>
        </aside>
      </div>
    </AdminShell>
  );
}
