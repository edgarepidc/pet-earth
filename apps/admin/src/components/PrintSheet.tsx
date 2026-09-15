import Link from 'next/link';

import { PrintButton } from '@/components/PrintButton';

export function PrintSheet({
  backHref,
  clinicName,
  branchName,
  branchAddress,
  fiscal,
  children,
}: {
  backHref: string;
  clinicName: string;
  branchName?: string;
  branchAddress?: string | null;
  fiscal?: {
    rfc?: string | null;
    razonSocial?: string | null;
    codigoPostal?: string | null;
  };
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
        <p className="font-serif text-xl font-semibold">{fiscal?.razonSocial || clinicName}</p>
        {branchName ? <p className="text-sm text-[#6b5e55]">{branchName}</p> : null}
        {branchAddress ? <p className="text-sm text-[#6b5e55]">{branchAddress}</p> : null}
        {fiscal?.rfc || fiscal?.codigoPostal ? (
          <p className="mt-1 text-sm text-[#6b5e55]">
            {fiscal.rfc ? `RFC ${fiscal.rfc}` : null}
            {fiscal.rfc && fiscal.codigoPostal ? ' · ' : null}
            {fiscal.codigoPostal ? `C.P. ${fiscal.codigoPostal}` : null}
          </p>
        ) : null}
        {children}
      </article>
    </div>
  );
}
