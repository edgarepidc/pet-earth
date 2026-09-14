export const CFDI_USOS = ['G03', 'G01', 'D01', 'S01'] as const;
export type CfdiUso = (typeof CFDI_USOS)[number];

export const CFDI_USO_LABELS: Record<CfdiUso, string> = {
  G03: 'G03 · Gastos en general',
  G01: 'G01 · Adquisición de mercancías',
  D01: 'D01 · Honorarios médicos',
  S01: 'S01 · Sin efectos fiscales',
};

export type CfdiStatus = 'none' | 'requested' | 'stamped' | 'error';

export const CFDI_STATUS_LABELS: Record<CfdiStatus, string> = {
  none: 'Sin factura',
  requested: 'Lista para timbrar',
  stamped: 'Timbrada',
  error: 'Error al timbrar',
};

export function normalizeRfc(value: string | null | undefined): string | null {
  const rfc = (value ?? '').toUpperCase().replace(/[^A-Z0-9Ñ&]/g, '');
  if (rfc.length < 12 || rfc.length > 13) return null;
  return rfc;
}
