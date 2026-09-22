'use client';

import { Suspense } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import type { ClinicVet } from '@/components/AppointmentPeek';

export function matchesVetFilter(vetId: string | null | undefined, filter: string | null): boolean {
  if (!filter) return true;
  if (filter === 'none') return !vetId;
  return vetId === filter;
}

function VetFilterSelect({ vets }: { vets: ClinicVet[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const value = params.get('vet') ?? '';

  function setVet(next: string) {
    const search = new URLSearchParams(params.toString());
    if (next) search.set('vet', next);
    else search.delete('vet');
    const query = search.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  return (
    <label className="block min-w-[11rem] text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
      Veterinario
      <select
        className="pe-input mt-1 py-1.5 text-sm font-medium normal-case tracking-normal"
        value={value}
        onChange={(event) => setVet(event.target.value)}
      >
        <option value="">Todos</option>
        {vets.map((vet) => (
          <option key={vet.id} value={vet.id}>
            {vet.full_name}
          </option>
        ))}
        <option value="none">Sin asignar</option>
      </select>
    </label>
  );
}

export function VetFilter({ vets }: { vets: ClinicVet[] }) {
  if (vets.length === 0) return null;
  return (
    <Suspense
      fallback={
        <label className="block min-w-[11rem] text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
          Veterinario
          <select className="pe-input mt-1 py-1.5 text-sm font-medium normal-case tracking-normal" disabled value="">
            <option value="">Todos</option>
          </select>
        </label>
      }
    >
      <VetFilterSelect vets={vets} />
    </Suspense>
  );
}
