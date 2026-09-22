import { AdminShell } from '@/components/AdminShell';
import { ClinicSettings } from '@/components/ClinicSettings';
import type { ClinicStaffRow } from '@/components/ClinicTeam';
import { loadClinicSession } from '@/lib/auth';
import { loadSpeciesList } from '@/lib/clinicLists';
import { pacConfigured } from '@/lib/cfdi';
import { canManageClinic, normalizeStaffRole, parseLetterhead } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

export default async function ConfiguracionPage() {
  const staff = await loadClinicSession();
  if (!canManageClinic(staff.role) && !staff.isPlatformAdmin) redirect('/');
  const supabase = createAdminClient();
  const [species, orgResult, branchesResult, membershipsResult] = await Promise.all([
    loadSpeciesList(staff.organizationId),
    supabase.from('organizations').select('name, settings').eq('id', staff.organizationId).maybeSingle(),
    supabase
      .from('branches')
      .select('id, name, slug, address, is_active, settings')
      .eq('organization_id', staff.organizationId)
      .order('created_at', { ascending: true }),
    supabase
      .from('staff_memberships')
      .select('id, user_id, role, status, branch_id')
      .eq('organization_id', staff.organizationId)
      .order('created_at', { ascending: true }),
  ]);
  const memberships = membershipsResult.data ?? [];
  const userIds = [...new Set(memberships.map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name, license').in('id', userIds)
    : { data: [] };
  const emails = new Map<string, string>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emails.set(userId, data.user.email);
    }),
  );
  const team: ClinicStaffRow[] = memberships.flatMap((row) => {
    const role = normalizeStaffRole(row.role);
    if (!role) return [];
    return [
      {
        id: row.id,
        user_id: row.user_id,
        role,
        status: row.status === 'inactive' ? 'inactive' : 'active',
        branch_id: row.branch_id,
        fullName: profiles?.find((profile) => profile.id === row.user_id)?.full_name ?? null,
        email: emails.get(row.user_id) ?? null,
        license: profiles?.find((profile) => profile.id === row.user_id)?.license ?? null,
      },
    ];
  });
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
        staff={team}
        letterhead={parseLetterhead(orgResult.data?.settings)}
        fiscal={fiscal}
        pacReady={pacConfigured()}
      />
    </AdminShell>
  );
}
