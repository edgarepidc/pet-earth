import { AdminShell } from '@/components/AdminShell';
import { ClinicSettings } from '@/components/ClinicSettings';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesList } from '@/lib/clinicLists';
import { pacConfigured } from '@/lib/cfdi';
import { canManageClinic } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const staff = await loadClinicSession();
  if (!canManageClinic(staff.role) && !staff.isPlatformAdmin) redirect('/');
  const supabase = createAdminClient();
  const [species, orgResult, branchesResult] = await Promise.all([
    loadSpeciesList(staff.organizationId),
    supabase.from('organizations').select('name, settings').eq('id', staff.organizationId).maybeSingle(),
    supabase
      .from('branches')
      .select('id, name, slug, address, is_active, settings')
      .eq('organization_id', staff.organizationId)
      .order('created_at', { ascending: true }),
  ]);
  const fiscal = ((orgResult.data?.settings as { fiscal?: Record<string, string | null> } | null)?.fiscal ?? {}) as {
    rfc?: string | null;
    razonSocial?: string | null;
    regimen?: string | null;
    codigoPostal?: string | null;
  };
  return (
    <AdminShell>
      <ClinicSettings
        species={species}
        clinicName={orgResult.data?.name ?? staff.organizationName}
        branches={branchesResult.data ?? []}
        fiscal={fiscal}
        pacReady={pacConfigured()}
      />
    </AdminShell>
  );
}
