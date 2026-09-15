import Link from 'next/link';

export function BrandLogo({
  href = '/',
  subtitle,
  inverted = false,
}: {
  href?: string;
  subtitle?: string;
  inverted?: boolean;
}) {
  return (
    <Link href={href} className="flex min-w-0 items-center gap-2.5 no-underline">
      <span
        className={`inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold ${
          inverted ? 'bg-white text-pe-ink' : 'bg-pe-ink text-white'
        }`}
      >
        PE
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block text-base font-semibold tracking-tight ${inverted ? 'text-white' : 'text-pe-ink'}`}>
          Pet Earth
        </span>
        {subtitle ? (
          <span className={`block truncate text-[11px] ${inverted ? 'text-pe-sidebar-muted' : 'text-pe-muted'}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
