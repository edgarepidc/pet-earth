'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { PatientHeader } from '@/components/PatientHeader';
import {
  CATALOG_KIND_LABELS,
  canAddVisitLines,
  canEditClinical,
  canTakePayment,
  formatMexicoDate,
  formatMexicoDateTime,
  formatMoney,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type CatalogKind,
  type InvoiceStatus,
  type PaymentMethod,
  type ReminderKind,
  type StaffRole,
  splitInvoiceTotals,
} from '@petearth/shared';

import { ClinicalMedia } from '@/components/ClinicalMedia';
import { DictationButton } from '@/components/DictationButton';
import { ChartCard } from '@/components/SectionTitle';
import { ReminderPill } from '@/components/StatusPill';

type CatalogItem = {
  id: string;
  kind: CatalogKind;
  name: string;
  unit_price: number;
  stock: number | null;
};

type Line = {
  id: string;
  kind: CatalogKind;
  description: string;
  quantity: number;
  unit_price: number;
  line_total: number;
  directions?: string | null;
};

type VisitPayload = {
  visit: {
    id: string;
    status: 'in_progress' | 'completed';
    subjective: string | null;
    objective: string | null;
    assessment: string | null;
    plan: string | null;
    weight_kg: number | null;
    temperature_c: number | null;
    heart_rate: number | null;
    respiratory_rate: number | null;
    followup_at: string | null;
    patients: {
      id?: string;
      name: string;
      species: string;
      breed: string | null;
      sex?: string | null;
      birth_date?: string | null;
      alerts: string | null;
      allergies?: string | null;
    } | null;
    clients: { full_name: string; phone: string | null } | null;
    visit_lines: Line[] | null;
    vaccine_records: { id: string; name: string; lot: string | null; next_due: string | null }[] | null;
  };
  invoice: {
    id: string;
    status: InvoiceStatus;
    services_total: number;
    products_total: number;
    total: number;
    invoice_lines: Line[] | null;
  } | null;
  catalog: CatalogItem[];
};

type PreviousVisit = {
  id: string;
  started_at: string;
  subjective: string | null;
  objective: string | null;
  assessment: string | null;
  plan: string | null;
};

type PendingReminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  due_on: string;
};

export function VisitWorkspace({
  initial,
  clinicName,
  role,
  isPlatformAdmin = false,
  previous = null,
  reminders = [],
}: {
  initial: VisitPayload;
  clinicName: string;
  role: StaffRole;
  isPlatformAdmin?: boolean;
  previous?: PreviousVisit | null;
  reminders?: PendingReminder[];
}) {
  const router = useRouter();
  const canEdit = canEditClinical(role) || isPlatformAdmin;
  const canPay = canTakePayment(role) || isPlatformAdmin;
  const canCharge = canAddVisitLines(role) || isPlatformAdmin;
  const [visit, setVisit] = useState(initial.visit);
  const [invoice, setInvoice] = useState(initial.invoice);
  const [subjective, setSubjective] = useState(visit.subjective ?? '');
  const [objective, setObjective] = useState(visit.objective ?? '');
  const [assessment, setAssessment] = useState(visit.assessment ?? '');
  const [plan, setPlan] = useState(visit.plan ?? '');
  const [weight, setWeight] = useState(visit.weight_kg?.toString() ?? '');
  const [temp, setTemp] = useState(visit.temperature_c?.toString() ?? '');
  const [hr, setHr] = useState(visit.heart_rate?.toString() ?? '');
  const [rr, setRr] = useState(visit.respiratory_rate?.toString() ?? '');
  const [followup, setFollowup] = useState(visit.followup_at ?? '');
  const [itemId, setItemId] = useState(initial.catalog[0]?.id ?? '');
  const [quantity, setQuantity] = useState('1');
  const [directions, setDirections] = useState('');
  const [vaccineItem, setVaccineItem] = useState(
    initial.catalog.find((item) => item.kind === 'product' && item.name.toLowerCase().includes('vacuna'))?.id ?? '',
  );
  const [lot, setLot] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const closed = visit.status === 'completed';
  const clinicalLocked = closed || !canEdit;
  const linesLocked = closed || !canCharge;
  const savedNotes = useRef(notesKey());
  const notesTimer = useRef<number | null>(null);

  function notesKey() {
    return JSON.stringify({
      subjective: subjective.trim() || null,
      objective: objective.trim() || null,
      assessment: assessment.trim() || null,
      plan: plan.trim() || null,
      weight: weight.trim(),
      temp: temp.trim(),
      hr: hr.trim(),
      rr: rr.trim(),
      followup: followup || null,
    });
  }

  function numberOrNull(value: string) {
    const trimmed = value.trim();
    if (!trimmed) return null;
    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  async function persistNotes() {
    if (!canEdit || closed) return;
    const next = notesKey();
    if (next === savedNotes.current) return;
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: visit.id,
        action: 'notes',
        subjective,
        objective,
        assessment,
        plan,
        weightKg: numberOrNull(weight),
        temperatureC: numberOrNull(temp),
        heartRate: numberOrNull(hr) === null ? null : Math.round(numberOrNull(hr) as number),
        respiratoryRate: numberOrNull(rr) === null ? null : Math.round(numberOrNull(rr) as number),
        followupOn: followup || null,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudieron guardar las notas.');
      return;
    }
    savedNotes.current = next;
  }

  async function goPrint(href: string) {
    await persistNotes();
    router.push(href);
  }

  useEffect(() => {
    if (!canEdit || closed) return;
    if (notesTimer.current) window.clearTimeout(notesTimer.current);
    notesTimer.current = window.setTimeout(() => {
      void persistNotes();
    }, 700);
    return () => {
      if (notesTimer.current) window.clearTimeout(notesTimer.current);
    };
    // Persist the floor notes without waiting to close the consult.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subjective, objective, assessment, plan, weight, temp, hr, rr, followup, canEdit, closed]);

  const lines = visit.visit_lines ?? invoice?.invoice_lines ?? [];
  const split = useMemo(
    () => splitInvoiceTotals(lines.map((line) => ({ kind: line.kind, lineTotal: Number(line.line_total) }))),
    [lines],
  );
  const selectedItemId = initial.catalog.some((item) => item.id === itemId) ? itemId : initial.catalog[0]?.id ?? '';

  const soap = [
    { label: 'S — Motivo / tutor', value: subjective, set: setSubjective },
    { label: 'O — Examen', value: objective, set: setObjective },
    { label: 'A — Evaluación', value: assessment, set: setAssessment },
    { label: 'P — Plan', value: plan, set: setPlan },
  ];

  async function refresh() {
    const response = await fetch(`/api/visits?id=${visit.id}`);
    const payload = (await response.json()) as VisitPayload;
    setVisit(payload.visit);
    setInvoice(payload.invoice);
  }

  async function addLine() {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: visit.id,
        action: 'add-line',
        catalogItemId: selectedItemId,
        quantity: Math.max(1, Number(quantity) || 1),
        directions: directions.trim() || undefined,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agregar el cargo');
      return;
    }
    setDirections('');
    setQuantity('1');
    await refresh();
  }

  async function removeLine(lineId: string) {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitId: visit.id, action: 'remove-line', lineId }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo quitar el cargo');
      return;
    }
    await refresh();
  }

  async function applyVaccine() {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: visit.id,
        action: 'vaccine',
        catalogItemId: vaccineItem || null,
        lot,
        nextDue: nextDue || null,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo registrar la vacuna');
      return;
    }
    setLot('');
    await refresh();
  }

  async function complete() {
    setBusy(true);
    setError(null);
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId: visit.id,
        action: 'complete',
        subjective,
        objective,
        assessment,
        plan,
        weightKg: weight ? Number(weight) : null,
        temperatureC: temp ? Number(temp) : null,
        heartRate: hr ? Number(hr) : null,
        respiratoryRate: rr ? Number(rr) : null,
        followupOn: followup || null,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo cerrar la consulta');
      return;
    }
    await refresh();
    router.refresh();
    router.push(`/consultas/${visit.id}/receta`);
  }

  async function pay(method: PaymentMethod) {
    if (!invoice) return;
    setBusy(true);
    setError(null);
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId: invoice.id, method }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo cobrar');
      return;
    }
    await refresh();
  }

  const patient = Array.isArray(visit.patients) ? visit.patients[0] : visit.patients;
  const client = Array.isArray(visit.clients) ? visit.clients[0] : visit.clients;
  const recetaHref = `/consultas/${visit.id}/receta`;
  const cartillaHref = patient?.id ? `/pacientes/${patient.id}/cartilla` : null;

  return (
    <div className="grid min-w-0 gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
      <section className="min-w-0 space-y-4">
        <div className="flex items-end justify-between gap-3">
          <PatientHeader
            boxed={false}
            name={patient?.name ?? 'Paciente'}
            species={patient?.species ?? 'other'}
            sex={(patient?.sex as 'male' | 'female' | 'unknown' | null) ?? null}
            breed={patient?.breed}
            birthDate={patient?.birth_date}
            tutorName={client?.full_name}
            tutorPhone={client?.phone}
            alerts={patient?.alerts}
            allergies={patient?.allergies}
            weightKg={visit.weight_kg}
            href={patient?.id ? `/pacientes/${patient.id}` : undefined}
            clinicName={clinicName}
          />
          <div className="flex shrink-0 flex-nowrap items-center gap-2">
            <button type="button" className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm" onClick={() => void goPrint(recetaHref)}>
              Receta / alta
            </button>
            {cartillaHref ? (
              <button type="button" className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm" onClick={() => void goPrint(cartillaHref)}>
                Cartilla
              </button>
            ) : null}
            {canEdit && !closed ? (
              <button
                type="button"
                className="pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm"
                disabled={busy}
                onClick={() => void complete()}
              >
                Cerrar consulta
              </button>
            ) : null}
            {closed ? <span className="pe-chip-active pe-btn-ghost whitespace-nowrap px-3 py-1.5 text-sm">Alta</span> : null}
          </div>
        </div>
        {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
        {!canEdit && !closed ? (
          <p className="text-sm text-pe-muted">Recepción cobra y agrega productos. El SOAP y la receta los escribe el MVZ.</p>
        ) : null}
        {reminders.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {reminders.map((row) => (
              <li key={row.id} className="flex items-center gap-2 rounded-md border border-pe-line bg-pe-wash px-2 py-1 text-xs">
                <ReminderPill kind={row.kind} />
                <span>
                  {row.title}
                  <span className="ml-1 text-pe-muted">{formatMexicoDate(row.due_on)}</span>
                </span>
              </li>
            ))}
          </ul>
        ) : null}
        {closed ? (
          <p className="text-sm text-pe-muted">
            Consulta cerrada. El tutor ya puede ver el alta en su portal.{' '}
            <button type="button" className="pe-link" onClick={() => void goPrint(recetaHref)}>
              Enviar receta por WhatsApp
            </button>
          </p>
        ) : null}

        <ChartCard mark="pacientes" title="Signos">
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="text-sm">
              Peso (kg)
              <input className="pe-input mt-1" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={clinicalLocked} />
            </label>
            <label className="text-sm">
              Temp (°C)
              <input className="pe-input mt-1" value={temp} onChange={(e) => setTemp(e.target.value)} disabled={clinicalLocked} />
            </label>
            <label className="text-sm">
              FC
              <input className="pe-input mt-1" value={hr} onChange={(e) => setHr(e.target.value)} disabled={clinicalLocked} />
            </label>
            <label className="text-sm">
              FR
              <input className="pe-input mt-1" value={rr} onChange={(e) => setRr(e.target.value)} disabled={clinicalLocked} />
            </label>
          </div>
        </ChartCard>

        {previous ? (
          <ChartCard mark="consulta" title="Última consulta">
            <p className="mt-2 text-xs text-pe-muted">{formatMexicoDateTime(previous.started_at)}</p>
            <dl className="mt-2 space-y-2 text-sm">
              {[
                ['S', previous.subjective],
                ['O', previous.objective],
                ['A', previous.assessment],
                ['P', previous.plan],
              ].map(([label, value]) =>
                value ? (
                  <div key={label}>
                    <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">{label}</dt>
                    <dd className="mt-0.5 whitespace-pre-wrap text-pe-ink">{value}</dd>
                  </div>
                ) : null,
              )}
            </dl>
            {!previous.subjective && !previous.objective && !previous.assessment && !previous.plan ? (
              <p className="mt-2 text-sm text-pe-muted">Sin notas en la consulta anterior.</p>
            ) : null}
            <Link href={`/consultas/${previous.id}`} className="pe-link mt-2 inline-block text-sm">
              Abrir consulta previa
            </Link>
          </ChartCard>
        ) : null}

        <ChartCard mark="consulta" title="SOAP">
          <div className="mt-3 space-y-3">
            {soap.map((field) => (
              <label key={field.label} className="block text-sm font-medium">
                <span className="flex items-center justify-between gap-2">
                  {field.label}
                  <DictationButton
                    disabled={clinicalLocked}
                    onTranscript={(text) => field.set((current) => (current ? `${current} ${text}` : text))}
                  />
                </span>
                <textarea className="pe-input mt-1" value={field.value} onChange={(e) => field.set(e.target.value)} disabled={clinicalLocked} />
              </label>
            ))}
            <label className="block text-sm">
              Control posterior
              <input
                type="date"
                className="pe-input mt-1 max-w-xs"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                disabled={clinicalLocked}
              />
            </label>
          </div>
        </ChartCard>

        {patient?.id ? <ClinicalMedia patientId={patient.id} visitId={visit.id} canUpload={!closed} /> : null}
      </section>

      <aside className="min-w-0 space-y-4">
        <ChartCard mark="caja" title="Cargos">
          <p className="mt-1 text-sm text-pe-muted">Lo que documentas aquí se cobra. La indicación sale en la receta, no el precio.</p>
          <div className="mt-3 grid min-w-0 gap-2">
            <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_3.25rem_auto] items-stretch gap-2">
              <select
                className="pe-input h-10 min-w-0 py-0 text-sm"
                value={selectedItemId}
                onChange={(e) => setItemId(e.target.value)}
                disabled={linesLocked}
                aria-label="Buscar en catálogo"
              >
                {initial.catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {CATALOG_KIND_LABELS[item.kind]} · {item.name} · {formatMoney(Number(item.unit_price))}
                  </option>
                ))}
              </select>
              <input
                className="pe-input h-10 min-w-0 py-0 text-center text-sm tabular-nums"
                inputMode="numeric"
                min={1}
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                disabled={linesLocked}
                aria-label="Cantidad"
              />
              <button
                type="button"
                className="pe-btn-secondary h-10 px-3 text-sm"
                disabled={linesLocked || busy || !selectedItemId}
                onClick={() => void addLine()}
              >
                Agregar
              </button>
            </div>
            <input
              className="pe-input h-10 min-w-0 py-0 text-sm"
              placeholder="Indicación (dosis, vía, días) — para la receta"
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              disabled={clinicalLocked}
            />
          </div>
          <ul className="mt-3 divide-y divide-pe-line text-sm">
            {lines.map((line) => (
              <li key={line.id} className="py-2.5">
                <span className="flex items-start justify-between gap-3">
                  <span>
                    {line.description}
                    <span className="block text-xs text-pe-muted">
                      {CATALOG_KIND_LABELS[line.kind]}
                      {Number(line.quantity) !== 1 ? ` · ${Number(line.quantity)} × ${formatMoney(Number(line.unit_price))}` : ''}
                    </span>
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums">{formatMoney(Number(line.line_total))}</span>
                    {!linesLocked ? (
                      <button
                        type="button"
                        className="text-xs text-pe-muted underline-offset-2 hover:text-pe-ink hover:underline"
                        disabled={busy}
                        onClick={() => void removeLine(line.id)}
                      >
                        Quitar
                      </button>
                    ) : null}
                  </span>
                </span>
                {line.kind === 'product' ? (
                  <ProductLineDirections
                    visitId={visit.id}
                    lineId={line.id}
                    initial={line.directions ?? ''}
                    disabled={busy || clinicalLocked}
                    onError={setError}
                    onSaved={refresh}
                  />
                ) : null}
              </li>
            ))}
            {lines.length === 0 ? <li className="py-2.5 text-pe-muted">Sin cargos aún.</li> : null}
          </ul>
          <div className="mt-1 space-y-1 border-t border-pe-line pt-3 text-sm">
            <p className="flex justify-between">
              <span>Servicios</span>
              <span className="tabular-nums">{formatMoney(split.services)}</span>
            </p>
            <p className="flex justify-between">
              <span>Medicamentos</span>
              <span className="tabular-nums">{formatMoney(split.products)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>Total</span>
              <span className="tabular-nums">{formatMoney(split.total)}</span>
            </p>
            <p className="text-xs text-pe-muted">Ticket: {invoice ? INVOICE_STATUS_LABELS[invoice.status] : 'sin abrir'}</p>
          </div>
          {invoice && invoice.status !== 'paid' && canPay ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  className={method === 'cash' ? 'pe-btn-primary px-3 py-1.5 text-sm' : 'pe-btn-secondary px-3 py-1.5 text-sm'}
                  disabled={busy}
                  onClick={() => void pay(method)}
                >
                  {PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          ) : null}
        </ChartCard>

        <ChartCard mark="cartilla" title="Vacuna">
          <div className="mt-3 grid min-w-0 gap-2">
            <select className="pe-input h-10 min-w-0 py-0" value={vaccineItem} onChange={(e) => setVaccineItem(e.target.value)} disabled={clinicalLocked}>
              {initial.catalog
                .filter((item) => item.kind === 'product')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <div className="grid min-w-0 grid-cols-2 gap-2">
              <input className="pe-input h-10 min-w-0 py-0" placeholder="Lote" value={lot} onChange={(e) => setLot(e.target.value)} disabled={clinicalLocked} />
              <input type="date" className="pe-input h-10 min-w-0 py-0" value={nextDue} onChange={(e) => setNextDue(e.target.value)} disabled={clinicalLocked} />
            </div>
            <button type="button" className="pe-btn-secondary h-10 px-3 text-sm" disabled={clinicalLocked || busy} onClick={() => void applyVaccine()}>
              Aplicar y recordar refuerzo
            </button>
          </div>
          <ul className="mt-3 divide-y divide-pe-line text-sm text-pe-muted">
            {(visit.vaccine_records ?? []).map((row) => (
              <li key={row.id} className="py-2">
                {row.name}
                {row.next_due ? ` · próxima ${row.next_due}` : ''}
              </li>
            ))}
            {(visit.vaccine_records ?? []).length === 0 ? <li className="py-2">Sin vacunas en esta consulta.</li> : null}
          </ul>
        </ChartCard>
      </aside>
    </div>
  );
}

function ProductLineDirections({
  visitId,
  lineId,
  initial,
  disabled,
  onError,
  onSaved,
}: {
  visitId: string;
  lineId: string;
  initial: string;
  disabled: boolean;
  onError: (message: string) => void;
  onSaved: () => Promise<void>;
}) {
  const [value, setValue] = useState(initial);
  const saved = useRef(initial.trim());
  const timer = useRef<number | null>(null);

  async function persist(next = value.trim()) {
    if (next === saved.current) return;
    const response = await fetch('/api/visits', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitId,
        action: 'directions',
        lineId,
        directions: next,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      onError(payload.error ?? 'No se pudo guardar la indicación.');
      return;
    }
    saved.current = next;
    await onSaved();
  }

  return (
    <input
      className="pe-input mt-1 h-8 py-1 text-sm"
      value={value}
      placeholder="Indicación al tutor"
      disabled={disabled}
      onChange={(event) => {
        const next = event.target.value;
        setValue(next);
        if (timer.current) window.clearTimeout(timer.current);
        timer.current = window.setTimeout(() => {
          void persist(next.trim());
        }, 400);
      }}
      onBlur={() => {
        if (timer.current) window.clearTimeout(timer.current);
        void persist();
      }}
    />
  );
}
