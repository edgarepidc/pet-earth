import Link from 'next/link';

import { AccountActions } from '@/components/AccountActions';

export function SiteHeader({
  clinicName,
  branchName,
  address,
  hours,
  signedIn,
  pets = [],
}: {
  clinicName: string;
  branchName?: string;
  address?: string;
  hours?: string;
  signedIn?: boolean;
  pets?: { id: string; name: string }[];
}) {
  return (
    <header className="sticky top-0 z-40">
      {address || hours ? (
        <div className="bg-pe-ink text-[11px] font-medium tracking-wide text-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-1.5 sm:px-8">
            <p>
              {branchName ?? clinicName}
              {address ? ` · ${address}` : ''}
            </p>
            {hours ? <p className="hidden sm:block">{hours}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="border-b border-[rgba(31,36,40,0.08)] bg-[rgba(244,241,236,0.92)] backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
            <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-pe-ink text-xs font-bold text-white">
              PE
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block text-base font-semibold tracking-tight text-pe-ink">Pet Earth</span>
              <span className="block truncate text-[11px] text-pe-muted">{clinicName}</span>
            </span>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-pe-ink sm:flex">
            <a href="/#servicios" className="hover:text-pe-clay">
              Servicios
            </a>
            <a href="/#catalogo" className="hover:text-pe-clay">
              Catálogo
            </a>
          </nav>
          <AccountActions signedIn={signedIn} pets={pets} />
        </div>
      </div>
    </header>
  );
}
