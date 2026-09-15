'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CFDI_STATUS_LABELS, formatMoney, PAYMENT_METHOD_LABELS, type CfdiStatus, type PaymentMethod } from '@petearth/shared';

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
      setError(payload.error ?? 'No se pudo timbrar.');
      return;
    }
    setNotice(
      payload.stamped && payload.uuid
        ? `Timbrada. UUID ${payload.uuid}`
        : payload.message ?? 'Pedido de CFDI guardado.',
    );
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="pe-kicker">Recepción{branchName ? ` · ${branchName}` : ''}</p>
        <h1 className="font-serif text-2xl font-semibold">Caja</h1>
        <p className="text-sm text-[#6b5e55]">Tickets abiertos de esta sucursal. El CFDI se pide después de cobrar.</p>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {notice ? <p className="pe-card p-3 text-sm">{notice}</p> : null}
      {invoices.length === 0 ? (
        <div className="pe-card p-6 text-sm text-[#6b5e55]">
          No hay tickets por cobrar{branchName ? ` en ${branchName}` : ''}.
        </div>
      ) : (
        <ul className="space-y-3">
          {invoices.map((invoice) => {
            const client = one(invoice.clients);
            const visit = one(invoice.visits);
            const patient = one(visit?.patients ?? null);
            return (
              <li key={invoice.id} className="pe-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{patient?.name ?? 'Consulta'}</p>
                    <p className="text-sm text-[#6b5e55]">{client?.full_name ?? 'Tutor'}</p>
                    {invoice.visit_id ? (
                      <Link href={`/consultas/${invoice.visit_id}`} className="text-sm text-[#b85c38] underline">
                        Ver consulta
                      </Link>
                    ) : null}
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(Number(invoice.total))}</p>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {(Object.keys(PAYMENT_METHOD_LABELS) as PaymentMethod[]).map((method) => (
                    <button
                      key={method}
                      type="button"
                      className="pe-btn-primary px-3 py-1.5 text-sm"
                      disabled={busy !== null}
                      onClick={() => pay(invoice.id, method)}
                    >
                      {PAYMENT_METHOD_LABELS[method]}
                    </button>
                  ))}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <div>
        <h2 className="font-serif text-xl font-semibold">CFDI 4.0</h2>
        <p className="text-sm text-[#6b5e55]">Tickets cobrados de esta sucursal, pendientes de UUID.</p>
      </div>
      {cfdiQueue.length === 0 ? (
        <div className="pe-card p-4 text-sm text-[#6b5e55]">Nada pendiente de timbrar.</div>
      ) : (
        <ul className="space-y-3">
          {cfdiQueue.map((invoice) => {
            const client = one(invoice.clients);
            const visit = one(invoice.visits);
            const patient = one(visit?.patients ?? null);
            return (
              <li key={invoice.id} className="pe-card p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{patient?.name ?? 'Consulta'}</p>
                    <p className="text-sm text-[#6b5e55]">{client?.full_name ?? 'Tutor'}</p>
                    <p className="text-xs text-[#6b5e55]">
                      {CFDI_STATUS_LABELS[invoice.cfdi_status ?? 'none']}
                      {client?.rfc ? ` · ${client.rfc}` : ' · falta RFC'}
                    </p>
                    {invoice.cfdi_error ? <p className="text-xs text-[#8f4328]">{invoice.cfdi_error}</p> : null}
                  </div>
                  <p className="font-semibold tabular-nums">{formatMoney(Number(invoice.total))}</p>
                </div>
                <button
                  type="button"
                  className="pe-btn-secondary mt-3 px-3 py-1.5 text-sm"
                  disabled={busy !== null}
                  onClick={() => requestCfdi(invoice.id)}
                >
                  {invoice.cfdi_status === 'error' ? 'Reintentar timbrado' : 'Timbrar CFDI 4.0'}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
