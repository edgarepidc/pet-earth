export function roundMoney(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

export function lineTotal(quantity: number, unitPrice: number): number {
  return roundMoney(quantity * unitPrice);
}

export type InvoiceSplitLine = {
  kind: 'service' | 'product';
  lineTotal: number;
};

export function splitInvoiceTotals(lines: InvoiceSplitLine[]): {
  services: number;
  products: number;
  total: number;
} {
  const services = roundMoney(
    lines.filter((line) => line.kind === 'service').reduce((sum, line) => sum + line.lineTotal, 0),
  );
  const products = roundMoney(
    lines.filter((line) => line.kind === 'product').reduce((sum, line) => sum + line.lineTotal, 0),
  );
  return { services, products, total: roundMoney(services + products) };
}

export function formatMoney(value: number, currency = 'MXN'): string {
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
  }).format(value);
}
