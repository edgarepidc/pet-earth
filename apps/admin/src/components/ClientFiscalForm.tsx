'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CFDI_USO_LABELS, CFDI_USOS, type CfdiUso } from '@petearth/shared';

export function ClientFiscalForm({
  clientId,
  rfc,
  taxZip,
  usoCfdi,
  fiscalName,
}: {
  clientId: string;
  rfc: string | null;
  taxZip: string | null;
  usoCfdi: string | null;
  fiscalName: string | null;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [rfcValue, setRfcValue] = useState(rfc ?? '');
  const [zip, setZip] = useState(taxZip ?? '');
  const [uso, setUso] = useState<CfdiUso>((usoCfdi as CfdiUso) || 'G03');
  const [name, setName] = useState(fiscalName ?? '');
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/clients', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: clientId,
        rfc: rfcValue,
        taxZip: zip,
        usoCfdi: uso,
        fiscalName: name,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    setOpen(false);
    router.refresh();
  }

  return (
    <div className="mt-2">
      <button type="button" className="pe-btn-ghost px-3 py-1.5 text-xs" onClick={() => setOpen((value) => !value)}>
        Datos fiscales CFDI
      </button>
      {open ? (
        <form onSubmit={(event) => void save(event)} className="mt-2 grid gap-2 md:grid-cols-2">
          <input className="pe-input" placeholder="RFC" value={rfcValue} onChange={(e) => setRfcValue(e.target.value)} />
          <input className="pe-input" placeholder="C.P. fiscal" value={zip} onChange={(e) => setZip(e.target.value)} />
          <input className="pe-input" placeholder="Razón social" value={name} onChange={(e) => setName(e.target.value)} />
          <select className="pe-input" value={uso} onChange={(e) => setUso(e.target.value as CfdiUso)}>
            {CFDI_USOS.map((item) => (
              <option key={item} value={item}>
                {CFDI_USO_LABELS[item]}
              </option>
            ))}
          </select>
          {error ? <p className="text-sm text-pe-danger md:col-span-2">{error}</p> : null}
          <button type="submit" className="pe-btn-secondary px-3 py-1.5 text-sm">
            Guardar fiscales
          </button>
        </form>
      ) : null}
    </div>
  );
}
