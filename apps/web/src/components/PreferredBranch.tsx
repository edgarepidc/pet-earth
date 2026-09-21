'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { SectionMark } from '@/components/SectionTitle';
import type { PublicBranch } from '@/lib/clinic';

export function PreferredBranch({
  branches,
  currentId,
}: {
  branches: PublicBranch[];
  currentId: string;
}) {
  const router = useRouter();
  const [branchId, setBranchId] = useState(currentId);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const current = branches.find((branch) => branch.id === branchId);

  async function save(nextId: string) {
    setBranchId(nextId);
    setError(null);
    setSaved(false);
    const response = await fetch('/api/account/branch', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId: nextId }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar la sucursal.');
      return;
    }
    setSaved(true);
    router.refresh();
  }

  if (branches.length === 0) return null;

  return (
    <section className="pe-card mt-8 p-5">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <SectionMark name="clinicas" size="sm" />
        Sucursal preferida
      </h2>
      <p className="mt-1 text-sm text-pe-muted">
        Ahí se agendan las citas y se recogen los productos del carrito.
      </p>
      <label className="mt-4 block text-sm">
        Sucursal
        <select
          className="pe-input mt-1"
          value={branchId}
          onChange={(event) => void save(event.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id}>
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      {current ? (
        <p className="mt-3 text-sm text-pe-muted">
          {current.address} · {current.hours}
        </p>
      ) : null}
      {error ? <p className="mt-2 text-sm text-pe-danger">{error}</p> : null}
      {saved ? <p className="mt-2 text-sm text-pe-muted">Sucursal guardada.</p> : null}
    </section>
  );
}
