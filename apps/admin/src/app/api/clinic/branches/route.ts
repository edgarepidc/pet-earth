import { NextResponse } from 'next/server';

import { branchSettingsPayload, canManageClinic, parseBranchSettings } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { uniqueBranchSlug } from '@/lib/provision';

function canEdit(role: Parameters<typeof canManageClinic>[0], isPlatformAdmin: boolean) {
  return canManageClinic(role) || isPlatformAdmin;
}

function mediaUrl(value?: string | null) {
  const trimmed = value?.trim() ?? '';
  if (!trimmed) return null;
  if (trimmed.startsWith('/catalog/') || trimmed.startsWith('/marks/') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return null;
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para agregar sucursales.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    address?: string;
    phone?: string;
    open?: string;
    close?: string;
    days?: number[];
    image?: string | null;
  } | null;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'El nombre de la sucursal es obligatorio.' }, { status: 400 });
  }
  const slug = await uniqueBranchSlug(auth.organizationId, body.name);
  const settings = branchSettingsPayload({
    open: body.open,
    close: body.close,
    days: body.days,
    phone: body.phone,
    image: mediaUrl(body.image) ?? '/catalog/srv-con.jpg',
  });
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('branches')
    .insert({
      organization_id: auth.organizationId,
      name: body.name.trim(),
      slug,
      address: body.address?.trim() || null,
      settings,
      is_active: true,
    })
    .select('id, name, slug')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branch: data });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canEdit(auth.role, auth.isPlatformAdmin)) {
    return NextResponse.json({ error: 'Sin permiso para editar sucursales.' }, { status: 403 });
  }
  const body = (await request.json().catch(() => null)) as {
    id?: string;
    name?: string;
    address?: string;
    phone?: string | null;
    open?: string;
    close?: string;
    days?: number[];
    image?: string | null;
    isActive?: boolean;
  } | null;
  if (!body?.id) return NextResponse.json({ error: 'Falta la sucursal.' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: row } = await supabase
    .from('branches')
    .select('id, settings, is_active')
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!row) return NextResponse.json({ error: 'Sucursal no encontrada.' }, { status: 404 });

  if (body.isActive === false && row.is_active) {
    const { count } = await supabase
      .from('branches')
      .select('id', { count: 'exact', head: true })
      .eq('organization_id', auth.organizationId)
      .eq('is_active', true);
    if ((count ?? 0) <= 1) {
      return NextResponse.json({ error: 'Deja al menos una sucursal visible.' }, { status: 400 });
    }
  }

  const current = parseBranchSettings(row.settings);
  const nextImage = body.image !== undefined ? mediaUrl(body.image) : current.image;
  const settings = branchSettingsPayload({
    open: body.open ?? current.open,
    close: body.close ?? current.close,
    days: body.days ?? current.days,
    phone: body.phone === undefined ? current.phone : body.phone,
    image: nextImage,
  });

  const patch: {
    name?: string;
    address?: string | null;
    settings: ReturnType<typeof branchSettingsPayload>;
    is_active?: boolean;
  } = { settings };
  if (typeof body.name === 'string' && body.name.trim()) patch.name = body.name.trim();
  if (body.address !== undefined) patch.address = body.address.trim() || null;
  if (typeof body.isActive === 'boolean') patch.is_active = body.isActive;

  const { error } = await supabase.from('branches').update(patch).eq('id', row.id).eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
