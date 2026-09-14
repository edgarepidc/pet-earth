'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { formatMoney, PAYMENT_METHOD_LABELS, type PaymentMethod } from '@petearth/shared';

type Invoice = {
  id: string;
  total: number;
  visit_id: string | null;
  clients: { full_name: string } | { full_name: string }[] | null;
  visits: { patients: { name: string } | { name: string }[] | null } | { patients: { name: string } | { name: string }[] | null }[] | null;
};

function one<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? value[0] ?? null : value;
}

export function CashierDesk({ invoices }: { invoices: Invoice[] }) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function pay(invoiceId: string, method: PaymentMethod) {
    setBusy(invoiceId + method);
    setError(null);
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

  return (
    <section className="space-y-4">
      <div>
        <p className="pe-kicker">Recepción</p>
        <h1 className="font-serif text-2xl font-semibold">Caja</h1>
        <p className="text-sm text-[#6b5e55]">Tickets abiertos. Cobrar sin abrir el SOAP.</p>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {invoices.length === 0 ? (
        <div className="pe-card p-6 text-sm text-[#6b5e55]">No hay tickets por cobrar.</div>
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
    </section>
  );
}
