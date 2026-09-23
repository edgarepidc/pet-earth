'use client';

import { useState } from 'react';

import {
  isMobileWhatsAppShare,
  mexicoWhatsAppNumber,
  recetaWhatsAppAttachText,
  recetaWhatsAppText,
  slugify,
  whatsappHref,
} from '@petearth/shared';

import { downloadFile, sheetToPdf } from '@/lib/sheetPdf';

export function RecetaWhatsAppButton({
  phone,
  tutorName,
  patientName,
  clinicName,
  sheetId = 'pe-print-sheet',
}: {
  phone: string | null | undefined;
  tutorName: string;
  patientName: string;
  clinicName: string;
  sheetId?: string;
}) {
  const [busy, setBusy] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const number = mexicoWhatsAppNumber(phone);

  async function send() {
    if (!number) {
      setHint('Falta el teléfono del tutor.');
      return;
    }
    const sheet = document.getElementById(sheetId);
    if (!sheet) {
      setHint('No se encontró la receta para armar el PDF.');
      return;
    }
    const text = recetaWhatsAppText({ tutorName, patientName, clinicName });
    const attachText = recetaWhatsAppAttachText({ tutorName, patientName, clinicName });
    const href = whatsappHref(phone, attachText);
    const useShare = isMobileWhatsAppShare(navigator.userAgent);

    // Open the chat in the same click; waiting for the PDF lets the browser block the popup.
    if (!useShare && href) {
      window.open(href, '_blank', 'noopener,noreferrer');
    }

    setBusy(true);
    setHint(null);
    try {
      const file = await sheetToPdf(sheet, `receta-${slugify(patientName)}.pdf`);
      if (useShare) {
        const shareData: ShareData = { files: [file], title: 'Receta y alta', text };
        try {
          if (navigator.canShare?.(shareData)) {
            await navigator.share(shareData);
            return;
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') return;
        }
        if (href) window.open(href, '_blank', 'noopener,noreferrer');
      }
      downloadFile(file);
      setHint('Se descargó el PDF. En WhatsApp pica el clip y adjúntalo a este chat.');
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') return;
      setHint('No se pudo armar el PDF. Usa Imprimir / PDF y adjúntalo a mano.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <span className="flex max-w-xs flex-col items-end gap-1">
      <button
        type="button"
        className="pe-btn-secondary px-4 py-2 text-sm"
        disabled={busy || !number}
        onClick={() => void send()}
      >
        {busy ? 'Armando PDF…' : 'WhatsApp PDF'}
      </button>
      {hint ? <span className="text-right text-xs text-pe-muted">{hint}</span> : null}
      {!number ? <span className="text-right text-xs text-pe-muted">Sin teléfono del tutor.</span> : null}
    </span>
  );
}
