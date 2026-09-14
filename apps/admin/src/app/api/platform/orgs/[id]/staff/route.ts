import { NextResponse } from 'next/server';

import { normalizeStaffRole } from '@petearth/shared';

import { requirePlatformApi } from '@/lib/auth';
import { ensureStaffUser, upsertMembership } from '@/lib/provision';
import { createAdminClient } from '@petearth/supabase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    fullName?: string;
    password?: string;
    role?: string;
    branchId?: string | null;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  const role = normalizeStaffRole(body?.role);
  if (!body || !email || !role) {
    return NextResponse.json({ error: 'Correo y rol son obligatorios.' }, { status: 400 });
  }

  const supabase = createAdminClient();
  const { data: org } = await supabase.from('organizations').select('id').eq('id', id).maybeSingle();
  if (!org) return NextResponse.json({ error: 'Clínica no encontrada.' }, { status: 404 });

  if (body.branchId) {
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', body.branchId)
      .eq('organization_id', id)
      .maybeSingle();
    if (!branch) return NextResponse.json({ error: 'La sucursal no pertenece a esta clínica.' }, { status: 400 });
  }

  try {
    const user = await ensureStaffUser({
      email,
      fullName: body?.fullName?.trim() || email,
      password: body?.password,
    });
    await upsertMembership({
      userId: user.userId,
      organizationId: id,
      branchId: body.branchId || null,
      role,
    });
    return NextResponse.json({ ok: true, created: user.created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo agregar al staff.' },
      { status: 400 },
    );
  }
}
