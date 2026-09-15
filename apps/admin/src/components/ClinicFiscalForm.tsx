'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ClinicFiscalForm({
  rfc,
  razonSocial,
  regimen,
  codigoPostal,
  pacReady = false,
}: {
  rfc?: string | null;
  razonSocial?: string | null;
  regimen?: string | null;
  codigoPostal?: string | null;
  pacReady?: boolean;
}) {
  const router = useRouter();
  const [rfcValue, setRfcValue] = useState(rfc ?? '');
  const [name, setName] = useState(razonSocial ?? '');
  const [reg, setReg] = useState(regimen ?? '612');
  const [zip, setZip] = useState(codigoPostal ?? '');
  const [error, setError] = useState<string | null>(null);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/clinic/fiscal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc: rfcValue, razonSocial: name, regimen: reg, codigoPostal: zip }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void save(event)} className="pe-card mt-4 grid gap-3 p-4 md:grid-cols-2">
      <h2 className="font-semibold md:col-span-2">Emisor CFDI 4.0</h2>
      <p className="text-sm text-pe-muted md:col-span-2">
        {pacReady
          ? 'PAC conectado. Al pedir CFDI de un ticket cobrado se intenta timbrar y guardar el UUID.'
          : 'Sin PAC aún (no hay Facturapi en Marketplace). Se guarda el pedido; el UUID llega cuando pongas FACTURAPI_SECRET_KEY.'}
      </p>
      <input className="pe-input" placeholder="RFC de la clínica" value={rfcValue} onChange={(e) => setRfcValue(e.target.value)} />
      <input className="pe-input" placeholder="Razón social" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="pe-input" placeholder="Régimen (612)" value={reg} onChange={(e) => setReg(e.target.value)} />
      <input className="pe-input" placeholder="C.P. del domicilio fiscal" value={zip} onChange={(e) => setZip(e.target.value)} />
      {error ? <p className="text-sm text-pe-danger md:col-span-2">{error}</p> : null}
      <button type="submit" className="pe-btn-primary px-4 py-2 text-sm">
        Guardar emisor
      </button>
    </form>
  );
}
