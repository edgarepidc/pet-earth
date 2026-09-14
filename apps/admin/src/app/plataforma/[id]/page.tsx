import { notFound } from 'next/navigation';

import { createAdminClient } from '@petearth/supabase/admin';

import { OrgWorkspace } from '@/components/OrgWorkspace';
import { PlatformShell } from '@/components/PlatformShell';
import { loadPlatformSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function ClinicaDetallePage({ params }: { params: Promise<{ id: string }> }) {
  await loadPlatformSession();
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('id, name, slug')
    .eq('id', id)
    .maybeSingle();
  if (!org) notFound();

  const [{ data: branches }, { data: memberships }] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, slug, address, is_active')
      .eq('organization_id', id)
      .order('created_at'),
    supabase
      .from('staff_memberships')
      .select('id, user_id, role, status, branch_id')
      .eq('organization_id', id)
      .order('created_at'),
  ]);

  const userIds = [...new Set((memberships ?? []).map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };

  const emails = new Map<string, string>();
  await Promise.all(
    userIds.map(async (userId) => {
      const { data } = await supabase.auth.admin.getUserById(userId);
      if (data.user?.email) emails.set(userId, data.user.email);
    }),
  );

  return (
    <PlatformShell>
      <OrgWorkspace
        organization={org}
        branches={branches ?? []}
        staff={(memberships ?? []).map((row) => ({
          ...row,
          fullName: profiles?.find((profile) => profile.id === row.user_id)?.full_name ?? null,
          email: emails.get(row.user_id) ?? null,
        }))}
      />
    </PlatformShell>
  );
}
