import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { createAdminClient } from '@petearth/supabase/admin';

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const supabase = createAdminClient();
  const { data: org, error } = await supabase
    .from('organizations')
    .select('id, name, slug, created_at')
    .eq('id', id)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!org) return NextResponse.json({ error: 'Clínica no encontrada.' }, { status: 404 });

  const [{ data: branches }, { data: memberships }] = await Promise.all([
    supabase
      .from('branches')
      .select('id, name, slug, address, is_active, created_at')
      .eq('organization_id', id)
      .order('created_at'),
    supabase
      .from('staff_memberships')
      .select('id, user_id, role, status, branch_id, created_at')
      .eq('organization_id', id)
      .order('created_at'),
  ]);

  const userIds = [...new Set((memberships ?? []).map((row) => row.user_id))];
  const { data: profiles } = userIds.length
    ? await supabase.from('profiles').select('id, full_name').in('id', userIds)
    : { data: [] };

  const emails = new Map<string, string>();
  for (const userId of userIds) {
    const { data } = await supabase.auth.admin.getUserById(userId);
    if (data.user?.email) emails.set(userId, data.user.email);
  }

  return NextResponse.json({
    organization: org,
    branches: branches ?? [],
    staff: (memberships ?? []).map((row) => ({
      ...row,
      fullName: profiles?.find((profile) => profile.id === row.user_id)?.full_name ?? null,
      email: emails.get(row.user_id) ?? null,
    })),
  });
}
