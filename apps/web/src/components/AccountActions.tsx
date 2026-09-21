'use client';

import Link from 'next/link';

import { CartBadge } from '@/components/CartBadge';

export function AccountActions({ signedIn }: { signedIn?: boolean }) {
  return (
    <div className="flex items-center gap-2">
      <CartBadge signedIn={signedIn} />
      <Link href={signedIn ? '/cuenta' : '/login'} className="pe-btn-primary px-4 py-2 text-sm">
        Mi cuenta
      </Link>
    </div>
  );
}
