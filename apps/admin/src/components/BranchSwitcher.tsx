'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

type BranchOption = {
  id: string;
  name: string;
};

export function BranchSwitcher({
  currentBranchId,
  branches,
  inverted = false,
}: {
  currentBranchId: string;
  branches: BranchOption[];
  inverted?: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(currentBranchId);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setSelected(currentBranchId);
  }, [currentBranchId]);

  if (branches.length <= 1) return null;

  async function switchTo(branchId: string) {
    if (branchId === currentBranchId) return;
    setSelected(branchId);
    setBusy(true);
    setError(null);
    const response = await fetch('/api/clinic/branch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ branchId }),
    });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    if (!response.ok) {
      setSelected(currentBranchId);
      setBusy(false);
      setError(payload?.error ?? 'No se pudo cambiar de sucursal.');
      return;
    }
    router.refresh();
    setBusy(false);
  }

  return (
    <div className="min-w-0">
      <label className="block">
        <span
          className={`mb-1 block text-[10px] font-bold uppercase tracking-[0.16em] ${
            inverted ? 'text-pe-sidebar-muted' : 'text-pe-muted'
          }`}
        >
          Sucursal
        </span>
        <select
          className={
            inverted
              ? 'w-full rounded-md border border-white/15 bg-white/5 px-2 py-1.5 text-sm text-white outline-none focus:border-pe-clay'
              : 'pe-input py-1.5 text-sm'
          }
          value={selected}
          disabled={busy}
          aria-label="Sucursal de trabajo"
          onChange={(event) => void switchTo(event.target.value)}
        >
          {branches.map((branch) => (
            <option key={branch.id} value={branch.id} className="text-pe-ink">
              {branch.name}
            </option>
          ))}
        </select>
      </label>
      {error ? <p className={`mt-1 text-xs ${inverted ? 'text-amber-200' : 'text-pe-danger'}`}>{error}</p> : null}
    </div>
  );
}
