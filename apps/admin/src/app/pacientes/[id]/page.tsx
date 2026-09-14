import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatMexicoDateTime } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { PatientHeader } from '@/components/PatientHeader';
import { AdminShell } from '@/components/AdminShell';
import { ClinicalMedia } from '@/components/ClinicalMedia';
import { NewAppointmentForm } from '@/components/NewAppointmentForm';
import { loadClinicSession } from '@/lib/auth';

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

  const [{ data: visits }, { data: vaccines }, { data: weights }, { data: appointments }] = await Promise.all([
    supabase.from('visits').select('id, started_at, status, plan').eq('patient_id', id).order('started_at', { ascending: false }),
    supabase.from('vaccine_records').select('name, applied_on, next_due, lot').eq('patient_id', id).order('applied_on', { ascending: false }),
    supabase.from('weight_logs').select('weight_kg, recorded_at').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(6),
    supabase.from('appointments').select('id, starts_at, status, reason').eq('patient_id', id).order('starts_at', { ascending: false }).limit(8),
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
          />
          <div className="flex flex-wrap gap-2">
            <Link href={`/pacientes/${patient.id}/cartilla`} className="pe-btn-secondary px-3 py-1.5 text-sm">
              Imprimir cartilla
            </Link>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="font-semibold">Consultas</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(visits ?? []).map((visit) => (
                <li key={visit.id}>
                  <Link href={`/consultas/${visit.id}`} className="font-medium text-[#b85c38] underline">
                    {formatMexicoDateTime(visit.started_at)} · {visit.status === 'completed' ? 'Alta' : 'En curso'}
                  </Link>
                  {visit.plan ? <p className="text-slate-500">{visit.plan}</p> : null}
                </li>
              ))}
              {(visits ?? []).length === 0 ? <li className="text-slate-500">Sin consultas aún.</li> : null}
            </ul>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="font-semibold">Cartilla</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(vaccines ?? []).map((row, index) => (
                <li key={`${row.name}-${index}`}>
                  {row.name} · {row.applied_on}
                  {row.next_due ? ` · próxima ${row.next_due}` : ''}
                </li>
              ))}
            </ul>
          </div>
          <ClinicalMedia patientId={patient.id} />
        </section>
        <aside className="space-y-4">
          <NewAppointmentForm patientId={patient.id} branchName={staff.branchName} />
          <div className="pe-glass-card p-4">
            <h2 className="font-semibold">Peso</h2>
            <ul className="mt-2 space-y-1 text-sm text-slate-600">
              {(weights ?? []).map((row) => (
                <li key={row.recorded_at}>
                  {Number(row.weight_kg)} kg · {formatMexicoDateTime(row.recorded_at)}
                </li>
              ))}
            </ul>
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="font-semibold">Citas</h2>
            <ul className="mt-2 space-y-1 text-sm">
              {(appointments ?? []).map((row) => (
                <li key={row.id}>
                  {formatMexicoDateTime(row.starts_at)} · {row.status}
                </li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </AdminShell>
  );
}
