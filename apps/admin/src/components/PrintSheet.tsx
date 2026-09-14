import Link from 'next/link';

import { PrintButton } from '@/components/PrintButton';

export function PrintSheet({
  backHref,
  clinicName,
  children,
}: {
  backHref: string;
  clinicName: string;
  children: React.ReactNode;
}) {
  return (
    <div className="pe-app min-h-screen px-4 py-6">
      <div className="pe-no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <Link href={backHref} className="text-sm font-medium text-[#b85c38] underline">
          Volver
        </Link>
        <PrintButton />
      </div>
      <article className="pe-print-sheet mx-auto max-w-3xl p-8">
        <p className="pe-kicker">Pet Earth</p>
        <p className="font-serif text-xl font-semibold">{clinicName}</p>
        {children}
      </article>
    </div>
  );
}
