import { NextResponse } from 'next/server';

import { canManageClinic, letterheadPayload, parseLetterhead } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canManageClinic(auth.role) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Sin permiso para editar la clínica.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    letterhead?: {
      logo?: string | null;
      footer?: string;
      showAssessment?: boolean;
      showPlan?: boolean;
      showMeds?: boolean;
      showVaccines?: boolean;
    };
  } | null;
  const supabase = createAdminClient();
  const patch: { name?: string; settings?: Record<string, unknown> } = {};
  if (typeof body?.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (body?.letterhead) {
    const { data: org } = await supabase.from('organizations').select('settings').eq('id', auth.organizationId).maybeSingle();
    const current = (org?.settings as Record<string, unknown> | null) ?? {};
    patch.settings = { ...current, letterhead: letterheadPayload({ ...parseLetterhead(current), ...body.letterhead }) };
  }
  if (!patch.name && !patch.settings) {
    return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
  }
  const { error } = await supabase
    .from('organizations')
    .update({
      ...(patch.name ? { name: patch.name } : {}),
      ...(patch.settings ? { settings: patch.settings as never } : {}),
    })
    .eq('id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, name: patch.name });
}
