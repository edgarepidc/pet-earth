import { NextResponse } from 'next/server';

import { canManageCatalog, slugify, type StaffRole } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

function canEditLists(role: StaffRole, isPlatformAdmin: boolean) {
  return canManageCatalog(role) || role === 'vet' || isPlatformAdmin;
}

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const key = new URL(request.url).searchParams.get('key') || 'species';
  if (key !== 'species') return NextResponse.json({ error: 'Lista no soportada.' }, { status: 400 });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clinic_lists')
    .select('id, slug, label, sort_order, is_active')
    .eq('organization_id', auth.organizationId)
    .eq('list_key', key)
    .order('sort_order')
    .order('label');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ items: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEditLists(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Solo el administrador puede editar estas listas.' }, { status: 403 });
  }
  const body = (await request.json()) as { key?: string; label?: string };
  const label = body.label?.trim() ?? '';
  if (!label) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
  const key = body.key === 'species' ? 'species' : null;
  if (!key) return NextResponse.json({ error: 'Lista no soportada.' }, { status: 400 });
  const slug = slugify(label);
  const supabase = createAdminClient();
  const { data: last } = await supabase
    .from('clinic_lists')
    .select('sort_order')
    .eq('organization_id', auth.organizationId)
    .eq('list_key', key)
    .order('sort_order', { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from('clinic_lists')
    .insert({
      organization_id: auth.organizationId,
      list_key: key,
      slug,
      label,
      sort_order: (last?.sort_order ?? 0) + 10,
    })
    .select('id')
    .single();
  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Esa especie ya está en la lista.' }, { status: 400 });
    }
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEditLists(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Solo el administrador puede editar estas listas.' }, { status: 403 });
  }
  const body = (await request.json()) as { id?: string; label?: string; isActive?: boolean };
  if (!body.id) return NextResponse.json({ error: 'Falta el ítem.' }, { status: 400 });
  const patch: { label?: string; is_active?: boolean } = {};
  if (typeof body.label === 'string') {
    const label = body.label.trim();
    if (!label) return NextResponse.json({ error: 'El nombre es obligatorio.' }, { status: 400 });
    patch.label = label;
  }
  if (typeof body.isActive === 'boolean') patch.is_active = body.isActive;
  if (!Object.keys(patch).length) return NextResponse.json({ ok: true });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('clinic_lists')
    .update(patch)
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEditLists(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Solo el administrador puede editar estas listas.' }, { status: 403 });
  }
  const id = new URL(request.url).searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta el ítem.' }, { status: 400 });
  const supabase = createAdminClient();
  const { data: item } = await supabase
    .from('clinic_lists')
    .select('id, slug, list_key')
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!item) return NextResponse.json({ error: 'No encontrado.' }, { status: 404 });
  if (item.list_key === 'species') {
    const { count } = await supabase
      .from('patients')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('species', item.slug);
    if (count && count > 0) {
      return NextResponse.json(
        { error: 'Hay pacientes con esta especie. Desactívala en lugar de borrarla.' },
        { status: 400 },
      );
    }
  }
  const { error } = await supabase.from('clinic_lists').delete().eq('id', item.id).eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
