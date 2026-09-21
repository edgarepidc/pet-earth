import Link from 'next/link';

export function SiteHeader({
  clinicName,
  signedIn,
}: {
  clinicName: string;
  signedIn?: boolean;
}) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-4">
      <Link href="/" className="flex min-w-0 items-center gap-2.5 no-underline">
        <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-pe-ink text-xs font-bold text-white">
          PE
        </span>
        <span className="min-w-0 leading-tight">
          <span className="block text-base font-semibold tracking-tight text-pe-ink">Pet Earth</span>
          <span className="block truncate text-[11px] text-pe-muted">{clinicName}</span>
        </span>
      </Link>
      <nav className="flex flex-wrap items-center gap-4 text-sm">
        <a href="#servicios" className="pe-link">
          Servicios
        </a>
        <Link href={signedIn ? '/cuenta' : '/login'} className="pe-btn-primary px-4 py-2">
          {signedIn ? 'Ver cartilla' : 'Perfil de tu mascota'}
        </Link>
      </nav>
    </header>
  );
}
