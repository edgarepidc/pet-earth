import Link from 'next/link';

import { AccountActions } from '@/components/AccountActions';

export function SiteHeader({
  clinicName,
  branchName,
  address,
  hours,
  phone,
  signedIn,
}: {
  clinicName: string;
  branchName?: string;
  address?: string;
  hours?: string;
  phone?: string;
  signedIn?: boolean;
}) {
  return (
    <header className="sticky top-0 z-40">
      {address || hours || phone ? (
        <div className="bg-pe-ink text-[11px] font-medium tracking-wide text-white/80">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-1.5 sm:px-8">
            <p>
              {branchName ?? clinicName}
              {address ? ` · ${address}` : ''}
              {phone ? ` · ${phone}` : ''}
            </p>
            {hours ? <p className="hidden sm:block">{hours}</p> : null}
          </div>
        </div>
      ) : null}
      <div className="border-b border-pe-line bg-pe-bone/92 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-5 py-3 sm:px-8">
          <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
            <span className="pe-mark">
              <img src="/brand/mark.png" alt="" width={44} height={44} />
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-base font-semibold tracking-tight text-pe-ink">{clinicName}</span>
              <span className="block truncate text-[11px] text-pe-muted">Consultorio Veterinario</span>
            </span>
          </Link>
          <AccountActions signedIn={signedIn} />
        </div>
      </div>
    </header>
  );
}
