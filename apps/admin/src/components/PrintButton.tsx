'use client';

export function PrintButton({ label = 'Imprimir / PDF' }: { label?: string }) {
  return (
    <button type="button" className="pe-btn-primary px-4 py-2 text-sm" onClick={() => window.print()}>
      {label}
    </button>
  );
}
