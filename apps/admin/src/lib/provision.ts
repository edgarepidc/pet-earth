import { slugify, type StaffRole } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';
import type { User } from '@supabase/supabase-js';

const DEFAULT_CATALOG: {
  kind: 'service' | 'product';
  name: string;
  sku: string;
  unit_price: number;
  stock: number | null;
}[] = [
  { kind: 'service', name: 'Consulta general', sku: 'SRV-CON', unit_price: 450, stock: null },
  { kind: 'service', name: 'Consulta de seguimiento', sku: 'SRV-SEG', unit_price: 280, stock: null },
  { kind: 'service', name: 'Aplicación de vacuna', sku: 'SRV-VAC', unit_price: 80, stock: null },
  { kind: 'product', name: 'Vacuna séxtuple', sku: 'VAC-SEX', unit_price: 650, stock: 10 },
  { kind: 'product', name: 'Vacuna antirrábica', sku: 'VAC-RAB', unit_price: 380, stock: 10 },
  { kind: 'product', name: 'Desparasitación', sku: 'MED-DES', unit_price: 220, stock: 20 },
];

function admin() {
  return createAdminClient();
}

export async function uniqueOrganizationSlug(name: string): Promise<string> {
  const supabase = admin();
  const base = slugify(name);
  for (let i = 0; i < 40; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase.from('organizations').select('id').eq('slug', candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function uniqueBranchSlug(organizationId: string, name: string): Promise<string> {
  const supabase = admin();
  const base = slugify(name);
  for (let i = 0; i < 40; i += 1) {
    const candidate = i === 0 ? base : `${base}-${i + 1}`;
    const { data } = await supabase
      .from('branches')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('slug', candidate)
      .maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-${Date.now().toString(36)}`;
}

export async function seedDefaultCatalog(organizationId: string) {
  const supabase = admin();
  await supabase.from('catalog_items').insert(
    DEFAULT_CATALOG.map((item) => ({
      organization_id: organizationId,
      kind: item.kind,
      name: item.name,
      sku: item.sku,
      unit_price: item.unit_price,
      stock: item.stock,
      min_stock: item.kind === 'product' ? 4 : null,
      is_active: true,
    })),
  );
}

export async function findAuthUserByEmail(email: string): Promise<User | null> {
  const supabase = admin();
  const normalized = email.trim().toLowerCase();
  let page = 1;
  for (;;) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);
    const found = data.users.find((user) => user.email?.toLowerCase() === normalized);
    if (found) return found;
    if (data.users.length < 200) return null;
    page += 1;
  }
}

export async function ensureStaffUser(input: {
  email: string;
  fullName: string;
  password?: string;
}): Promise<{ userId: string; created: boolean }> {
  const supabase = admin();
  const email = input.email.trim().toLowerCase();
  const existing = await findAuthUserByEmail(email);
  if (existing) {
    await supabase
      .from('profiles')
      .update({ full_name: input.fullName })
      .eq('id', existing.id);
    return { userId: existing.id, created: false };
  }
  if (!input.password || input.password.length < 8) {
    throw new Error('La contraseña debe tener al menos 8 caracteres.');
  }
  const { data, error } = await supabase.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: { full_name: input.fullName },
  });
  if (error || !data.user) {
    throw new Error(error?.message ?? 'No se pudo crear el usuario.');
  }
  await supabase.from('profiles').upsert({
    id: data.user.id,
    full_name: input.fullName,
    is_platform_admin: false,
  });
  return { userId: data.user.id, created: true };
}

export async function upsertMembership(input: {
  userId: string;
  organizationId: string;
  branchId: string | null;
  role: StaffRole;
}) {
  const supabase = admin();
  const { error } = await supabase.from('staff_memberships').upsert(
    {
      user_id: input.userId,
      organization_id: input.organizationId,
      branch_id: input.branchId,
      role: input.role,
      status: 'active',
    },
    { onConflict: 'user_id,organization_id' },
  );
  if (error) throw new Error(error.message);
}

export async function provisionClinic(input: {
  clinicName: string;
  branchName: string;
  address?: string;
  ownerName: string;
  ownerEmail: string;
  ownerPassword: string;
}) {
  const supabase = admin();
  const clinicName = input.clinicName.trim();
  const branchName = input.branchName.trim() || 'Principal';
  if (!clinicName) throw new Error('El nombre de la veterinaria es obligatorio.');

  const owner = await ensureStaffUser({
    email: input.ownerEmail,
    fullName: input.ownerName.trim() || input.ownerEmail,
    password: input.ownerPassword,
  });

  const slug = await uniqueOrganizationSlug(clinicName);
  const { data: org, error: orgError } = await supabase
    .from('organizations')
    .insert({ name: clinicName, slug })
    .select('id, name, slug')
    .single();
  if (orgError || !org) throw new Error(orgError?.message ?? 'No se pudo crear la clínica.');

  const branchSlug = await uniqueBranchSlug(org.id, branchName);
  const { data: branch, error: branchError } = await supabase
    .from('branches')
    .insert({
      organization_id: org.id,
      name: branchName,
      slug: branchSlug,
      address: input.address?.trim() || null,
    })
    .select('id, name, slug')
    .single();
  if (branchError || !branch) throw new Error(branchError?.message ?? 'No se pudo crear la sucursal.');

  await upsertMembership({
    userId: owner.userId,
    organizationId: org.id,
    branchId: branch.id,
    role: 'owner',
  });
  await seedDefaultCatalog(org.id);

  return { organization: org, branch, ownerCreated: owner.created };
}
