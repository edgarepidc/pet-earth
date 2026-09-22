import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function GET() {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clients')
    .select('id, full_name, phone, email, patients(id, name, species, breed, sex, birth_date, alerts, is_active)')
    .eq('organization_id', auth.organizationId)
    .order('full_name');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ clients: data ?? [] });
}

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    fullName?: string;
    phone?: string;
    email?: string;
    notes?: string;
    rfc?: string;
    taxZip?: string;
    usoCfdi?: string;
    fiscalName?: string;
  };
  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: 'El nombre del tutor es obligatorio.' }, { status: 400 });
  }
  const email = body.email?.trim().toLowerCase() || null;
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'El correo no es válido.' }, { status: 400 });
  }
  const hasFiscal = Boolean(body.rfc?.trim() || body.taxZip?.trim() || body.fiscalName?.trim());
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      organization_id: auth.organizationId,
      full_name: body.fullName.trim(),
      phone: body.phone?.trim() || null,
      email,
      notes: body.notes?.trim() || null,
      rfc: hasFiscal ? body.rfc?.trim().toUpperCase() || null : null,
      tax_zip: hasFiscal ? body.taxZip?.trim() || null : null,
      uso_cfdi: hasFiscal ? body.usoCfdi || 'G03' : 'G03',
      fiscal_name: hasFiscal ? body.fiscalName?.trim() || null : null,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    id?: string;
    rfc?: string;
    taxZip?: string;
    usoCfdi?: string;
    fiscalName?: string;
  };
  if (!body.id) return NextResponse.json({ error: 'Falta el tutor.' }, { status: 400 });
  const supabase = createAdminClient();
  const { error } = await supabase
    .from('clients')
    .update({
      rfc: body.rfc?.trim().toUpperCase() || null,
      tax_zip: body.taxZip?.trim() || null,
      uso_cfdi: body.usoCfdi || 'G03',
      fiscal_name: body.fiscalName?.trim() || null,
    })
    .eq('id', body.id)
    .eq('organization_id', auth.organizationId);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
