'use client';

import { useEffect, useState } from 'react';

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
    <section className="pe-card p-4">
      <h2 className="font-semibold">Fotos y estudios</h2>
      <p className="mt-1 text-sm text-[#6b5e55]">Radiografías, laboratorios o fotos de lesión. Quedan en el expediente.</p>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
      {canUpload ? (
        <form onSubmit={(event) => void upload(event)} className="mt-3 grid gap-2 md:grid-cols-[1fr_auto_auto]">
          <input className="pe-input" type="file" name="file" required accept="image/jpeg,image/png,image/webp,application/pdf" />
          <select className="pe-input" name="kind" defaultValue="photo">
            <option value="photo">Foto</option>
            <option value="study">Estudio / lab</option>
          </select>
          <button type="submit" className="pe-btn-secondary px-3 py-2 text-sm" disabled={busy}>
            {busy ? 'Subiendo…' : 'Subir'}
          </button>
          <input className="pe-input md:col-span-3" name="caption" placeholder="Nota (opcional)" />
        </form>
      ) : null}
      <ul className="mt-4 grid gap-3 sm:grid-cols-2">
        {items.map((item) => (
          <li key={item.id} className="overflow-hidden rounded-md border border-[var(--pe-line)] bg-white">
            {item.url && item.content_type?.startsWith('image/') ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={item.url} alt={item.caption || 'Evidencia clínica'} className="h-40 w-full object-cover" />
            ) : item.url ? (
              <a href={item.url} target="_blank" rel="noreferrer" className="block p-3 text-sm underline">
                Abrir PDF
              </a>
            ) : null}
            <p className="p-2 text-xs text-[#6b5e55]">
              {item.kind === 'study' ? 'Estudio' : 'Foto'}
              {item.caption ? ` · ${item.caption}` : ''}
            </p>
          </li>
        ))}
      </ul>
    </section>
  );
}
