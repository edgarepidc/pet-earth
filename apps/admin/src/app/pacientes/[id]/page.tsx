import Link from 'next/link';
import { notFound } from 'next/navigation';

import { APPOINTMENT_STATUS_LABELS, formatMexicoDateTime, type AppointmentStatus } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { ClinicalMedia } from '@/components/ClinicalMedia';
import { NewAppointmentForm } from '@/components/NewAppointmentForm';
import { PatientFileForm } from '@/components/PatientFileForm';
import { PatientHeader } from '@/components/PatientHeader';
import { SectionMark } from '@/components/SectionTitle';
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

  return (
    <AdminShell>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="space-y-4">
          <PatientHeader
            name={patient.name}
            species={patient.species}
            sex={patient.sex}
            breed={patient.breed}
            birthDate={patient.birth_date}
            tutorName={client?.full_name}
            tutorPhone={client?.phone}
            alerts={patient.alerts}
            allergies={patient.allergies}
            clinicName={staff.organizationName}
            speciesOptions={speciesOptions}
          />
          {!patient.is_active ? <p className="pe-callout-amber p-3 text-sm">Esta mascota está dada de baja.</p> : null}
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
          <div className="flex flex-wrap gap-2">
            <Link href={`/pacientes/${patient.id}/cartilla`} className="pe-btn-secondary px-3 py-1.5 text-sm">
              Imprimir cartilla
            </Link>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionMark name="consulta" size="sm" />
              Consultas
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(visits ?? []).map((visit) => (
                <li key={visit.id}>
                  <Link href={`/consultas/${visit.id}`} className="pe-link">
                    {formatMexicoDateTime(visit.started_at)} · {visit.status === 'completed' ? 'Alta' : 'En curso'}
                  </Link>
                  {visit.plan ? <p className="text-pe-muted">{visit.plan}</p> : null}
                </li>
              ))}
              {(visits ?? []).length === 0 ? <li className="text-pe-muted">Sin consultas aún.</li> : null}
            </ul>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionMark name="cartilla" size="sm" />
              Cartilla
            </h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(vaccines ?? []).map((row, index) => (
                <li key={`${row.name}-${index}`}>
                  {row.name} · {row.applied_on}
                  {row.next_due ? ` · próxima ${row.next_due}` : ''}
                </li>
              ))}
              {(vaccines ?? []).length === 0 ? <li className="text-pe-muted">Sin vacunas en cartilla.</li> : null}
            </ul>
          </div>
          <ClinicalMedia patientId={patient.id} />
        </section>
        <aside className="space-y-4">
          <NewAppointmentForm patientId={patient.id} branchName={staff.branchName} />
          <div className="pe-glass-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionMark name="pacientes" size="sm" />
              Peso
            </h2>
            <ul className="mt-2 space-y-1 text-sm text-pe-muted">
              {(weights ?? []).map((row) => (
                <li key={row.recorded_at}>
                  {Number(row.weight_kg)} kg · {formatMexicoDateTime(row.recorded_at)}
                </li>
              ))}
              {(weights ?? []).length === 0 ? <li>Sin pesos registrados.</li> : null}
            </ul>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="flex items-center gap-2 font-semibold">
              <SectionMark name="agenda" size="sm" />
              Citas
            </h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(appointments ?? []).map((row) => (
                <li key={row.id}>
                  {formatMexicoDateTime(row.starts_at)} ·{' '}
                  {APPOINTMENT_STATUS_LABELS[row.status as AppointmentStatus] ?? row.status}
                  {row.reason?.trim() ? ` · ${row.reason}` : ''}
                </li>
              ))}
              {(appointments ?? []).length === 0 ? <li className="text-pe-muted">Sin citas aún.</li> : null}
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
