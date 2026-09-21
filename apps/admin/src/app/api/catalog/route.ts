import { NextResponse } from 'next/server';

import { canManageCatalog, type StaffRole } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

function canEdit(role: StaffRole, isPlatformAdmin: boolean) {
  return canManageCatalog(role) || role === 'vet' || isPlatformAdmin;
}

function mediaUrl(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.startsWith('/catalog/') || trimmed.startsWith('/marks/') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

export async function GET() {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('catalog_items')
    .select('*')
    .eq('organization_id', auth.organizationId)
    .order('kind')
    .order('name');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para editar el catálogo.' }, { status: 403 });
  }
  const body = (await request.json()) as {
    kind?: 'service' | 'product';
    name?: string;
    sku?: string | null;
    unitPrice?: number;
    description?: string | null;
    imageUrl?: string | null;
    stock?: number | null;
    minStock?: number | null;
  };
  if (!body.name?.trim() || !body.kind) {
    return NextResponse.json({ error: 'Nombre y tipo son obligatorios.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('catalog_items')
    .insert({
      organization_id: auth.organizationId,
      kind: body.kind,
      name: body.name.trim(),
      sku: body.sku?.trim() || null,
      unit_price: body.unitPrice ?? 0,
      description: body.description?.trim() || null,
      image_url: mediaUrl(body.imageUrl),
      stock: body.kind === 'product' ? (body.stock ?? 0) : null,
      min_stock: body.kind === 'product' ? (body.minStock ?? 4) : null,
      is_active: true,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para editar el catálogo.' }, { status: 403 });
  }
  const body = (await request.json()) as {
    id?: string;
    name?: string;
    sku?: string | null;
    unitPrice?: number;
    description?: string | null;
    imageUrl?: string | null;
    stock?: number | null;
    minStock?: number | null;
    isActive?: boolean;
  };
  if (!body.id) return NextResponse.json({ error: 'Falta el ítem.' }, { status: 400 });
  const supabase = createAdminClient();
  const patch: {
    name?: string;
    sku?: string | null;
    unit_price?: number;
    description?: string | null;
    image_url?: string | null;
    stock?: number | null;
    min_stock?: number | null;
    is_active?: boolean;
  } = {};
  if (body.name !== undefined) patch.name = body.name.trim();
  if (body.sku !== undefined) patch.sku = body.sku?.trim() || null;
  if (body.unitPrice !== undefined) patch.unit_price = body.unitPrice;
  if (body.description !== undefined) patch.description = body.description?.trim() || null;
  if (body.imageUrl !== undefined) patch.image_url = mediaUrl(body.imageUrl);
  if (body.stock !== undefined) patch.stock = body.stock;
  if (body.minStock !== undefined) patch.min_stock = body.minStock;
  if (body.isActive !== undefined) patch.is_active = body.isActive;
  const { error } = await supabase
    .from('catalog_items')
    .update(patch)
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
