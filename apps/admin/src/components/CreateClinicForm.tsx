'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function CreateClinicForm() {
  const router = useRouter();
  const [clinicName, setClinicName] = useState('');
  const [branchName, setBranchName] = useState('Principal');
  const [address, setAddress] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [ownerEmail, setOwnerEmail] = useState('');
  const [ownerPassword, setOwnerPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/platform/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clinicName,
          branchName,
          address,
          ownerName,
          ownerEmail,
          ownerPassword,
        }),
      });
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        organization?: { id: string };
      } | null;
      if (!response.ok || !payload?.organization?.id) {
        setError(payload?.error ?? 'No se pudo crear la veterinaria.');
        return;
      }
      router.push(`/plataforma/${payload.organization.id}`);
      router.refresh();
    } catch {
      setError('No se pudo conectar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={(event) => void handleSubmit(event)} className="pe-panel max-w-xl p-6">
      <p className="pe-kicker">Nueva veterinaria</p>
      <h1 className="mt-2 font-serif text-2xl font-semibold">Alta de clínica</h1>
      <p className="mt-2 text-sm text-[#6b5e55]">
        Crea la organización, la primera sucursal y el usuario dueño. El catálogo arranca con consulta y vacunas.
      </p>

      <label className="mt-6 block text-sm font-medium">
        Nombre de la veterinaria
        <input className="pe-input mt-1" required value={clinicName} onChange={(e) => setClinicName(e.target.value)} />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Primera sucursal
        <input className="pe-input mt-1" required value={branchName} onChange={(e) => setBranchName(e.target.value)} />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Dirección (opcional)
        <input className="pe-input mt-1" value={address} onChange={(e) => setAddress(e.target.value)} />
      </label>

      <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.16em] text-[#6b5e55]">Dueño / owner</p>
      <label className="mt-3 block text-sm font-medium">
        Nombre
        <input className="pe-input mt-1" required value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Correo
        <input
          type="email"
          className="pe-input mt-1"
          required
          autoComplete="off"
          value={ownerEmail}
          onChange={(e) => setOwnerEmail(e.target.value)}
        />
      </label>
      <label className="mt-4 block text-sm font-medium">
        Contraseña inicial
        <input
          type="password"
          className="pe-input mt-1"
          required
          minLength={8}
          autoComplete="new-password"
          value={ownerPassword}
          onChange={(e) => setOwnerPassword(e.target.value)}
        />
      </label>

      {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
      <button type="submit" disabled={loading} className="pe-btn-primary mt-6 px-4 py-2.5 text-sm">
        {loading ? 'Creando…' : 'Crear veterinaria'}
      </button>
    </form>
  );
}
