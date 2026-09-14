import { NextResponse } from 'next/server';

import { requirePlatformApi } from '@/lib/auth';
import { provisionClinic } from '@/lib/provision';
import { createAdminClient } from '@petearth/supabase/admin';

export async function GET() {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const supabase = createAdminClient();
  const { data: orgs, error } = await supabase
    .from('organizations')
    .select('id, name, slug, created_at')
    .order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const ids = (orgs ?? []).map((org) => org.id);
  const { data: branches } = ids.length
    ? await supabase.from('branches').select('id, organization_id, name, is_active').in('organization_id', ids)
    : { data: [] };

  return NextResponse.json({
    organizations: (orgs ?? []).map((org) => {
      const orgBranches = (branches ?? []).filter((branch) => branch.organization_id === org.id);
      return {
        ...org,
        branchCount: orgBranches.length,
        branches: orgBranches,
      };
    }),
  });
}

export async function POST(request: Request) {
  const auth = await requirePlatformApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json().catch(() => null)) as {
    clinicName?: string;
    branchName?: string;
    address?: string;
    ownerName?: string;
    ownerEmail?: string;
    ownerPassword?: string;
  } | null;
  if (!body?.clinicName?.trim() || !body.ownerEmail?.trim() || !body.ownerPassword) {
    return NextResponse.json(
      { error: 'Nombre de clínica, correo y contraseña del dueño son obligatorios.' },
      { status: 400 },
    );
  }
  try {
    const result = await provisionClinic({
      clinicName: body.clinicName,
      branchName: body.branchName?.trim() || 'Principal',
      address: body.address,
      ownerName: body.ownerName?.trim() || body.ownerEmail,
      ownerEmail: body.ownerEmail,
      ownerPassword: body.ownerPassword,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'No se pudo crear la clínica.' },
      { status: 400 },
    );
  }
}
