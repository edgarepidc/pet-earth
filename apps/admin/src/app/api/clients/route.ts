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
  };
  if (!body.fullName?.trim()) {
    return NextResponse.json({ error: 'El nombre del tutor es obligatorio.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from('clients')
    .insert({
      organization_id: auth.organizationId,
      full_name: body.fullName.trim(),
      phone: body.phone?.trim() || null,
      email: body.email?.trim() || null,
      notes: body.notes?.trim() || null,
    })
    .select('id')
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ id: data.id });
}
