import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { CatalogManager } from '@/components/CatalogManager';
import { loadClinicSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function CatalogoPage() {
  const staff = await loadClinicSession();
  const { data } = await createAdminClient()
    .from('catalog_items')
    .select('*')
    .eq('organization_id', staff.organizationId)
    .order('kind')
    .order('name');
  return (
    <AdminShell>
      <CatalogManager items={data ?? []} />
    </AdminShell>
  );
}
