import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(request.url);
  const id = url.searchParams.get('id')?.trim() ?? '';
  const q = url.searchParams.get('q')?.trim() ?? '';
  const phone = url.searchParams.get('phone')?.replace(/\D/g, '') ?? '';
  const supabase = createAdminClient();
  const select =
    'id, full_name, phone, email, patients(id, name, species, breed, sex, birth_date, alerts, is_active)';

  if (id) {
    const { data, error } = await supabase
      .from('clients')
      .select(select)
      .eq('organization_id', auth.organizationId)
      .eq('id', id)
      .maybeSingle();
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ clients: data ? [data] : [] });
  }

  if (phone.length >= 8) {
    const { data, error } = await supabase
      .from('clients')
      .select(select)
      .eq('organization_id', auth.organizationId)
      .ilike('phone', `%${phone}%`)
      .order('full_name')
      .limit(8);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ clients: data ?? [] });
  }

  if (q.length < 2) return NextResponse.json({ clients: [] });

  const like = `%${q.replaceAll('%', '').replaceAll(',', ' ')}%`;
  const digits = q.replace(/\D/g, '');
  const filters = [`full_name.ilike.${like}`, `phone.ilike.${like}`, `email.ilike.${like}`];
  if (digits.length >= 4) filters.push(`phone.ilike.%${digits}%`);
  const [{ data: byTutor }, { data: pets }] = await Promise.all([
    supabase
      .from('clients')
      .select('id')
      .eq('organization_id', auth.organizationId)
      .or(filters.join(','))
      .limit(8),
    supabase.from('patients').select('client_id').eq('organization_id', auth.organizationId).ilike('name', like).limit(8),
  ]);
  const ids = [
    ...new Set([...(byTutor ?? []).map((row) => row.id), ...(pets ?? []).map((row) => row.client_id).filter(Boolean)]),
  ].slice(0, 8);
  if (ids.length === 0) return NextResponse.json({ clients: [] });
  const { data, error } = await supabase
    .from('clients')
    .select(select)
    .eq('organization_id', auth.organizationId)
    .in('id', ids)
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
  const phone = body.phone?.trim() || null;
  const supabase = createAdminClient();
  const digits = phone?.replace(/\D/g, '') ?? '';
  if (digits.length >= 8) {
    const { data: existing } = await supabase
      .from('clients')
      .select('id, full_name, phone')
      .eq('organization_id', auth.organizationId)
      .ilike('phone', `%${digits}%`)
      .limit(1)
      .maybeSingle();
    if (existing) {
      return NextResponse.json(
        {
          error: `Ese teléfono ya es de ${existing.full_name}. Usa el tutor existente.`,
          existingId: existing.id,
        },
        { status: 409 },
      );
    }
  }
  const hasFiscal = Boolean(body.rfc?.trim() || body.taxZip?.trim() || body.fiscalName?.trim());
  const { data, error } = await supabase
    .from('clients')
    .insert({
      organization_id: auth.organizationId,
      full_name: body.fullName.trim(),
      phone,
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
