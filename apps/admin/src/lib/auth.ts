import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';

import { normalizeStaffRole, type StaffRole } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import {
  listOrgBranches,
  readTenantCookies,
  resolveTenantByIds,
  resolveWorkingTenant,
  type BranchOption,
  type TenantContext,
} from '@/lib/tenant';

export interface PlatformContext {
  userId: string;
  email: string;
  fullName: string | null;
}

export interface StaffContext extends TenantContext {
  userId: string;
  email: string;
  fullName: string | null;
  license: string | null;
  role: StaffRole;
  isPlatformAdmin: boolean;
  viaPlatform: boolean;
  branches: BranchOption[];
}

async function readAuthUser() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return user?.email ? user : null;
}

export async function getPlatformSession(): Promise<PlatformContext | null> {
  const user = await readAuthUser();
  if (!user?.email) return null;
  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();
  if (!profile?.is_platform_admin) return null;
  return {
    userId: user.id,
    email: user.email,
    fullName: profile.full_name ?? null,
  };
}

async function buildStaffContext(input: {
  userId: string;
  email: string;
  fullName: string | null;
  license: string | null;
  isPlatformAdmin: boolean;
  viaPlatform: boolean;
  tenant: TenantContext;
}): Promise<StaffContext | null> {
  const admin = createAdminClient();
  const { data: membership } = await admin
    .from('staff_memberships')
    .select('role, status')
    .eq('user_id', input.userId)
    .eq('organization_id', input.tenant.organizationId)
    .eq('status', 'active')
    .maybeSingle();

  const role = normalizeStaffRole(membership?.role ?? null);
  if (!membership || !role) {
    if (!input.isPlatformAdmin) return null;
  }

  const branches = await listOrgBranches(input.tenant.organizationId);

  return {
    ...input.tenant,
    userId: input.userId,
    email: input.email,
    fullName: input.fullName,
    license: input.license,
    role: role ?? 'owner',
    isPlatformAdmin: input.isPlatformAdmin,
    viaPlatform: input.viaPlatform,
    branches,
  };
}

export async function getStaffSession(): Promise<StaffContext | null> {
  const user = await readAuthUser();
  if (!user?.email) return null;

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('full_name, license, is_platform_admin')
    .eq('id', user.id)
    .maybeSingle();

  const isPlatformAdmin = Boolean(profile?.is_platform_admin);
  const preferred = await readTenantCookies();

  if (isPlatformAdmin && preferred) {
    const tenant = await resolveTenantByIds(preferred.organizationId, preferred.branchId);
    if (tenant) {
      return buildStaffContext({
        userId: user.id,
        email: user.email,
        fullName: profile?.full_name ?? null,
        license: profile?.license ?? null,
        isPlatformAdmin: true,
        viaPlatform: true,
        tenant,
      });
    }
  }

  const tenant = await resolveWorkingTenant(user.id, preferred);
  if (!tenant) return null;

  return buildStaffContext({
    userId: user.id,
    email: user.email,
    fullName: profile?.full_name ?? null,
    license: profile?.license ?? null,
    isPlatformAdmin,
    viaPlatform: false,
    tenant,
  });
}

export async function loadClinicSession(): Promise<StaffContext> {
  const staff = await getStaffSession();
  if (staff) return staff;
  if (await getPlatformSession()) redirect('/plataforma');
  redirect('/login');
}

export async function loadPlatformSession(): Promise<PlatformContext> {
  const session = await getPlatformSession();
  if (session) return session;
  const staff = await getStaffSession();
  if (staff) redirect('/');
  redirect('/login');
}

export async function requireStaff(): Promise<StaffContext> {
  const session = await getStaffSession();
  if (!session) throw new Error('No autorizado');
  return session;
}

export async function requireStaffApi(): Promise<StaffContext | NextResponse> {
  try {
    return await requireStaff();
  } catch {
    return NextResponse.json({ error: 'Sesión inválida o sin permisos' }, { status: 401 });
  }
}

export async function requirePlatformApi(): Promise<PlatformContext | NextResponse> {
  const session = await getPlatformSession();
  if (!session) {
    return NextResponse.json({ error: 'Solo el super admin de plataforma.' }, { status: 403 });
  }
  return session;
}
