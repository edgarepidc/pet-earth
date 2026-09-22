'use client';

import { useState } from 'react';

export type PublicPhotoFolder = 'branches' | 'letterhead' | 'catalog';

export function PublicPhotoField({
  src,
  name,
  folder,
  disabled,
  onUploaded,
}: {
  src: string | null;
  name?: string;
  folder: PublicPhotoFolder;
  disabled?: boolean;
  onUploaded: (url: string) => void;
}) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function upload(file: File) {
    setError(null);
    setUploading(true);
    const data = new FormData();
    data.set('file', file);
    data.set('folder', folder);
    const response = await fetch('/api/clinic/public-media', { method: 'POST', body: data });
    const payload = (await response.json().catch(() => null)) as { url?: string; error?: string } | null;
    setUploading(false);
    if (!response.ok || !payload?.url) {
      setError(payload?.error ?? 'No se pudo subir la foto.');
      return;
    }
    onUploaded(payload.url);
  }

  return (
    <span className="inline-flex flex-wrap items-center gap-2">
      {src ? (
        <img src={src} alt="" className="h-11 w-14 rounded-md object-cover" />
      ) : (
        <span className="flex h-11 w-14 items-center justify-center rounded-md bg-[#eef2e6] text-[10px] font-bold uppercase tracking-[0.08em] text-pe-clay-700">
          {(name ?? '·').slice(0, 1)}
        </span>
      )}
      <label className="pe-btn-ghost cursor-pointer px-3 py-1.5 text-sm">
        {uploading ? 'Subiendo…' : src ? 'Cambiar foto' : 'Cargar foto'}
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="sr-only"
          disabled={disabled || uploading}
          onChange={(event) => {
            const file = event.target.files?.[0];
            event.target.value = '';
            if (file) void upload(file);
          }}
        />
      </label>
      {error ? <span className="text-sm text-pe-danger">{error}</span> : null}
    </span>
  );
}
