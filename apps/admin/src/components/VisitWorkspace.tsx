'use client';

import { useRouter } from 'next/navigation';
import { useMemo, useState } from 'react';

import { PatientHeader } from '@/components/PatientHeader';
import {
  CATALOG_KIND_LABELS,
  formatMoney,
  INVOICE_STATUS_LABELS,
  PAYMENT_METHOD_LABELS,
  type CatalogKind,
  type InvoiceStatus,
  type PaymentMethod,
  type Species,
  splitInvoiceTotals,
} from '@petearth/shared';

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

export function VisitWorkspace({ initial }: { initial: VisitPayload }) {
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
      body: JSON.stringify({ visitId: visit.id, action: 'add-line', catalogItemId: itemId, quantity: 1 }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo agregar el cargo');
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

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
      <section className="space-y-4">
        <PatientHeader
          name={patient?.name ?? 'Paciente'}
          species={(patient?.species as Species) ?? 'other'}
          sex={(patient?.sex as 'male' | 'female' | 'unknown' | null) ?? null}
          breed={patient?.breed}
          birthDate={patient?.birth_date}
          tutorName={client?.full_name}
          tutorPhone={client?.phone}
          alerts={patient?.alerts}
          allergies={patient?.allergies}
          weightKg={visit.weight_kg}
          href={patient?.id ? `/pacientes/${patient.id}` : undefined}
        />
        {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
        <div className="grid gap-3 sm:grid-cols-4">
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
        {(['S — Motivo / tutor', 'O — Examen', 'A — Evaluación', 'P — Plan'] as const).map((label, index) => {
          const value = [subjective, objective, assessment, plan][index];
          const setter = [setSubjective, setObjective, setAssessment, setPlan][index];
          return (
            <label key={label} className="block text-sm font-medium">
              {label}
              <textarea className="pe-input mt-1" value={value} onChange={(e) => setter(e.target.value)} disabled={closed} />
            </label>
          );
        })}
        <label className="block text-sm">
          Control posterior
          <input type="date" className="pe-input mt-1 max-w-xs" value={followup} onChange={(e) => setFollowup(e.target.value)} disabled={closed} />
        </label>
        {!closed ? (
          <button type="button" className="pe-btn-primary px-5 py-2 text-sm" disabled={busy} onClick={complete}>
            Cerrar consulta y generar seguimiento
          </button>
        ) : (
          <p className="text-sm font-medium text-emerald-800">Consulta cerrada. El tutor ya puede ver el alta en su portal.</p>
        )}
      </section>

      <aside className="space-y-4">
        <div className="pe-glass-card p-4">
          <h2 className="font-semibold">Cargos (lo documentado se cobra)</h2>
          <div className="mt-3 flex gap-2">
            <select className="pe-input" value={itemId} onChange={(e) => setItemId(e.target.value)} disabled={closed}>
              {initial.catalog.map((item) => (
                <option key={item.id} value={item.id}>
                  {CATALOG_KIND_LABELS[item.kind]} · {item.name} · {formatMoney(Number(item.unit_price))}
                </option>
              ))}
            </select>
            <button type="button" className="pe-btn-secondary px-3 text-sm" disabled={closed || busy} onClick={addLine}>
              Agregar
            </button>
          </div>
          <ul className="mt-3 space-y-2 text-sm">
            {lines.map((line) => (
              <li key={line.id} className="flex justify-between gap-3">
                <span>
                  {line.description}
                  <span className="block text-xs text-slate-500">{CATALOG_KIND_LABELS[line.kind]}</span>
                </span>
                <span>{formatMoney(Number(line.line_total))}</span>
              </li>
            ))}
          </ul>
          <div className="mt-3 space-y-1 border-t border-slate-100 pt-3 text-sm">
            <p className="flex justify-between">
              <span>Servicios</span>
              <span>{formatMoney(split.services)}</span>
            </p>
            <p className="flex justify-between">
              <span>Medicamentos</span>
              <span>{formatMoney(split.products)}</span>
            </p>
            <p className="flex justify-between font-semibold">
              <span>Total</span>
              <span>{formatMoney(split.total)}</span>
            </p>
            <p className="text-xs text-slate-500">
              Ticket: {invoice ? INVOICE_STATUS_LABELS[invoice.status] : 'sin abrir'}
            </p>
          </div>
          {invoice && invoice.status !== 'paid' ? (
            <div className="mt-3 flex flex-wrap gap-2">
              {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                <button
                  key={method}
                  type="button"
                  className="pe-btn-primary px-3 py-1.5 text-xs"
                  disabled={busy}
                  onClick={() => pay(method)}
                >
                  Cobrar {PAYMENT_METHOD_LABELS[method]}
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="pe-glass-card p-4">
          <h2 className="font-semibold">Vacuna / preventivo</h2>
          <select className="pe-input mt-3" value={vaccineItem} onChange={(e) => setVaccineItem(e.target.value)} disabled={closed}>
            {initial.catalog
              .filter((item) => item.kind === 'product')
              .map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
          </select>
          <input className="pe-input mt-2" placeholder="Lote" value={lot} onChange={(e) => setLot(e.target.value)} disabled={closed} />
          <input type="date" className="pe-input mt-2" value={nextDue} onChange={(e) => setNextDue(e.target.value)} disabled={closed} />
          <button type="button" className="pe-btn-secondary mt-3 px-4 py-2 text-sm" disabled={closed || busy} onClick={applyVaccine}>
            Aplicar y recordar refuerzo
          </button>
          <ul className="mt-3 space-y-1 text-sm text-slate-600">
            {(visit.vaccine_records ?? []).map((row) => (
              <li key={row.id}>
                {row.name} {row.next_due ? `· próxima ${row.next_due}` : ''}
              </li>
            ))}
          </ul>
        </div>
      </aside>
    </div>
  );
}
