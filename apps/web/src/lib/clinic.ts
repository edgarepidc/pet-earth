import { createAdminClient } from '@petearth/supabase/admin';

const DEMO_ORG_ID = 'a0000000-0000-4000-8000-000000000001';
const DEMO_BRANCH_ID = 'b0000000-0000-4000-8000-000000000001';

const SERVICE_BLURBS: Record<string, string> = {
  'SRV-CON': 'Primera visita o un problema nuevo: exploración, diagnóstico y plan.',
  'SRV-SEG': 'Revisión de un tratamiento, herida o post operatorio.',
  'SRV-VAC': 'Aplicación en consulta, con registro en la cartilla.',
  'VAC-SEX': 'Protección anual combinada, según calendario.',
  'VAC-RAB': 'Refuerzo antirrábico y registro de próxima dosis.',
  'MED-DES': 'Interna, dosificada por peso y especie.',
  'MED-MEL': 'Antiinflamatorio de uso en consulta, según indicación del veterinario.',
};

export type PublicCatalogItem = {
  id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  kind: 'service' | 'product';
  blurb: string;
};

export async function loadPublicClinic() {
  const supabase = createAdminClient();
  const [{ data: org }, { data: branch }, { data: catalog }] = await Promise.all([
    supabase.from('organizations').select('id, name').eq('id', DEMO_ORG_ID).maybeSingle(),
    supabase.from('branches').select('name, address').eq('id', DEMO_BRANCH_ID).maybeSingle(),
    supabase
      .from('catalog_items')
      .select('id, name, sku, unit_price, kind')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('is_active', true)
      .order('kind', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  const items: PublicCatalogItem[] = (catalog ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit_price: Number(item.unit_price),
    kind: item.kind,
    blurb: SERVICE_BLURBS[item.sku ?? ''] ?? 'Se documenta en consulta y queda en el expediente.',
  }));

  const serviceOrder = ['SRV-CON', 'SRV-SEG', 'SRV-VAC'];
  const services = items
    .filter((item) => item.kind === 'service')
    .sort((a, b) => serviceOrder.indexOf(a.sku ?? '') - serviceOrder.indexOf(b.sku ?? ''));

  return {
    name: org?.name ?? 'Clínica Pet Earth',
    branchName: branch?.name ?? 'Roma Norte',
    address: branch?.address ?? 'Roma Norte, CDMX',
    hours: 'Lunes a sábado · 9:00 a 19:00',
    services,
    products: items.filter((item) => item.kind === 'product'),
  };
}
