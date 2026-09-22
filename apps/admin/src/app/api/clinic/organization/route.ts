import { NextResponse } from 'next/server';

import { canManageClinic } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canManageClinic(auth.role) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Sin permiso para editar la clínica.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as { name?: string } | null;
  const name = body?.name?.trim() ?? '';
  if (!name) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase.from('organizations').update({ name }).eq('id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, name });
}
