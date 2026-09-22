'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useRef, useState } from 'react';

import { PatientHeader } from '@/components/PatientHeader';
import {
  CATALOG_KIND_LABELS,
  formatMoney,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type CatalogKind,
  type InvoiceStatus,
  type PaymentMethod,
  splitInvoiceTotals,
  vaccineWhatsAppText,
  todayMexicoYmd,
} from '@petearth/shared';

import { ClinicalMedia } from '@/components/ClinicalMedia';
import { DictationButton } from '@/components/DictationButton';
import { ChartCard } from '@/components/SectionTitle';
import { WhatsAppLink } from '@/components/WhatsAppLink';

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

export function VisitWorkspace({
  initial,
  clinicName,
}: {
  initial: VisitPayload;
  clinicName: string;
}) {
  const router = useRouter();
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
  const [directions, setDirections] = useState('');
  const [vaccineItem, setVaccineItem] = useState(
    initial.catalog.find((item) => item.kind === 'product' && item.name.toLowerCase().includes('vacuna'))?.id ?? '',
  );
  const [lot, setLot] = useState('');
  const [nextDue, setNextDue] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const closed = visit.status === 'completed';

  const lines = visit.visit_lines ?? invoice?.invoice_lines ?? [];
  const split = useMemo(
    () => splitInvoiceTotals(lines.map((line) => ({ kind: line.kind, lineTotal: Number(line.line_total) }))),
    [lines],
  );

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
        catalogItemId: itemId,
        quantity: 1,
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
      <section className="space-y-4">
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
            <a href={recetaHref} className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm">
              Receta / alta
            </a>
            {cartillaHref ? (
              <a href={cartillaHref} className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm">
                Cartilla
              </a>
            ) : null}
            {!closed ? (
              <button
                type="button"
                className="pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm"
                disabled={busy}
                onClick={() => void complete()}
              >
                Cerrar consulta
              </button>
            ) : (
              <span className="pe-chip-active pe-btn-ghost whitespace-nowrap px-3 py-1.5 text-sm">Alta</span>
            )}
          </div>
        </div>
        {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
        {closed ? (
          <p className="text-sm text-pe-muted">
            Consulta cerrada. El tutor ya puede ver el alta en su portal.
            <WhatsAppLink
              phone={client?.phone}
              className="pe-link ml-2"
              text={vaccineWhatsAppText({
                tutorName: client?.full_name ?? 'tutor',
                patientName: patient?.name ?? 'tu mascota',
                clinicName,
                title: 'el alta y las indicaciones de consulta',
                dueOn: todayMexicoYmd(),
              })}
            >
              WhatsApp al tutor
            </WhatsAppLink>
          </p>
        ) : null}

        <ChartCard mark="pacientes" title="Signos">
          <div className="mt-3 grid gap-3 sm:grid-cols-4">
            <label className="text-sm">
              Peso (kg)
              <input className="pe-input mt-1" value={weight} onChange={(e) => setWeight(e.target.value)} disabled={closed} />
            </label>
            <label className="text-sm">
              Temp (°C)
              <input className="pe-input mt-1" value={temp} onChange={(e) => setTemp(e.target.value)} disabled={closed} />
            </label>
            <label className="text-sm">
              FC
              <input className="pe-input mt-1" value={hr} onChange={(e) => setHr(e.target.value)} disabled={closed} />
            </label>
            <label className="text-sm">
              FR
              <input className="pe-input mt-1" value={rr} onChange={(e) => setRr(e.target.value)} disabled={closed} />
            </label>
          </div>
        </ChartCard>

        <ChartCard mark="consulta" title="SOAP">
          <div className="mt-3 space-y-3">
            {soap.map((field) => (
              <label key={field.label} className="block text-sm font-medium">
                <span className="flex items-center justify-between gap-2">
                  {field.label}
                  <DictationButton
                    disabled={closed}
                    onTranscript={(text) => field.set((current) => (current ? `${current} ${text}` : text))}
                  />
                </span>
                <textarea className="pe-input mt-1" value={field.value} onChange={(e) => field.set(e.target.value)} disabled={closed} />
              </label>
            ))}
            <label className="block text-sm">
              Control posterior
              <input
                type="date"
                className="pe-input mt-1 max-w-xs"
                value={followup}
                onChange={(e) => setFollowup(e.target.value)}
                disabled={closed}
              />
            </label>
          </div>
        </ChartCard>

        {patient?.id ? <ClinicalMedia patientId={patient.id} visitId={visit.id} canUpload={!closed} /> : null}
      </section>

      <aside className="space-y-4">
        <ChartCard mark="caja" title="Cargos">
          <p className="mt-1 text-sm text-pe-muted">Lo que documentas aquí se cobra. La indicación sale en la receta, no el precio.</p>
          <div className="mt-3 grid gap-2">
            <div className="flex gap-2">
              <select className="pe-input" value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={closed}>
                {initial.catalog.map((item) => (
                  <option key={item.id} value={item.id}>
                    {CATALOG_KIND_LABELS[item.kind]} · {item.name} · {formatMoney(Number(item.unit_price))}
                  </option>
                ))}
              </select>
              <button type="button" className="pe-btn-secondary px-3 text-sm" disabled={closed || busy} onClick={() => void addLine()}>
                Agregar
              </button>
            </div>
            <input
              className="pe-input h-8 py-1 text-sm"
              placeholder="Indicación (dosis, vía, días) — para la receta"
              value={directions}
              onChange={(e) => setDirections(e.target.value)}
              disabled={closed}
            />
          </div>
          <ul className="mt-3 divide-y divide-pe-line text-sm">
            {lines.map((line) => (
              <li key={line.id} className="py-2.5">
                <span className="flex justify-between gap-3">
                  <span>
                    {line.description}
                    <span className="block text-xs text-pe-muted">{CATALOG_KIND_LABELS[line.kind]}</span>
                  </span>
                  <span className="tabular-nums">{formatMoney(Number(line.line_total))}</span>
                </span>
                {line.kind === 'product' ? (
                  <ProductLineDirections
                    visitId={visit.id}
                    lineId={line.id}
                    initial={line.directions ?? ''}
                    disabled={busy || closed}
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
          {invoice && invoice.status !== 'paid' ? (
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
          <div className="mt-3 grid gap-2">
            <select className="pe-input" value={vaccineItem} onChange={(e) => setVaccineItem(e.target.value)} disabled={closed}>
              {initial.catalog
                .filter((item) => item.kind === 'product')
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
            </select>
            <input className="pe-input" placeholder="Lote" value={lot} onChange={(e) => setLot(e.target.value)} disabled={closed} />
            <input type="date" className="pe-input" value={nextDue} onChange={(e) => setNextDue(e.target.value)} disabled={closed} />
            <button type="button" className="pe-btn-secondary px-4 py-2 text-sm" disabled={closed || busy} onClick={() => void applyVaccine()}>
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
