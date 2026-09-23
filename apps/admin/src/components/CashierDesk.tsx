'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import {
  CFDI_STATUS_LABELS,
  formatMexicoTime,
  formatMoney,
  PAYMENT_METHOD_LABELS,
  type CfdiStatus,
  type PaymentMethod,
} from '@petearth/shared';

import { PageHeading, SectionMark } from '@/components/SectionTitle';

type Invoice = {
  id: string;
  total: number;
  visit_id: string | null;
  cfdi_status?: CfdiStatus;
  cfdi_uuid?: string | null;
  cfdi_error?: string | null;
  clients:
    | { full_name: string; rfc?: string | null; tax_zip?: string | null }
    | { full_name: string; rfc?: string | null; tax_zip?: string | null }[]
    | null;
  visits: { patients: { name: string } | { name: string }[] | null } | { patients: { name: string } | { name: string }[] | null }[] | null;
};

type PaidRow = {
  id: string;
  amount: number;
  method: PaymentMethod;
  paid_at: string;
  invoice_id: string;
  visit_id: string | null;
  clients: { full_name: string } | { full_name: string }[] | null;
  visits: { patients: { name: string } | { name: string }[] | null } | { patients: { name: string } | { name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function CashierDesk({
  invoices,
  paidToday = [],
  cfdiQueue = [],
  branchName,
}: {
  invoices: Invoice[];
  paidToday?: PaidRow[];
  cfdiQueue?: Invoice[];
  branchName?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const openTotal = invoices.reduce((sum, row) => sum + Number(row.total), 0);
  const paidTotal = paidToday.reduce((sum, row) => sum + Number(row.amount), 0);

  async function pay(invoiceId: string, method: PaymentMethod) {
    setBusy(invoiceId + method);
    setError(null);
    setNotice(null);
    const response = await fetch('/api/invoices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, method }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo cobrar');
      return;
    }
    router.refresh();
  }

  async function requestCfdi(invoiceId: string) {
    setBusy(invoiceId + 'cfdi');
    setError(null);
    setNotice(null);
    const response = await fetch('/api/invoices', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ invoiceId, action: 'request-cfdi' }),
    });
    const payload = (await response.json()) as { error?: string; stamped?: boolean; uuid?: string; message?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo pedir el CFDI.');
      return;
    }
    setNotice(payload.stamped && payload.uuid ? 'Factura solicitada y timbrada.' : payload.message ?? 'Pedido de CFDI guardado.');
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <PageHeading
        mark="caja"
        kicker={branchName ? `Recepción · ${branchName}` : 'Recepción'}
        title="Caja"
        description={`Por cobrar ${formatMoney(openTotal)} · cobrado hoy ${formatMoney(paidTotal)}.`}
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {notice ? <p className="pe-card p-3 text-sm">{notice}</p> : null}

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
          <SectionMark name="caja" size="sm" />
          Por cobrar
        </h2>
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="px-3 py-2.5">Paciente</th>
                <th className="px-3 py-2.5">Tutor</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {invoices.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={4}>
                    Nada pendiente{branchName ? ` en ${branchName}` : ''}.
                  </td>
                </tr>
              ) : (
                invoices.map((invoice) => {
                  const client = one(invoice.clients);
                  const visit = one(invoice.visits);
                  const patient = one(visit?.patients ?? null);
                  return (
                    <tr key={invoice.id} className="border-b border-pe-line">
                      <td className="px-3 py-2.5 font-medium">
                        {invoice.visit_id ? (
                          <Link href={`/consultas/${invoice.visit_id}`} className="pe-link">
                            {patient?.name ?? 'Ticket'}
                          </Link>
                        ) : (
                          (patient?.name ?? 'Ticket')
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 text-pe-muted">{client?.full_name ?? 'Tutor'}</td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums font-semibold">{formatMoney(Number(invoice.total))}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex shrink-0 flex-nowrap items-center justify-end gap-2">
                          {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                            <button
                              key={method}
                              type="button"
                              className={
                                method === 'cash'
                                  ? 'pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm'
                                  : 'pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm'
                              }
                              disabled={busy !== null}
                              onClick={() => void pay(invoice.id, method)}
                            >
                              {PAYMENT_METHOD_LABELS[method]}
                            </button>
                          ))}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
          <SectionMark name="informes" size="sm" />
          Cobrado hoy
        </h2>
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="px-3 py-2.5">Hora</th>
                <th className="px-3 py-2.5">Paciente</th>
                <th className="px-3 py-2.5">Tutor</th>
                <th className="px-3 py-2.5">Método</th>
                <th className="px-3 py-2.5 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {paidToday.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={5}>
                    Aún no hay cobros de hoy.
                  </td>
                </tr>
              ) : (
                paidToday.map((row) => {
                  const client = one(row.clients);
                  const visit = one(row.visits);
                  const patient = one(visit?.patients ?? null);
                  return (
                    <tr key={row.id} className="border-b border-pe-line">
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums text-pe-muted">{formatMexicoTime(row.paid_at)}</td>
                      <td className="px-3 py-2.5 font-medium">
                        {row.visit_id ? (
                          <Link href={`/consultas/${row.visit_id}`} className="pe-link">
                            {patient?.name ?? 'Ticket'}
                          </Link>
                        ) : (
                          (patient?.name ?? 'Ticket')
                        )}
                      </td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 text-pe-muted">{client?.full_name ?? 'Tutor'}</td>
                      <td className="px-3 py-2.5 text-pe-muted">{PAYMENT_METHOD_LABELS[row.method]}</td>
                      <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatMoney(Number(row.amount))}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h2 className="mb-2 flex items-center gap-1.5 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
          Solicitar factura
        </h2>
        <p className="mb-2 px-1 text-sm text-pe-muted">Tickets cobrados. Se marca “solicitar”; el UUID llega cuando haya PAC.</p>
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[36rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="px-3 py-2.5">Paciente</th>
                <th className="px-3 py-2.5">Tutor</th>
                <th className="px-3 py-2.5">Estado</th>
                <th className="px-3 py-2.5">Total</th>
                <th className="px-3 py-2.5 text-right"> </th>
              </tr>
            </thead>
            <tbody>
              {cfdiQueue.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={5}>
                    Nada pendiente de solicitar.
                  </td>
                </tr>
              ) : (
                cfdiQueue.map((invoice) => {
                  const client = one(invoice.clients);
                  const visit = one(invoice.visits);
                  const patient = one(visit?.patients ?? null);
                  const status = invoice.cfdi_status ?? 'none';
                  return (
                    <tr key={invoice.id} className="border-b border-pe-line">
                      <td className="px-3 py-2.5 font-medium">{patient?.name ?? 'Ticket'}</td>
                      <td className="max-w-[12rem] truncate px-3 py-2.5 text-pe-muted">{client?.full_name ?? 'Tutor'}</td>
                      <td className="px-3 py-2.5 text-sm text-pe-muted">
                        {CFDI_STATUS_LABELS[status]}
                        {client?.rfc ? ` · ${client.rfc}` : ' · falta RFC'}
                        {invoice.cfdi_error ? <span className="mt-0.5 block text-xs text-pe-clay-700">{invoice.cfdi_error}</span> : null}
                      </td>
                      <td className="whitespace-nowrap px-3 py-2.5 tabular-nums font-semibold">{formatMoney(Number(invoice.total))}</td>
                      <td className="px-3 py-2.5 text-right">
                        <button
                          type="button"
                          className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm"
                          disabled={busy !== null}
                          onClick={() => void requestCfdi(invoice.id)}
                        >
                          {status === 'error' ? 'Reintentar' : 'Solicitar CFDI'}
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
