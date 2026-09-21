'use client';

import { useEffect, useState } from 'react';

import { addToCart } from '@/lib/cart';

export function AddToCartButton({
  id,
  name,
  unitPrice,
  image,
}: {
  id: string;
  name: string;
  unitPrice: number;
  image: string;
}) {
  const [added, setAdded] = useState(false);

  function add() {
    addToCart({ id, name, unitPrice, image });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 1600);
  }

  return (
    <button type="button" className="pe-btn-primary w-full px-4 py-2 text-sm" onClick={add}>
      {added ? 'Agregado' : 'Agregar al carrito'}
    </button>
  );
}
