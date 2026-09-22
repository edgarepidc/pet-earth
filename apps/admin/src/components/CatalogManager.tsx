'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

import { CATALOG_KIND_LABELS, formatMoney, type CatalogKind } from '@petearth/shared';

import { PageHeading } from '@/components/SectionTitle';
import { PublicPhotoField } from '@/components/PublicPhotoField';

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

type Draft = {
  kind: CatalogKind;
  name: string;
  sku: string;
  price: string;
  description: string;
  imageUrl: string;
  stock: string;
  minStock: string;
};

const FILTERS: { key: CatalogKind; label: string }[] = [
  { key: 'service', label: 'Servicios' },
  { key: 'product', label: 'Productos' },
];

function emptyDraft(kind: CatalogKind): Draft {
  return {
    kind,
    name: '',
    sku: '',
    price: '0',
    description: '',
    imageUrl: '',
    stock: '0',
    minStock: '4',
  };
}

function draftFrom(item: Item): Draft {
  return {
    kind: item.kind,
    name: item.name,
    sku: item.sku ?? '',
    price: String(item.unit_price),
    description: item.description ?? '',
    imageUrl: item.image_url ?? '',
    stock: String(item.stock ?? 0),
    minStock: String(item.min_stock ?? 4),
  };
}

function Thumb({ src, name }: { src: string | null; name: string }) {
  return src ? (
    <img src={src} alt="" className="h-11 w-14 rounded-md object-cover" />
  ) : (
    <span className="flex h-11 w-14 items-center justify-center rounded-md bg-[#eef2e6] text-[10px] font-bold uppercase tracking-[0.08em] text-pe-clay-700">
      {name.slice(0, 1)}
    </span>
  );
}

export function CatalogManager({ items }: { items: Item[] }) {
  const router = useRouter();
  const [filter, setFilter] = useState<CatalogKind>('service');
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | 'new' | null>(null);
  const [draft, setDraft] = useState<Draft>(emptyDraft('service'));

  const rows = useMemo(() => items.filter((item) => item.kind === filter), [items, filter]);

  function openNew() {
    setError(null);
    setDraft(emptyDraft(filter));
    setEditingId('new');
  }

  function openEdit(item: Item) {
    setError(null);
    setDraft(draftFrom(item));
    setEditingId(item.id);
  }

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    if (!draft.name.trim()) {
      setError('El nombre es obligatorio.');
      return;
    }
    const creating = editingId === 'new';
    setBusy('save');
    const payload = {
      id: creating ? undefined : editingId,
      kind: draft.kind,
      name: draft.name,
      sku: draft.sku,
      unitPrice: Number(draft.price),
      description: draft.description,
      imageUrl: draft.imageUrl,
      stock: draft.kind === 'product' ? Number(draft.stock) : null,
      minStock: draft.kind === 'product' ? Number(draft.minStock) : null,
    };
    const response = await fetch('/api/catalog', {
      method: creating ? 'POST' : 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    const body = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(body.error ?? 'No se pudo guardar.');
      return;
    }
    setEditingId(null);
    router.refresh();
  }

  async function toggleWeb(item: Item) {
    setError(null);
    setBusy(item.id);
    const response = await fetch('/api/catalog', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: item.id, isActive: !item.is_active }),
    });
    const payload = (await response.json()) as { error?: string };
    setBusy(null);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo actualizar.');
      return;
    }
    router.refresh();
  }

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <PageHeading
          mark="catalogo"
          kicker="Cobro y stock"
          title="Catálogo"
          description="Servicios y productos. Lo activo sale en la web y en consulta."
        />
        <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
          {FILTERS.map((item) => (
            <button
              key={item.key}
              type="button"
              className={`whitespace-nowrap px-3 py-1.5 text-sm ${
                filter === item.key ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'
              }`}
              onClick={() => {
                setFilter(item.key);
                setEditingId(null);
              }}
            >
              {item.label}
            </button>
          ))}
          <button
            type="button"
            className={`whitespace-nowrap px-3 py-1.5 text-sm ${
              editingId === 'new' ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-secondary'
            }`}
            onClick={() => (editingId === 'new' ? setEditingId(null) : openNew())}
          >
            Agregar
          </button>
        </div>
      </div>
      {error ? <p className="pe-callout-amber p-3 text-sm">{error}</p> : null}
      {editingId === 'new' ? (
        <ItemForm
          draft={draft}
          busy={busy === 'save'}
          creating
          onChange={setDraft}
          onCancel={() => setEditingId(null)}
          onSubmit={(event) => void save(event)}
        />
      ) : null}
      <div className="pe-card overflow-x-auto px-1 py-2">
        <table className="w-full min-w-[48rem] text-left text-sm">
          <thead>
            <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <th className="w-16 px-3 py-2.5">Foto</th>
              <th className="px-3 py-2.5">Nombre</th>
              <th className="px-3 py-2.5">SKU</th>
              <th className="px-3 py-2.5">Precio</th>
              {filter === 'product' ? <th className="px-3 py-2.5">Stock</th> : null}
              <th className="px-3 py-2.5">Sitio</th>
              <th className="px-3 py-2.5 text-right"> </th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr className="border-b border-pe-line">
                <td className="px-3 py-6 text-pe-muted" colSpan={filter === 'product' ? 7 : 6}>
                  Nada en {filter === 'product' ? 'productos' : 'servicios'}.
                </td>
              </tr>
            ) : (
              rows.flatMap((item) => {
                const open = editingId === item.id;
                const main = (
                  <tr
                    key={item.id}
                    className={`border-b border-pe-line last:border-0 ${
                      item.is_active
                        ? 'bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)] hover:bg-white'
                        : 'bg-pe-wash/40 text-pe-muted'
                    }`}
                  >
                    <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2">
                      <Thumb src={item.image_url} name={item.name} />
                    </td>
                    <td className="px-3 py-2.5">
                      <p className="font-medium text-pe-ink">{item.name}</p>
                      {item.description ? <p className="truncate text-xs text-pe-muted">{item.description}</p> : null}
                    </td>
                    <td className="px-3 py-2.5 font-mono text-xs text-pe-muted">{item.sku ?? '—'}</td>
                    <td className="px-3 py-2.5 tabular-nums font-medium">{formatMoney(Number(item.unit_price))}</td>
                    {filter === 'product' ? (
                      <td className="px-3 py-2.5 tabular-nums text-pe-muted">
                        {Number(item.stock ?? 0)}
                        {item.min_stock != null ? ` / ${item.min_stock}` : ''}
                      </td>
                    ) : null}
                    <td className="px-3 py-2.5">
                      <span className={`text-xs font-semibold ${item.is_active ? 'text-pe-clay-700' : 'text-pe-muted'}`}>
                        {item.is_active ? 'Visible' : 'Oculto'}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      <span className="inline-flex gap-1">
                        <button
                          type="button"
                          className={`px-3 py-1.5 text-sm ${open ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`}
                          onClick={() => (open ? setEditingId(null) : openEdit(item))}
                        >
                          {open ? 'Cerrar' : 'Editar'}
                        </button>
                        <button
                          type="button"
                          className="pe-btn-ghost px-3 py-1.5 text-sm"
                          disabled={busy === item.id}
                          onClick={() => void toggleWeb(item)}
                        >
                          {item.is_active ? 'Ocultar' : 'En web'}
                        </button>
                      </span>
                    </td>
                  </tr>
                );
                if (!open) return [main];
                return [
                  main,
                  <tr key={`${item.id}-edit`} className="border-b border-pe-line bg-white">
                    <td className="px-3 py-3" colSpan={filter === 'product' ? 7 : 6}>
                      <ItemForm
                        draft={draft}
                        busy={busy === 'save'}
                        creating={false}
                        onChange={setDraft}
                        onCancel={() => setEditingId(null)}
                        onSubmit={(event) => void save(event)}
                      />
                    </td>
                  </tr>,
                ];
              })
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function ItemForm({
  draft,
  busy,
  creating,
  onChange,
  onCancel,
  onSubmit,
}: {
  draft: Draft;
  busy: boolean;
  creating: boolean;
  onChange: (draft: Draft) => void;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
}) {
  return (
    <form onSubmit={onSubmit} className={`${creating ? 'pe-card p-3' : 'py-1'} grid min-w-0 gap-1.5 sm:grid-cols-2`}>
      {creating ? (
        <select
          className="pe-input h-8 py-1 text-sm"
          value={draft.kind}
          onChange={(e) => onChange({ ...draft, kind: e.target.value as CatalogKind })}
        >
          <option value="service">{CATALOG_KIND_LABELS.service}</option>
          <option value="product">{CATALOG_KIND_LABELS.product}</option>
        </select>
      ) : (
        <p className="self-center text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
          {CATALOG_KIND_LABELS[draft.kind]}
        </p>
      )}
      <input
        className="pe-input h-8 py-1 text-sm"
        placeholder="Nombre"
        value={draft.name}
        onChange={(e) => onChange({ ...draft, name: e.target.value })}
        required
      />
      <input
        className="pe-input h-8 py-1 text-sm"
        type="number"
        min="0"
        step="0.01"
        value={draft.price}
        onChange={(e) => onChange({ ...draft, price: e.target.value })}
      />
      <input
        className="pe-input h-8 py-1 text-sm"
        placeholder="SKU"
        value={draft.sku}
        onChange={(e) => onChange({ ...draft, sku: e.target.value })}
      />
      {draft.kind === 'product' ? (
        <>
          <input
            className="pe-input h-8 py-1 text-sm"
            type="number"
            min="0"
            value={draft.stock}
            onChange={(e) => onChange({ ...draft, stock: e.target.value })}
            placeholder="Stock"
          />
          <input
            className="pe-input h-8 py-1 text-sm"
            type="number"
            min="0"
            value={draft.minStock}
            onChange={(e) => onChange({ ...draft, minStock: e.target.value })}
            placeholder="Mínimo"
          />
        </>
      ) : null}
      <textarea
        className="pe-input min-h-[3rem] sm:col-span-2"
        placeholder="Texto en el sitio público"
        value={draft.description}
        onChange={(e) => onChange({ ...draft, description: e.target.value })}
      />
      <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
        <PublicPhotoField
          src={draft.imageUrl || null}
          name={draft.name}
          folder="catalog"
          disabled={busy}
          onUploaded={(url) => onChange({ ...draft, imageUrl: url })}
        />
        <button type="submit" className="pe-btn-primary px-4 py-1.5 text-sm" disabled={busy}>
          {busy ? 'Guardando…' : creating ? 'Agregar' : 'Guardar'}
        </button>
        <button type="button" className="pe-btn-ghost px-3 py-1.5 text-sm" onClick={onCancel}>
          Cancelar
        </button>
      </div>
    </form>
  );
}
