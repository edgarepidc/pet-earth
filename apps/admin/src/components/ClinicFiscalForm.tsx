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
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setBusy(true);
    const response = await fetch('/api/clinic/fiscal', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rfc: rfcValue, razonSocial: name, regimen: reg, codigoPostal: zip }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar.');
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void save(event)} className="mt-2 grid gap-1.5 sm:grid-cols-2">
      <p className="text-xs text-pe-muted sm:col-span-2">
        {pacReady
          ? 'PAC conectado. Al pedir CFDI se intenta timbrar.'
          : 'Sin PAC aún. El UUID llega con FACTURAPI_SECRET_KEY.'}
      </p>
      <input className="pe-input h-8 py-1 text-sm" placeholder="RFC de la clínica" value={rfcValue} onChange={(e) => setRfcValue(e.target.value)} />
      <input className="pe-input h-8 py-1 text-sm" placeholder="Razón social" value={name} onChange={(e) => setName(e.target.value)} />
      <input className="pe-input h-8 py-1 text-sm" placeholder="Régimen (612)" value={reg} onChange={(e) => setReg(e.target.value)} />
      <input className="pe-input h-8 py-1 text-sm" placeholder="C.P. fiscal" value={zip} onChange={(e) => setZip(e.target.value)} />
      {error ? <p className="text-sm text-pe-danger sm:col-span-2">{error}</p> : null}
      <button type="submit" className="pe-btn-primary justify-self-start px-3 py-1.5 text-sm" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar emisor'}
      </button>
    </form>
  );
}
