import Link from 'next/link';

import { PrintButton } from '@/components/PrintButton';
import { RecetaWhatsAppButton } from '@/components/RecetaWhatsAppButton';

export function PrintSheet({
  backHref,
  clinicName,
  branchName,
  branchAddress,
  branchPhone,
  logo,
  footer,
  fiscal,
  whatsApp,
  children,
}: {
  backHref: string;
  clinicName: string;
  branchName?: string;
  branchAddress?: string | null;
  branchPhone?: string | null;
  logo?: string | null;
  footer?: string | null;
  fiscal?: {
    rfc?: string | null;
    razonSocial?: string | null;
    codigoPostal?: string | null;
  };
  whatsApp?: {
    phone: string | null | undefined;
    tutorName: string;
    patientName: string;
  };
  children: React.ReactNode;
}) {
  return (
    <div className="pe-app min-h-screen px-4 py-6">
      <div className="pe-no-print mx-auto mb-4 flex max-w-3xl items-center justify-between gap-3">
        <Link href={backHref} className="pe-link text-sm">
          Volver
        </Link>
        <div className="flex items-start gap-2">
          {whatsApp ? (
            <RecetaWhatsAppButton
              phone={whatsApp.phone}
              tutorName={whatsApp.tutorName}
              patientName={whatsApp.patientName}
              clinicName={clinicName}
            />
          ) : null}
          <PrintButton />
        </div>
      </div>
      <article id="pe-print-sheet" className="pe-print-sheet mx-auto max-w-3xl p-8">
        <header className="flex items-start gap-4">
          {logo ? <img src={logo} alt="" className="h-16 w-16 rounded-md object-cover" /> : null}
          <div className="min-w-0">
            <p className="font-serif text-xl font-semibold">{fiscal?.razonSocial || clinicName}</p>
            {branchName ? <p className="text-sm text-pe-muted">{branchName}</p> : null}
            {branchAddress || branchPhone ? (
              <p className="text-sm text-pe-muted">
                {branchAddress}
                {branchAddress && branchPhone ? ' · ' : null}
                {branchPhone}
              </p>
            ) : null}
            {fiscal?.rfc || fiscal?.codigoPostal ? (
              <p className="mt-1 text-sm text-pe-muted">
                {fiscal.rfc ? `RFC ${fiscal.rfc}` : null}
                {fiscal.rfc && fiscal.codigoPostal ? ' · ' : null}
                {fiscal.codigoPostal ? `C.P. ${fiscal.codigoPostal}` : null}
              </p>
            ) : null}
          </div>
        </header>
        {children}
        {footer ? <p className="mt-10 text-xs text-pe-muted">{footer}</p> : null}
      </article>
    </div>
  );
}
