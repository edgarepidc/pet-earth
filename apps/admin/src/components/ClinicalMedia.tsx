'use client';

import { useEffect, useState } from 'react';

import { ChartCard } from '@/components/SectionTitle';

type MediaItem = {
  id: string;
  kind: 'photo' | 'study';
  caption: string | null;
  content_type: string | null;
  url: string | null;
  created_at: string;
};

export function ClinicalMedia({
  patientId,
  visitId,
  canUpload = true,
}: {
  patientId: string;
  visitId?: string | null;
  canUpload?: boolean;
}) {
  const [items, setItems] = useState<MediaItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function load() {
    const params = new URLSearchParams();
    if (visitId) params.set('visitId', visitId);
    else params.set('patientId', patientId);
    const response = await fetch(`/api/media?${params.toString()}`);
    const payload = (await response.json()) as { items?: MediaItem[]; error?: string };
    if (!response.ok) {
      setError(payload.error ?? 'No se pudieron cargar las fotos.');
      return;
    }
    setItems(payload.items ?? []);
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [patientId, visitId]);

  async function upload(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    data.set('patientId', patientId);
    if (visitId) data.set('visitId', visitId);
    setBusy(true);
    setError(null);
    const response = await fetch('/api/media', { method: 'POST', body: data });
    const payload = (await response.json().catch(() => null)) as { error?: string } | null;
    setBusy(false);
    if (!response.ok) {
      setError(payload?.error ?? 'No se pudo subir.');
      return;
    }
    form.reset();
    await load();
  }

  return (
    <ChartCard mark="consulta" title="Fotos y estudios">
      <p className="mt-1 text-sm text-pe-muted">Radiografías, laboratorios o fotos de lesión. Quedan en el expediente.</p>
      {error ? <p className="mt-2 text-sm text-pe-danger">{error}</p> : null}
      {canUpload ? (
        <form onSubmit={(event) => void upload(event)} className="mt-3 flex flex-wrap gap-2">
          <input
            className="pe-input min-w-[10rem] flex-1"
            type="file"
            name="file"
            required
            accept="image/jpeg,image/png,image/webp,application/pdf"
          />
          <input className="pe-input min-w-[8rem] flex-1" name="caption" placeholder="Nota (opcional)" />
          <select className="pe-input w-36" name="kind" defaultValue="photo">
            <option value="photo">Foto</option>
            <option value="study">Estudio / lab</option>
          </select>
          <button type="submit" className="pe-btn-secondary px-3 py-2 text-sm" disabled={busy}>
            {busy ? 'Subiendo…' : 'Subir'}
          </button>
        </form>
      ) : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-md border border-pe-line bg-white">
            {item.url && item.content_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt={item.caption || 'Evidencia clínica'} className="h-40 w-full object-cover" />
            ) : item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" className="block p-3 text-sm underline">
                Abrir PDF
              </a>
            ) : null}
            <p className="p-2 text-xs text-pe-muted">
              {item.kind === 'study' ? 'Estudio' : 'Foto'}
              {item.caption ? ` · ${item.caption}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </ChartCard>
  );
}
