'use client';

export async function sheetToPdf(element: HTMLElement, fileName: string): Promise<File> {
  const [{ default: html2canvas }, { jsPDF }] = await Promise.all([import('html2canvas'), import('jspdf')]);
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: '#ffffff',
    logging: false,
  });
  const pdf = new jsPDF({ unit: 'mm', format: 'letter', orientation: 'portrait' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 10;
  const usableWidth = pageWidth - margin * 2;
  const imgHeight = (canvas.height * usableWidth) / canvas.width;
  const image = canvas.toDataURL('image/jpeg', 0.92);
  let remaining = imgHeight;
  let offset = margin;

  pdf.addImage(image, 'JPEG', margin, offset, usableWidth, imgHeight);
  remaining -= pageHeight - margin;
  while (remaining > 0) {
    offset -= pageHeight;
    pdf.addPage();
    pdf.addImage(image, 'JPEG', margin, offset, usableWidth, imgHeight);
    remaining -= pageHeight;
  }

  return new File([pdf.output('blob')], fileName, { type: 'application/pdf' });
}

export function downloadFile(file: File) {
  const url = URL.createObjectURL(file);
  const link = document.createElement('a');
  link.href = url;
  link.download = file.name;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 2_000);
}
