'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

import { cartCount, readCart } from '@/lib/cart';

export function CartBadge({ signedIn }: { signedIn?: boolean }) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    function sync() {
      setCount(cartCount(readCart()));
    }
    sync();
    window.addEventListener('pe-cart-changed', sync);
    window.addEventListener('storage', sync);
    return () => {
      window.removeEventListener('pe-cart-changed', sync);
      window.removeEventListener('storage', sync);
    };
  }, []);

  const href = signedIn ? '/cuenta#carrito' : '/login?next=%2Fcuenta%23carrito';

  return (
    <Link href={href} className="pe-btn-ghost relative px-3 py-2 text-sm">
      Carrito
      {count > 0 ? (
        <span className="absolute -right-1 -top-1 inline-flex min-w-4 items-center justify-center rounded-full bg-pe-clay px-1 text-[10px] font-bold text-white">
          {count}
        </span>
      ) : null}
    </Link>
  );
}
