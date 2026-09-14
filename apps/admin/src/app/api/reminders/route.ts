import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { loadFollowUps } from '@/lib/queries';

export async function GET() {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  try {
    const reminders = await loadFollowUps(auth.organizationId);
    return NextResponse.json({ reminders });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Error' }, { status: 400 });
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as { id?: string; status?: 'done' | 'cancelled' };
  if (!body.id || !body.status) return NextResponse.json({ error: 'Falta el recordatorio' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('reminders')
    .update({ status: body.status })
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
