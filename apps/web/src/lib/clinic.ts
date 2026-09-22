import { parseBranchSettings } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

const DEMO_ORG_ID = 'a0000000-0000-4000-8000-000000000001';
const DEMO_BRANCH_ID = 'b0000000-0000-4000-8000-000000000001';

const FALLBACK_BLURBS: Record<string, string> = {
  'SRV-CON': 'Primera visita o un problema nuevo: exploración, diagnóstico y plan.',
  'SRV-SEG': 'Revisión de un tratamiento, herida o post operatorio.',
  'SRV-VAC': 'Aplicación en consulta, con registro en la cartilla.',
  'VAC-SEX': 'Protección anual combinada, según calendario.',
  'VAC-RAB': 'Refuerzo antirrábico y registro de próxima dosis.',
  'MED-DES': 'Interna, dosificada por peso y especie.',
  'MED-MEL': 'Antiinflamatorio de uso en consulta, según indicación del veterinario.',
  'HYG-SHA': 'Shampoo suave para baño en casa, según piel y especie.',
  'HYG-TRE': 'Premios para higiene dental entre consultas.',
  'HYG-PAS': 'Pasta enzimática para cepillado en casa.',
  'HYG-WIP': 'Toallitas para patas y hocico después del paseo.',
  'HYG-BRU': 'Cepillo de cerdas para el pelaje entre visitas.',
};

const FALLBACK_IMAGES: Record<string, string> = {
  'SRV-CON': '/catalog/srv-con.jpg',
  'SRV-SEG': '/catalog/srv-seg.jpg',
  'SRV-VAC': '/catalog/srv-vac.jpg',
  'VAC-SEX': '/catalog/vac-sex.jpg',
  'VAC-RAB': '/catalog/vac-rab.jpg',
  'MED-DES': '/catalog/med-des.jpg',
  'MED-MEL': '/catalog/med-mel.jpg',
  'HYG-SHA': '/catalog/prod-sha.jpg',
  'HYG-TRE': '/catalog/prod-treat.jpg',
  'HYG-PAS': '/catalog/prod-paste.jpg',
  'HYG-WIP': '/catalog/prod-wipe.jpg',
  'HYG-BRU': '/catalog/prod-brush.jpg',
};

const BRANCH_IMAGES: Record<string, string> = {
  'roma-norte': '/catalog/srv-con.jpg',
  condesa: '/catalog/branch-con.jpg',
};

const DEFAULT_HOURS = 'Lunes a sábado · 9:00 a 19:00';

export type PublicCatalogItem = {
  id: string;
  name: string;
  sku: string | null;
  unit_price: number;
  kind: 'service' | 'product';
  blurb: string;
  image: string;
};

export type PublicBranch = {
  id: string;
  name: string;
  slug: string;
  address: string;
  hours: string;
  phone: string;
  image: string;
};

export const PUBLIC_ORG_ID = DEMO_ORG_ID;
export const PUBLIC_BRANCH_ID = DEMO_BRANCH_ID;

export function internalPath(value?: string | null) {
  if (!value || !value.startsWith('/') || value.startsWith('//')) return '/cuenta';
  return value;
}

export function publicMediaUrl(value?: string | null, sku?: string | null) {
  if (value && (value.startsWith('/catalog/') || value.startsWith('/marks/') || value.startsWith('https://'))) {
    return value;
  }
  return FALLBACK_IMAGES[sku ?? ''] ?? '/marks/catalogo.png';
}

function settingsImage(settings: unknown, slug: string) {
  const image = parseBranchSettings(settings).image;
  if (image) return publicMediaUrl(image);
  return BRANCH_IMAGES[slug] ?? '/catalog/srv-con.jpg';
}

export function scheduleHref(signedIn: boolean, pets: { id: string }[], sku?: string | null) {
  const query = sku ? `?agendar=${encodeURIComponent(sku)}` : '';
  if (!signedIn) return `/login?next=${encodeURIComponent(`/cuenta${query}`)}`;
  if (pets.length === 1) return `/mascotas/${pets[0].id}${query}`;
  return `/cuenta${query}`;
}

export async function loadPublicClinic(preferredBranchId?: string | null) {
  const supabase = createAdminClient();
  const [{ data: org }, { data: branchRows }, { data: catalog }] = await Promise.all([
    supabase.from('organizations').select('id, name').eq('id', DEMO_ORG_ID).maybeSingle(),
    supabase
      .from('branches')
      .select('id, name, slug, address, settings')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('is_active', true)
      .order('created_at', { ascending: true }),
    supabase
      .from('catalog_items')
      .select('id, name, sku, unit_price, kind, description, image_url')
      .eq('organization_id', DEMO_ORG_ID)
      .eq('is_active', true)
      .order('kind', { ascending: true })
      .order('name', { ascending: true }),
  ]);

  const branches: PublicBranch[] = (branchRows ?? []).map((branch) => {
    const schedule = parseBranchSettings(branch.settings);
    return {
      id: branch.id,
      name: branch.name,
      slug: branch.slug,
      address: branch.address ?? '',
      hours: schedule.hours || DEFAULT_HOURS,
      phone: schedule.phone ?? '',
      image: settingsImage(branch.settings, branch.slug),
    };
  });

  const selected =
    branches.find((branch) => branch.id === preferredBranchId) ??
    branches.find((branch) => branch.id === DEMO_BRANCH_ID) ??
    branches[0];

  const items: PublicCatalogItem[] = (catalog ?? []).map((item) => ({
    id: item.id,
    name: item.name,
    sku: item.sku,
    unit_price: Number(item.unit_price),
    kind: item.kind,
    blurb: item.description?.trim() || FALLBACK_BLURBS[item.sku ?? ''] || 'Se documenta en consulta y queda en el expediente.',
    image: publicMediaUrl(item.image_url, item.sku),
  }));

  const serviceOrder = ['SRV-CON', 'SRV-SEG', 'SRV-VAC'];
  const productOrder = ['VAC-SEX', 'VAC-RAB', 'MED-DES', 'MED-MEL', 'HYG-SHA', 'HYG-BRU', 'HYG-TRE', 'HYG-PAS', 'HYG-WIP'];
  const bySku = (order: string[]) => (a: PublicCatalogItem, b: PublicCatalogItem) => {
    const ai = order.indexOf(a.sku ?? '');
    const bi = order.indexOf(b.sku ?? '');
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  };

  return {
    name: org?.name ?? 'Clínica Pet Earth',
    branches,
    selectedBranch: selected ?? {
      id: DEMO_BRANCH_ID,
      name: 'Roma Norte',
      slug: 'roma-norte',
      address: 'Roma Norte, CDMX',
      hours: DEFAULT_HOURS,
      phone: '',
      image: '/catalog/srv-con.jpg',
    },
    branchName: selected?.name ?? 'Roma Norte',
    address: selected?.address ?? 'Roma Norte, CDMX',
    hours: selected?.hours ?? DEFAULT_HOURS,
    services: items.filter((item) => item.kind === 'service').sort(bySku(serviceOrder)),
    products: items.filter((item) => item.kind === 'product').sort(bySku(productOrder)),
  };
}
