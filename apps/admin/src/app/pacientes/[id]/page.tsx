import Link from 'next/link';
import { notFound } from 'next/navigation';

import {
  formatMexicoDateTime,
  patientAgeLabel,
  SEX_LABELS,
  SPECIES_LABELS,
} from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { NewAppointmentForm } from '@/components/NewAppointmentForm';
import { getStaffSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PatientPage({ params }: { params: Promise<{ id: string }> }) {
  const staff = await getStaffSession();
  if (!staff) return null;
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
          <div>
            <p className="text-xs uppercase tracking-wide text-slate-500">Ficha</p>
            <h1 className="text-2xl font-bold">{patient.name}</h1>
            <p className="text-sm text-slate-500">
              {SPECIES_LABELS[patient.species]} · {SEX_LABELS[patient.sex]}
              {patient.breed ? ` · ${patient.breed}` : ''}
              {patientAgeLabel(patient.birth_date) ? ` · ${patientAgeLabel(patient.birth_date)}` : ''}
            </p>
            <p className="text-sm text-slate-500">Tutor: {client?.full_name}</p>
            {patient.alerts ? <p className="mt-2 text-sm text-amber-800">Alerta: {patient.alerts}</p> : null}
            {patient.allergies ? <p className="text-sm text-red-700">Alergias: {patient.allergies}</p> : null}
          </div>
          <div className="pe-glass-card p-4">
            <h2 className="font-semibold">Consultas</h2>
            <ul className="mt-3 space-y-2 text-sm">
              {(visits ?? []).map((visit) => (
                <li key={visit.id}>
                  <Link href={`/consultas/${visit.id}`} className="font-medium text-[#245a4c] underline">
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
        </section>
        <aside className="space-y-4">
          <NewAppointmentForm patientId={patient.id} />
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
