'use client';

import { whatsappHref } from '@petearth/shared';

export function WhatsAppLink({
  phone,
  text,
  children = 'WhatsApp',
  className = 'pe-btn-secondary px-2 py-1 text-xs',
}: {
  phone: string | null | undefined;
  text: string;
  children?: React.ReactNode;
  className?: string;
}) {
  const href = whatsappHref(phone, text);
  if (!href) return null;
  return (
    <a href={href} target="_blank" rel="noreferrer" className={className}>
      {children}
    </a>
  );
}
