'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CFDI_STATUS_LABELS, formatMoney, PAYMENT_METHOD_LABELS, type CfdiStatus, type PaymentMethod } from '@petearth/shared';

import { ChartCard, PageHeading } from '@/components/SectionTitle';

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

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function CashierDesk({
  invoices,
  cfdiQueue = [],
  branchName,
}: {
  invoices: Invoice[];
  cfdiQueue?: Invoice[];
  branchName?: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

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
        description="Tickets abiertos de esta sucursal. El CFDI se pide después de cobrar."
      />
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {notice ? <p className="pe-card p-3 text-sm">{notice}</p> : null}

      <ChartCard mark="caja" title="Por cobrar">
        {invoices.length === 0 ? (
          <p className="mt-3 text-sm text-pe-muted">Nada pendiente{branchName ? ` en ${branchName}` : ''}.</p>
        ) : (
          <ul className="mt-1 divide-y divide-pe-line">
            {invoices.map((invoice) => {
              const client = one(invoice.clients);
              const visit = one(invoice.visits);
              const patient = one(visit?.patients ?? null);
              return (
                <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{patient?.name ?? 'Ticket'}</span>
                    <span className="ml-2 text-sm text-pe-muted">{client?.full_name ?? 'Tutor'}</span>
                    {invoice.visit_id ? (
                      <>
                        {' · '}
                        <Link href={`/consultas/${invoice.visit_id}`} className="pe-link text-sm">
                          Ver consulta
                        </Link>
                      </>
                    ) : null}
                  </span>
                  <span className="flex shrink-0 flex-wrap items-center gap-2">
                    <span className="tabular-nums text-sm font-semibold">{formatMoney(Number(invoice.total))}</span>
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
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>

      <ChartCard mark="informes" title="Solicitar factura">
        <p className="mt-1 text-sm text-pe-muted">Tickets cobrados. Se marca “solicitar”; el UUID llega cuando haya PAC.</p>
        {cfdiQueue.length === 0 ? (
          <p className="mt-3 text-sm text-pe-muted">Nada pendiente de solicitar.</p>
        ) : (
          <ul className="mt-1 divide-y divide-pe-line">
            {cfdiQueue.map((invoice) => {
              const client = one(invoice.clients);
              const visit = one(invoice.visits);
              const patient = one(visit?.patients ?? null);
              const status = invoice.cfdi_status ?? 'none';
              return (
                <li key={invoice.id} className="flex flex-wrap items-center justify-between gap-3 py-2.5">
                  <span className="min-w-0">
                    <span className="font-medium">{patient?.name ?? 'Ticket'}</span>
                    <span className="ml-2 text-sm text-pe-muted">{client?.full_name ?? 'Tutor'}</span>
                    <span className="mt-0.5 block text-xs text-pe-muted">
                      {CFDI_STATUS_LABELS[status]}
                      {client?.rfc ? ` · ${client.rfc}` : ' · falta RFC'}
                    </span>
                    {invoice.cfdi_error ? <span className="block text-xs text-pe-clay-700">{invoice.cfdi_error}</span> : null}
                  </span>
                  <span className="flex shrink-0 items-center gap-2">
                    <span className="tabular-nums text-sm font-semibold">{formatMoney(Number(invoice.total))}</span>
                    <button
                      type="button"
                      className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm"
                      disabled={busy !== null}
                      onClick={() => void requestCfdi(invoice.id)}
                    >
                      {status === 'error' ? 'Reintentar' : 'Solicitar CFDI'}
                    </button>
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </ChartCard>
    </section>
  );
}
