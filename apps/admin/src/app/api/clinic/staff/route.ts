import { NextResponse } from 'next/server';

import { canManageClinic, normalizeStaffRole, type StaffRole } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { ensureStaffUser, upsertMembership } from '@/lib/provision';

function canEdit(role: Parameters<typeof canManageClinic>[0], isPlatformAdmin: boolean) {
  return canManageClinic(role) || isPlatformAdmin;
}

async function activeOwnerCount(organizationId: string, exceptId?: string) {
  const supabase = createAdminClient();
  let query = supabase
    .from('staff_memberships')
    .select('id', { count: 'exact', head: true })
    .eq('organization_id', organizationId)
    .eq('role', 'owner')
    .eq('status', 'active');
  if (exceptId) query = query.neq('id', exceptId);
  const { count } = await query;
  return count ?? 0;
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para agregar al equipo.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    email?: string;
    fullName?: string;
    password?: string;
    role?: string;
    branchId?: string | null;
  } | null;
  const email = body?.email?.trim().toLowerCase() ?? '';
  const role = normalizeStaffRole(body?.role);
  if (!email || !role) {
    return NextResponse.json({ error: 'Correo y rol son obligatorios.' }, { status: 400 });
  }
  if (role === 'owner' && auth.role !== 'owner' && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Solo el dueño puede dar de alta a otro dueño.' }, { status: 403 });
  }

  const supabase = createAdminClient();
  if (body?.branchId) {
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', body.branchId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!branch) return NextResponse.json({ error: 'Esa sucursal no es de esta clínica.' }, { status: 400 });
  }

  try {
    const user = await ensureStaffUser({
      email,
      fullName: body?.fullName?.trim() || email,
      password: body?.password,
    });
    await upsertMembership({
      userId: user.userId,
      organizationId: auth.organizationId,
      branchId: body?.branchId || null,
      role,
    });
    return NextResponse.json({ ok: true, created: user.created });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo agregar al equipo.' },
      { status: 400 },
    );
  }
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para editar al equipo.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    fullName?: string;
    role?: string;
    branchId?: string | null;
    status?: 'active' | 'inactive';
  } | null;
  if (!body?.id) return NextResponse.json({ error: 'Falta el integrante.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from('staff_memberships')
    .select('id, user_id, role, status, branch_id')
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'No está en esta clínica.' }, { status: 404 });

  const nextRole = body.role !== undefined ? normalizeStaffRole(body.role) : normalizeStaffRole(row.role);
  if (body.role !== undefined && !nextRole) {
    return NextResponse.json({ error: 'Rol no válido.' }, { status: 400 });
  }
  if (nextRole === 'owner' && row.role !== 'owner' && auth.role !== 'owner' && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Solo el dueño puede nombrar a otro dueño.' }, { status: 403 });
  }

  const nextStatus = body.status ?? row.status;
  const leavingOwner =
    row.role === 'owner' && row.status === 'active' && (nextStatus === 'inactive' || nextRole !== 'owner');
  if (leavingOwner && (await activeOwnerCount(auth.organizationId, row.id)) < 1) {
    return NextResponse.json({ error: 'Deja al menos un dueño activo.' }, { status: 400 });
  }

  if (body.branchId) {
    const { data: branch } = await supabase
      .from('branches')
      .select('id')
      .eq('id', body.branchId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!branch) return NextResponse.json({ error: 'Esa sucursal no es de esta clínica.' }, { status: 400 });
  }

  const patch: { role?: StaffRole; branch_id?: string | null; status?: 'active' | 'inactive' } = {};
  if (nextRole) patch.role = nextRole;
  if (body.branchId !== undefined) patch.branch_id = body.branchId || null;
  if (body.status) patch.status = body.status;

  if (Object.keys(patch).length) {
    const { error } = await supabase
      .from('staff_memberships')
      .update(patch)
      .eq('id', row.id)
      .eq('organization_id', auth.organizationId);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  if (typeof body.fullName === 'string' && body.fullName.trim()) {
    const { error } = await supabase.from('profiles').update({ full_name: body.fullName.trim() }).eq('id', row.user_id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
