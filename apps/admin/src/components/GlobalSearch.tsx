'use client';

import Link from 'next/link';
import { useEffect, useId, useMemo, useState } from 'react';

type Hit = { href: string; title: string; subtitle: string };

export function GlobalSearch() {
  const inputId = useId();
  const [query, setQuery] = useState('');
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setLoading(false);
      return;
    }
    const controller = new AbortController();
    setLoading(true);
    const timer = window.setTimeout(async () => {
      const response = await fetch(`/api/search?q=${encodeURIComponent(q)}`, { signal: controller.signal });
      if (!response.ok) {
        setLoading(false);
        return;
      }
      const payload = (await response.json()) as { hits?: Hit[] };
      setHits(payload.hits ?? []);
      setLoading(false);
      setOpen(true);
    }, 180);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const empty = useMemo(
    () => query.trim().length >= 2 && !loading && hits.length === 0,
    [hits.length, loading, query],
  );

  return (
    <div className="relative min-w-0">
      <label className="sr-only" htmlFor={inputId}>
        Buscar por nombre, tutor, teléfono, chip o correo
      </label>
      <input
        id={inputId}
        className="pe-input py-1.5 text-sm"
        placeholder="Nombre, tutor, tel, chip, correo"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onFocus={() => hits.length > 0 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
      />
      {open && (hits.length > 0 || empty) ? (
        <ul className="pe-card absolute left-0 z-40 mt-1 w-[min(22rem,calc(100vw-1.5rem))] overflow-hidden py-1">
          {empty ? <li className="px-3 py-2 text-sm text-pe-muted">Sin coincidencias.</li> : null}
          {hits.map((hit, index) => (
            <li key={`${hit.href}-${hit.title}-${index}`}>
              <Link href={hit.href} className="block px-3 py-2 text-sm hover:bg-pe-wash">
                <span className="font-medium">{hit.title}</span>
                <span className="ml-2 text-pe-muted">{hit.subtitle}</span>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
