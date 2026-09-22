'use client';

import Link from 'next/link';
import { useState } from 'react';

export function ExpedienteLead({
  heading,
  cartillaHref,
  children,
}: {
  heading: React.ReactNode;
  cartillaHref: string;
  children: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-3">
        {heading}
        <div className="flex shrink-0 flex-nowrap items-center gap-2">
          <button
            type="button"
            className={`whitespace-nowrap px-3 py-1.5 text-sm ${
              editing ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'
            }`}
            onClick={() => setEditing((open) => !open)}
          >
            Editar ficha
          </button>
          <Link href={cartillaHref} className="pe-btn-secondary whitespace-nowrap px-3 py-1.5 text-sm">
            Imprimir cartilla
          </Link>
        </div>
      </div>
      {editing ? children : null}
    </div>
  );
}
