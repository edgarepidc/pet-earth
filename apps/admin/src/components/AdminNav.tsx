'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

const NAV = [
  { href: '/', label: 'Hoy' },
  { href: '/agenda', label: 'Agenda' },
  { href: '/pacientes', label: 'Pacientes' },
  { href: '/seguimiento', label: 'Seguimiento' },
  { href: '/catalogo', label: 'Catálogo' },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 md:hidden"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-lg">{open ? '×' : '☰'}</span>
      </button>
      <nav className="pe-glass-nav hidden items-center rounded-full p-0.5 md:flex" aria-label="Navegación">
        {NAV.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`rounded-full px-3 py-1.5 text-sm font-medium ${
              isActive(pathname, item.href) ? 'pe-nav-active' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button type="button" className="absolute inset-0 bg-slate-900/40" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <div className="absolute inset-x-0 top-0 bg-white px-4 py-4">
            <nav className="grid gap-1">
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-xl px-4 py-3 text-base font-medium ${
                    isActive(pathname, item.href) ? 'bg-slate-900 text-white' : 'text-slate-700'
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
