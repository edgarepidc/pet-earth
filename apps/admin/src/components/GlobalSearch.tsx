'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type Hit = { href: string; title: string; subtitle: string };

export function GlobalSearch() {
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      return;
    }
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!response.ok) return;
      const payload = (await response.json()) as { hits?: Hit[] };
      setHits(payload.hits ?? []);
      setOpen(true);
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const empty = useMemo(() => query.trim().length >= 2 && hits.length === 0, [hits.length, query]);

  return (
    <div className="relative min-w-0 flex-1">
      <label className="sr-only" htmlFor="clinic-search">
        Buscar tutor, mascota o chip
      </label>
      <input
        id="clinic-search"
        className="pe-input"
        placeholder="Buscar tutor, mascota o chip"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && (hits.length > 0 || empty) ? (
        <ul className="pe-card absolute z-30 mt-1 w-full overflow-hidden py-1">
          {empty ? <li className="px-3 py-2 text-sm text-[#6b5e55]">Sin coincidencias.</li> : null}
          {hits.map((hit) => (
            <li key={hit.href}>
              <Link href={hit.href} className="block px-3 py-2 text-sm hover:bg-[#efe8de]">
                <span className="font-medium">{hit.title}</span>
                <span className="ml-2 text-[#6b5e55]">{hit.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
