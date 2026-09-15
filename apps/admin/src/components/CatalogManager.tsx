'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CATALOG_KIND_LABELS, formatMoney, type CatalogKind } from '@petearth/shared';

type Item = {
  id: string;
  kind: CatalogKind;
  name: string;
  unit_price: number;
  stock: number | null;
  min_stock: number | null;
  is_active: boolean;
};

export function CatalogManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<CatalogKind>('service');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');
  const [stock, setStock] = useState('0');
  const [minStock, setMinStock] = useState('4');
  const [error, setError] = useState<string | null>(null);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    const response = await fetch('/api/catalog', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kind,
        name,
        unitPrice: Number(price),
        stock: kind === 'product' ? Number(stock) : null,
        minStock: kind === 'product' ? Number(minStock) : null,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar');
      return;
    }
    setName('');
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div>
        <p className="pe-kicker">Farmacia</p>
        <h1 className="text-2xl font-semibold tracking-tight">Catálogo</h1>
        <p className="text-sm text-pe-muted">Servicios y medicamentos. El ticket se desglosa con este tipo.</p>
      </div>
      <form onSubmit={submit} className="pe-glass-card grid gap-3 p-4 md:grid-cols-5">
        <select className="pe-input" value={kind} onChange={(e) => setKind(e.target.value as CatalogKind)}>
          <option value="service">Servicio</option>
          <option value="product">Medicamento</option>
        </select>
        <input className="pe-input md:col-span-2" required placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
        <input className="pe-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        {kind === 'product' ? (
          <>
            <input className="pe-input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
            <input className="pe-input" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="Mínimo" />
          </>
        ) : (
          <div />
        )}
        <button type="submit" className="pe-btn-primary px-4 py-2 text-sm md:col-span-5">
          Agregar
        </button>
        {error ? <p className="text-sm text-pe-danger md:col-span-5">{error}</p> : null}
      </form>
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b text-pe-muted">
            <th className="py-2">Ítem</th>
            <th>Tipo</th>
            <th>Precio</th>
            <th>Stock</th>
            <th>Mínimo</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id} className="border-b border-pe-line">
              <td className="py-2 font-medium">{item.name}</td>
              <td>{CATALOG_KIND_LABELS[item.kind]}</td>
              <td>{formatMoney(Number(item.unit_price))}</td>
              <td>
                {item.stock ?? '—'}
                {item.kind === 'product' && item.min_stock != null && Number(item.stock ?? 0) <= Number(item.min_stock) ? (
                  <span className="ml-2 text-xs font-semibold text-pe-clay-700">bajo</span>
                ) : null}
              </td>
              <td>{item.min_stock ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}
