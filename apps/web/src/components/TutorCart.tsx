'use client';

import { useEffect, useState } from 'react';

import { formatMoney, todayMexicoYmd } from '@petearth/shared';

import { SectionMark } from '@/components/SectionTitle';
import {
  clearCart,
  readCart,
  readPickups,
  savePickup,
  setCartQty,
  type CartLine,
  type PickupRequest,
} from '@/lib/cart';

export function TutorCart({ branchName }: { branchName: string }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [pickups, setPickups] = useState<PickupRequest[]>([]);
  const [pickupOn, setPickupOn] = useState(todayMexicoYmd());
  const [done, setDone] = useState(false);

  useEffect(() => {
    function sync() {
      setLines(readCart());
      setPickups(readPickups());
    }
    sync();
    window.addEventListener('pe-cart-changed', sync);
    return () => window.removeEventListener('pe-cart-changed', sync);
  }, []);

  const total = lines.reduce((sum, line) => sum + line.unitPrice * line.qty, 0);

  function confirm() {
    if (lines.length === 0) return;
    savePickup({
      id: crypto.randomUUID(),
      pickupOn,
      items: lines,
      total,
      createdAt: new Date().toISOString(),
    });
    clearCart();
    setDone(true);
  }

  return (
    <section id="carrito" className="mt-8 scroll-mt-8">
      <h2 className="flex items-center gap-2 font-serif text-xl font-semibold">
        <SectionMark name="caja" size="sm" />
        Carrito
      </h2>
      <p className="mt-1 text-sm text-pe-muted">
        Productos para recoger en {branchName}. Se pagan en sucursal.
      </p>

      {lines.length === 0 ? (
        <p className="mt-3 text-sm text-pe-muted">
          {done ? 'Pedido listo. Pasa ese día a la sucursal.' : 'El carrito está vacío. Agrégalos desde el sitio, en Productos.'}
        </p>
      ) : (
        <div className="pe-card mt-3 p-4">
          <ul className="divide-y divide-[rgba(31,36,40,0.08)]">
            {lines.map((line) => (
              <li key={line.id} className="flex items-center gap-3 py-3">
                <img src={line.image} alt="" className="h-12 w-12 object-contain" />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{line.name}</p>
                  <p className="text-sm text-pe-muted tabular-nums">{formatMoney(line.unitPrice)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button type="button" className="pe-btn-ghost px-2 py-1 text-sm" onClick={() => setCartQty(line.id, line.qty - 1)}>
                    −
                  </button>
                  <span className="w-5 text-center text-sm tabular-nums">{line.qty}</span>
                  <button type="button" className="pe-btn-ghost px-2 py-1 text-sm" onClick={() => setCartQty(line.id, line.qty + 1)}>
                    +
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-right font-semibold tabular-nums">{formatMoney(total)}</p>
          <label className="mt-4 block text-sm">
            Día de recolección
            <input
              type="date"
              className="pe-input mt-1"
              min={todayMexicoYmd()}
              value={pickupOn}
              onChange={(e) => setPickupOn(e.target.value)}
              required
            />
          </label>
          <button type="button" className="pe-btn-primary mt-4 px-4 py-2 text-sm" onClick={confirm}>
            Pedir recolección
          </button>
        </div>
      )}

      {pickups.length > 0 ? (
        <ul className="mt-4 space-y-2">
          {pickups.map((row) => (
            <li key={row.id} className="pe-card p-4 text-sm">
              <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-pe-clay">Para recoger</p>
              <p className="mt-1 font-medium">
                {row.items.map((item) => `${item.qty}× ${item.name}`).join(', ')}
              </p>
              <p className="text-pe-muted">
                {branchName} · {row.pickupOn} · {formatMoney(row.total)}
              </p>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
