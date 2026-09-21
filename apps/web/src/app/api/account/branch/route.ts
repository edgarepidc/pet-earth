import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { getTutorContext } from '@/lib/tutor';

export async function PATCH(request: Request) {
  const tutor = await getTutorContext();
  if (!tutor) return NextResponse.json({ error: 'Inicia sesión.' }, { status: 401 });

  const body = (await request.json()) as { branchId?: string };
  if (!body.branchId) return NextResponse.json({ error: 'Elige una sucursal.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: branch } = await supabase
    .from('branches')
    .select('id')
    .eq('id', body.branchId)
    .eq('organization_id', tutor.organizationId)
    .eq('is_active', true)
    .maybeSingle();
  if (!branch) return NextResponse.json({ error: 'Esa sucursal no está en esta clínica.' }, { status: 400 });

  const { error } = await supabase
    .from('clients')
    .update({ preferred_branch_id: branch.id })
    .eq('id', tutor.clientId)
    .eq('organization_id', tutor.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  return NextResponse.json({ ok: true });
}
