import Link from 'next/link';

export function BrandLogo({
  href = '/',
  subtitle,
}: {
  href?: string;
  subtitle?: string;
}) {
  return (
    <Link href={href} className="flex items-center gap-2 no-underline">
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#2f6f5e] text-sm font-bold text-white">
        PE
      </span>
      <span className="leading-tight">
        <span className="block text-sm font-bold text-slate-900">Pet Earth</span>
        {subtitle ? <span className="block text-[11px] text-slate-500">{subtitle}</span> : null}
      </span>
    </Link>
  );
}
