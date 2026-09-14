import { NextResponse } from 'next/server';

import { canManageCatalog } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

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
  if (!canManageCatalog(auth.role) && auth.role !== 'vet' && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Sin permiso para editar el catálogo.' }, { status: 403 });
  }
  const body = (await request.json()) as {
    kind?: 'service' | 'product';
    name?: string;
    unitPrice?: number;
    stock?: number | null;
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
      unit_price: body.unitPrice ?? 0,
      stock: body.kind === 'product' ? (body.stock ?? 0) : null,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
