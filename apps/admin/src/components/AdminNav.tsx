'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

import { canManageCatalog, canManageClinic, canTakePayment, type StaffRole } from '@petearth/shared';

import { GlobalSearch } from '@/components/GlobalSearch';

const GROUPS: {
  label: string;
  items: { href: string; label: string; show?: (role: StaffRole) => boolean }[];
}[] = [
  {
    label: 'Operación',
    items: [
      { href: '/', label: 'Hoy' },
      { href: '/agenda', label: 'Agenda' },
    ],
  },
  {
    label: 'Clínico',
    items: [
      { href: '/pacientes', label: 'Pacientes' },
      { href: '/tutores', label: 'Tutores' },
      { href: '/seguimiento', label: 'Seguimiento' },
    ],
  },
  {
    label: 'Administración',
    items: [
      {
        href: '/configuracion',
        label: 'Configuración',
        show: (role) => canManageClinic(role),
      },
    ],
  },
  {
    label: 'Cobro y stock',
    items: [
      { href: '/caja', label: 'Caja', show: canTakePayment },
      { href: '/catalogo', label: 'Catálogo', show: (role) => canManageCatalog(role) || role === 'vet' || role === 'reception' },
      { href: '/informes', label: 'Informes', show: (role) => canManageCatalog(role) || role === 'vet' },
    ],
  },
];

function isActive(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminNav({
  role,
  isPlatformAdmin = false,
}: {
  role: StaffRole;
  isPlatformAdmin?: boolean;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  const groups = GROUPS.map((group) => ({
    ...group,
    items: group.items.filter((item) => !item.show || item.show(role)),
  })).filter((group) => group.items.length > 0);

  if (isPlatformAdmin) {
    groups.unshift({
      label: 'SaaS',
      items: [{ href: '/plataforma', label: 'Veterinarias' }],
    });
  }

  return (
    <>
      <button
        type="button"
        className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-pe-line text-pe-ink lg:hidden"
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="text-lg">{open ? '×' : '☰'}</span>
      </button>
      <nav className="hidden min-h-0 flex-1 flex-col gap-5 overflow-y-auto lg:flex" aria-label="Navegación">
        {groups.map((group) => (
          <div key={group.label}>
            <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-pe-muted">{group.label}</p>
            <ul className="mt-1 space-y-0.5">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`block rounded-md px-2 py-1.5 text-sm ${
                      isActive(pathname, item.href) ? 'pe-nav-active' : 'text-pe-ink hover:bg-pe-wash'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </nav>
      {open ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/50" aria-label="Cerrar" onClick={() => setOpen(false)} />
          <div className="pe-sidebar absolute inset-y-0 left-0 w-64 px-4 py-5">
            <nav className="grid gap-4" aria-label="Navegación móvil">
              <GlobalSearch />
              {groups.map((group) => (
                <div key={group.label}>
                  <p className="px-1 text-[10px] font-bold uppercase tracking-[0.16em] text-pe-muted">{group.label}</p>
                  {group.items.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`mt-1 block rounded-md px-3 py-2 text-sm ${
                        isActive(pathname, item.href) ? 'pe-nav-active' : 'text-pe-ink'
                      }`}
                    >
                      {item.label}
                    </Link>
                  ))}
                </div>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </>
  );
}
