import { NextResponse } from 'next/server';

import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const url = new URL(request.url);
  const id = url.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 });

  const supabase = createAdminClient();
  const { data: visit, error } = await supabase
    .from('visits')
    .select(
      '*, patients(name, species, breed, sex, birth_date, allergies, alerts), clients(full_name, phone), visit_lines(*), vaccine_records(*)',
    )
    .eq('id', id)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  if (!visit) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });

  const { data: invoice } = await supabase
    .from('invoices')
    .select('*, invoice_lines(*)')
    .eq('visit_id', id)
    .maybeSingle();

  const { data: catalog } = await supabase
    .from('catalog_items')
    .select('id, kind, name, unit_price, stock, is_active')
    .eq('organization_id', auth.organizationId)
    .eq('is_active', true)
    .order('kind')
    .order('name');

  return NextResponse.json({ visit, invoice, catalog: catalog ?? [] });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  const body = (await request.json()) as {
    visitId?: string;
    action?: string;
    catalogItemId?: string | null;
    quantity?: number;
    unitPrice?: number;
    description?: string;
    vaccineName?: string;
    lot?: string;
    nextDue?: string;
    notes?: string;
    subjective?: string;
    objective?: string;
    assessment?: string;
    plan?: string;
    weightKg?: number | null;
    temperatureC?: number | null;
    heartRate?: number | null;
    respiratoryRate?: number | null;
    followupOn?: string | null;
  };
  if (!body.visitId || !body.action) {
    return NextResponse.json({ error: 'Falta la acción' }, { status: 400 });
  }

  const userClient = await createSupabaseServerClient();
  if (body.action === 'add-line') {
    const { error } = await userClient.rpc('pe_add_visit_line', {
      p_visit_id: body.visitId,
      p_catalog_item_id: body.catalogItemId ?? null,
      p_quantity: body.quantity ?? 1,
      p_unit_price: body.unitPrice ?? null,
      p_description: body.description ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'vaccine') {
    const { error } = await userClient.rpc('pe_apply_vaccine', {
      p_visit_id: body.visitId,
      p_catalog_item_id: body.catalogItemId ?? null,
      p_name: body.vaccineName ?? null,
      p_lot: body.lot ?? null,
      p_next_due: body.nextDue ?? null,
      p_notes: body.notes ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'complete') {
    const { error } = await userClient.rpc('pe_complete_visit', {
      p_visit_id: body.visitId,
      p_subjective: body.subjective ?? null,
      p_objective: body.objective ?? null,
      p_assessment: body.assessment ?? null,
      p_plan: body.plan ?? null,
      p_weight_kg: body.weightKg ?? null,
      p_temperature_c: body.temperatureC ?? null,
      p_heart_rate: body.heartRate ?? null,
      p_respiratory_rate: body.respiratoryRate ?? null,
      p_followup_on: body.followupOn ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
}
