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
          inverted ? 'bg-[#faf7f2] text-[#3c322c]' : 'bg-[#3c322c] text-[#faf7f2]'
        }`}
      >
        PE
      </span>
      <span className="min-w-0 leading-tight">
        <span className={`block font-serif text-base font-semibold ${inverted ? 'text-[#f3eee6]' : 'text-[#2a221c]'}`}>
          Pet Earth
        </span>
        {subtitle ? (
          <span className={`block truncate text-[11px] ${inverted ? 'text-[#d7cfc4]' : 'text-[#6b5e55]'}`}>
            {subtitle}
          </span>
        ) : null}
      </span>
    </Link>
  );
}
