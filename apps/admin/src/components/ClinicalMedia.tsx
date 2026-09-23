'use client';

import { useEffect, useState } from 'react';

import { formatMexicoDateTime } from '@petearth/shared';

import { ChartCard } from '@/components/SectionTitle';

type MediaItem = {
  id: string;
  kind: 'photo' | 'study';
  caption: string | null;
  content_type: string | null;
  url: string | null;
  created_at: string;
};

function kindLabel(kind: MediaItem['kind']) {
  return kind === 'study' ? 'Estudio / lab' : 'Foto';
}

function openMedia(url: string | null) {
  if (!url) return;
  window.open(url, '_blank', 'noopener,noreferrer');
}

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
  const [fileName, setFileName] = useState('');

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
    setFileName('');
    await load();
  }

  return (
    <ChartCard mark="consulta" title="Fotos y estudios">
      <p className="mt-1 text-sm text-pe-muted">Radiografías, laboratorios o fotos de lesión. Quedan en el expediente.</p>
      {error ? <p className="mt-2 text-sm text-pe-danger">{error}</p> : null}
      {canUpload ? (
        <form onSubmit={(event) => void upload(event)} className="mt-3 flex min-w-0 flex-nowrap items-center gap-2 overflow-x-auto">
          <label className="pe-btn-ghost max-w-[11rem] shrink-0 cursor-pointer truncate whitespace-nowrap px-3 py-2 text-sm">
            {fileName || 'Archivo'}
            <input
              className="sr-only"
              type="file"
              name="file"
              required
              accept="image/jpeg,image/png,image/webp,application/pdf"
              onChange={(event) => setFileName(event.target.files?.[0]?.name ?? '')}
            />
          </label>
          <input className="pe-input min-w-0 flex-1 py-2" name="caption" placeholder="Nota (opcional)" />
          <select className="pe-input w-36 shrink-0 py-2" name="kind" defaultValue="photo">
            <option value="photo">Foto</option>
            <option value="study">Estudio / lab</option>
          </select>
          <button type="submit" className="pe-btn-secondary shrink-0 whitespace-nowrap px-3 py-2 text-sm" disabled={busy}>
            {busy ? 'Subiendo…' : 'Subir'}
          </button>
        </form>
      ) : null}
      <div className="mt-3 overflow-x-auto">
        <table className="w-full min-w-[32rem] text-left text-sm">
          <thead>
            <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
              <th className="w-16 px-3 py-2.5">Vista</th>
              <th className="px-3 py-2.5">Tipo</th>
              <th className="px-3 py-2.5">Nota</th>
              <th className="px-3 py-2.5">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr className="border-b border-pe-line">
                <td className="px-3 py-6 text-pe-muted" colSpan={4}>
                  Sin fotos ni estudios aún.
                </td>
              </tr>
            ) : (
              items.map((item) => {
                const image = Boolean(item.url && item.content_type?.startsWith('image/'));
                return (
                  <tr
                    key={item.id}
                    className="cursor-pointer border-b border-pe-line bg-[#fbfcf8] shadow-[0_4px_14px_rgba(22,26,22,0.08)] last:border-0 hover:bg-white"
                    onClick={() => openMedia(item.url)}
                  >
                    <td className="border-l-[3px] border-pe-clay bg-[#eef2e6] px-3 py-2">
                      {image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.url ?? ''} alt="" className="h-9 w-12 rounded-md object-cover" />
                      ) : (
                        <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-pe-clay-700">
                          {item.content_type === 'application/pdf' ? 'PDF' : 'Archivo'}
                        </span>
                      )}
                    </td>
                    <td className="px-3 py-2.5 font-medium text-pe-ink">{kindLabel(item.kind)}</td>
                    <td className="max-w-[16rem] truncate px-3 py-2.5 text-pe-muted">{item.caption?.trim() || '—'}</td>
                    <td className="whitespace-nowrap px-3 py-2.5 text-pe-muted">{formatMexicoDateTime(item.created_at)}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </ChartCard>
  );
}
