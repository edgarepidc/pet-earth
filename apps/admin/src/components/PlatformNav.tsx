'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function PlatformNav() {
  const pathname = usePathname();
  const clinicsActive = pathname === '/plataforma' || pathname.startsWith('/plataforma/');

  return (
    <nav className="mt-8 flex-1" aria-label="Plataforma">
      <p className="px-2 text-[10px] font-bold uppercase tracking-[0.16em] text-[#a89b90]">SaaS</p>
      <Link
        href="/plataforma"
        className={`mt-1 block rounded-md px-2 py-1.5 text-sm ${
          clinicsActive ? 'pe-nav-active' : 'text-[#d7cfc4] hover:bg-white/5 hover:text-[#faf7f2]'
        }`}
      >
        Veterinarias
      </Link>
    </nav>
  );
}
