'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function EnterClinicButton({
  organizationId,
  branchId,
  label = 'Abrir en el panel',
}: {
  organizationId: string;
  branchId: string;
  label?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function enter() {
    setLoading(true);
    const response = await fetch('/api/platform/enter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ organizationId, branchId }),
    });
    const payload = (await response.json().catch(() => null)) as { redirect?: string; error?: string } | null;
    if (!response.ok) {
      setLoading(false);
      window.alert(payload?.error ?? 'No se pudo entrar a la clínica.');
      return;
    }
    router.push(payload?.redirect ?? '/');
    router.refresh();
  }

  return (
    <button type="button" className="pe-btn-primary px-3 py-1.5 text-sm" disabled={loading} onClick={() => void enter()}>
      {loading ? 'Entrando…' : label}
    </button>
  );
}
