import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { uniqueBranchSlug } from '@/lib/provision';
import { createAdminClient } from '@petearth/supabase/admin';

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const { id } = await params;
  const body = (await request.json().catch(() => null)) as {
    name?: string;
    address?: string;
  } | null;
  if (!body?.name?.trim()) {
    return NextResponse.json({ error: 'El nombre de la sucursal es obligatorio.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: org } = await supabase.from('organizations').select('id').eq('id', id).maybeSingle();
  if (!org) return NextResponse.json({ error: 'Clínica no encontrada.' }, { status: 404 });

  const slug = await uniqueBranchSlug(id, body.name);
  const { data, error } = await supabase
    .from('branches')
    .insert({
      organization_id: id,
      name: body.name.trim(),
      slug,
      address: body.address?.trim() || null,
    })
    .select('id, name, slug')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ branch: data });
}
