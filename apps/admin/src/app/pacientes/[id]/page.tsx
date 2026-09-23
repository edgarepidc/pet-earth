import Link from 'next/link';
import { notFound } from 'next/navigation';

import { formatMexicoDate, formatMexicoDateTime, todayMexicoYmd, type AppointmentStatus, type ReminderKind } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { ClinicalMedia } from '@/components/ClinicalMedia';
import { ExpedienteLead } from '@/components/ExpedienteLead';
import { NewAppointmentForm } from '@/components/NewAppointmentForm';
import { PatientFileForm } from '@/components/PatientFileForm';
import { PatientHeader } from '@/components/PatientHeader';
import { ChartCard } from '@/components/SectionTitle';
import { StatusPill, ReminderPill } from '@/components/StatusPill';
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

  const [{ data: visits }, { data: vaccines }, { data: weights }, { data: appointments }, { data: reminders }, speciesOptions] =
    await Promise.all([
      supabase
        .from('visits')
        .select('id, started_at, status, subjective, objective, assessment, plan')
        .eq('patient_id', id)
        .order('started_at', { ascending: false }),
      supabase.from('vaccine_records').select('name, applied_on, next_due, lot').eq('patient_id', id).order('applied_on', { ascending: false }),
      supabase.from('weight_logs').select('weight_kg, recorded_at').eq('patient_id', id).order('recorded_at', { ascending: false }).limit(6),
      supabase.from('appointments').select('id, starts_at, status, reason').eq('patient_id', id).order('starts_at', { ascending: false }).limit(8),
      supabase
        .from('reminders')
        .select('id, kind, title, due_on')
        .eq('patient_id', id)
        .eq('status', 'pending')
        .order('due_on'),
      loadSpeciesOptions(staff.organizationId),
    ]);
  const lastVisit = visits?.[0] ?? null;

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
          {lastVisit ? (
            <ChartCard mark="consulta" title="Último SOAP">
              <p className="mt-2 text-xs text-pe-muted">
                {formatMexicoDateTime(lastVisit.started_at)} · {lastVisit.status === 'completed' ? 'Alta' : 'En curso'}
              </p>
              <dl className="mt-2 space-y-2 text-sm">
                {[
                  ['S', lastVisit.subjective],
                  ['O', lastVisit.objective],
                  ['A', lastVisit.assessment],
                  ['P', lastVisit.plan],
                ].map(([label, value]) =>
                  value ? (
                    <div key={label}>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">{label}</dt>
                      <dd className="mt-0.5 whitespace-pre-wrap">{value}</dd>
                    </div>
                  ) : null,
                )}
              </dl>
              {!lastVisit.subjective && !lastVisit.objective && !lastVisit.assessment && !lastVisit.plan ? (
                <p className="mt-2 text-sm text-pe-muted">Sin notas aún.</p>
              ) : null}
              <Link href={`/consultas/${lastVisit.id}`} className="pe-link mt-2 inline-block text-sm">
                Abrir consulta
              </Link>
            </ChartCard>
          ) : null}
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
          <ChartCard mark="seguimiento" title="Recordatorios">
            <ul className="mt-3 divide-y divide-pe-line text-sm">
              {(reminders ?? []).map((row) => (
                <li key={row.id} className="flex flex-wrap items-baseline justify-between gap-2 py-2.5">
                  <span>
                    <ReminderPill kind={row.kind as ReminderKind} />
                    <span className="ml-2">{row.title}</span>
                  </span>
                  <span className="tabular-nums text-pe-muted">{formatMexicoDate(row.due_on)}</span>
                </li>
              ))}
              {(reminders ?? []).length === 0 ? <li className="py-2.5 text-pe-muted">Sin pendientes.</li> : null}
            </ul>
          </ChartCard>
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
                  <Link href={`/agenda?view=day&start=${todayMexicoYmd(new Date(row.starts_at))}`} className="pe-link">
                    {formatMexicoDateTime(row.starts_at)}
                    {row.reason?.trim() ? <span className="font-normal text-pe-muted"> · {row.reason}</span> : null}
                  </Link>
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
