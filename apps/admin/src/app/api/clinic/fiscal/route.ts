import { NextResponse } from 'next/server';

import { canManageClinic } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function GET() {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('organizations')
    .select('id, name, settings')
    .eq('id', auth.organizationId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ organization: data });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canManageClinic(auth.role) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Solo el consultorio edita datos fiscales.' }, { status: 403 });
  }
  const body = (await request.json()) as {
    rfc?: string;
    razonSocial?: string;
    regimen?: string;
    codigoPostal?: string;
  };
  const supabase = createAdminClient();
  const { data: org } = await supabase
    .from('organizations')
    .select('settings')
    .eq('id', auth.organizationId)
    .single();
  const settings = {
    ...((org?.settings as Record<string, unknown> | null) ?? {}),
    fiscal: {
      rfc: body.rfc?.trim().toUpperCase() || null,
      razonSocial: body.razonSocial?.trim() || null,
      regimen: body.regimen?.trim() || '612',
      codigoPostal: body.codigoPostal?.trim() || null,
    },
  };
  const { error } = await supabase
    .from('organizations')
    .update({ settings })
    .eq('id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
