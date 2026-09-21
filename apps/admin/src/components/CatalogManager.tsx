'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { CATALOG_KIND_LABELS, formatMoney, type CatalogKind } from '@petearth/shared';

import { PageHeading } from '@/components/SectionTitle';

type Item = {
  id: string;
  kind: CatalogKind;
  name: string;
  sku: string | null;
  unit_price: number;
  description: string | null;
  image_url: string | null;
  stock: number | null;
  min_stock: number | null;
  is_active: boolean;
};

function CatalogRow({ item }: { item: Item }) {
  const router = useRouter();
  const [name, setName] = useState(item.name);
  const [sku, setSku] = useState(item.sku ?? '');
  const [price, setPrice] = useState(String(item.unit_price));
  const [description, setDescription] = useState(item.description ?? '');
  const [imageUrl, setImageUrl] = useState(item.image_url ?? '');
  const [stock, setStock] = useState(String(item.stock ?? 0));
  const [minStock, setMinStock] = useState(String(item.min_stock ?? 4));
  const [active, setActive] = useState(item.is_active);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const response = await fetch('/api/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: item.id,
        name,
        sku,
        unitPrice: Number(price),
        description,
        imageUrl,
        stock: item.kind === 'product' ? Number(stock) : null,
        minStock: item.kind === 'product' ? Number(minStock) : null,
        isActive: active,
      }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo guardar');
      return;
    }
    router.refresh();
  }

  return (
    <form onSubmit={(event) => void save(event)} className="pe-glass-card grid gap-3 p-4">
      <div className="flex items-start gap-3">
        {imageUrl ? (
          <img src={imageUrl} alt="" className="h-16 w-20 shrink-0 rounded-md object-cover" />
        ) : (
          <div className="h-16 w-20 shrink-0 rounded-md bg-pe-wash" />
        )}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold uppercase tracking-[0.14em] text-pe-muted">
            {CATALOG_KIND_LABELS[item.kind]}
            {active ? '' : ' · oculto'}
          </p>
          <p className="font-medium">{item.name}</p>
          <p className="text-sm text-pe-muted">{formatMoney(Number(item.unit_price))}</p>
        </div>
      </div>
      <div className="grid gap-2 md:grid-cols-4">
        <input className="pe-input md:col-span-2" value={name} onChange={(e) => setName(e.target.value)} required />
        <input className="pe-input" value={sku} onChange={(e) => setSku(e.target.value)} placeholder="SKU" />
        <input className="pe-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
      </div>
      <textarea
        className="pe-input min-h-[4.5rem]"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Texto en el sitio público"
      />
      <input
        className="pe-input"
        value={imageUrl}
        onChange={(e) => setImageUrl(e.target.value)}
        placeholder="Imagen: /catalog/foto.jpg"
      />
      {item.kind === 'product' ? (
        <div className="grid gap-2 sm:grid-cols-2">
          <input className="pe-input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
          <input className="pe-input" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="Mínimo" />
        </div>
      ) : null}
      <label className="flex items-center gap-2 text-sm">
        <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} />
        Visible en el sitio
      </label>
      {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      <button type="submit" className="pe-btn-secondary w-fit px-4 py-2 text-sm" disabled={busy}>
        {busy ? 'Guardando…' : 'Guardar'}
      </button>
    </form>
  );
}

export function CatalogManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [kind, setKind] = useState<CatalogKind>('service');
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [price, setPrice] = useState('0');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
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
        sku,
        unitPrice: Number(price),
        description,
        imageUrl,
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
    setSku('');
    setDescription('');
    setImageUrl('');
    router.refresh();
  }

  const services = items.filter((item) => item.kind === 'service');
  const products = items.filter((item) => item.kind === 'product');

  return (
    <section className="space-y-4">
      <PageHeading
        mark="catalogo"
        kicker="Farmacia y mostrador"
        title="Catálogo"
        description="Servicios y productos del sitio. Nombre, texto, foto y precio salen en la web pública."
      />
      <form onSubmit={submit} className="pe-glass-card grid gap-3 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="pe-input" value={kind} onChange={(e) => setKind(e.target.value as CatalogKind)}>
            <option value="service">Servicio</option>
            <option value="product">Producto</option>
          </select>
          <input className="pe-input md:col-span-2" required placeholder="Nombre" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="pe-input" type="number" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} />
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <input className="pe-input" placeholder="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <input className="pe-input" placeholder="Imagen: /catalog/foto.jpg" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} />
        </div>
        <textarea
          className="pe-input min-h-[4.5rem]"
          placeholder="Texto en el sitio público"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        {kind === 'product' ? (
          <div className="grid gap-3 sm:grid-cols-2">
            <input className="pe-input" type="number" min="0" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="Stock" />
            <input className="pe-input" type="number" min="0" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="Mínimo" />
          </div>
        ) : null}
        <button type="submit" className="pe-btn-primary w-fit px-4 py-2 text-sm">
          Agregar
        </button>
        {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
      </form>

      <h2 className="pt-2 font-serif text-xl font-semibold">Servicios</h2>
      <div className="grid gap-3">
        {services.map((item) => (
          <CatalogRow key={item.id} item={item} />
        ))}
      </div>
      <h2 className="pt-2 font-serif text-xl font-semibold">Productos</h2>
      <div className="grid gap-3">
        {products.map((item) => (
          <CatalogRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}
