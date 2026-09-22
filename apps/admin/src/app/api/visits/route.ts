import { NextResponse } from 'next/server';

import { canEditClinical } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi, type StaffContext } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

function canWriteClinical(auth: StaffContext) {
  return canEditClinical(auth.role) || auth.isPlatformAdmin;
}

function denyClinical() {
  return NextResponse.json({ error: 'Solo el MVZ escribe la consulta y la receta.' }, { status: 403 });
}

function numberOrNull(value: unknown) {
  if (value === null || value === undefined || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function intOrNull(value: unknown) {
  const parsed = numberOrNull(value);
  return parsed === null ? null : Math.round(parsed);
}

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
    lineId?: string;
    directions?: string | null;
  };
  if (!body.visitId || !body.action) {
    return NextResponse.json({ error: 'Falta la acción' }, { status: 400 });
  }

  const userClient = await createSupabaseServerClient();
  if (body.action === 'add-line') {
    if (!canWriteClinical(auth)) return denyClinical();
    const { data: lineId, error } = await userClient.rpc('pe_add_visit_line', {
      p_visit_id: body.visitId,
      p_catalog_item_id: body.catalogItemId ?? null,
      p_quantity: body.quantity ?? 1,
      p_unit_price: body.unitPrice ?? null,
      p_description: body.description ?? null,
    });
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    const directions = body.directions?.trim() || null;
    if (directions && lineId) {
      const supabase = createAdminClient();
      const { error: dirError } = await supabase.from('visit_lines').update({ directions }).eq('id', lineId);
      if (dirError) return NextResponse.json({ error: dirError.message }, { status: 400 });
    }
    return NextResponse.json({ ok: true, id: lineId });
  }
  if (body.action === 'vaccine') {
    if (!canWriteClinical(auth)) return denyClinical();
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
  if (body.action === 'directions') {
    if (!canWriteClinical(auth)) return denyClinical();
    if (!body.lineId) return NextResponse.json({ error: 'Falta el medicamento.' }, { status: 400 });
    const supabase = createAdminClient();
    const { data: line } = await supabase.from('visit_lines').select('id, visit_id').eq('id', body.lineId).maybeSingle();
    if (!line) return NextResponse.json({ error: 'Cargo no encontrado.' }, { status: 404 });
    const { data: visit } = await supabase
      .from('visits')
      .select('id')
      .eq('id', line.visit_id)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!visit) return NextResponse.json({ error: 'Cargo no encontrado.' }, { status: 404 });
    const { error } = await supabase
      .from('visit_lines')
      .update({ directions: body.directions?.trim() || null })
      .eq('id', line.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'notes') {
    if (!canWriteClinical(auth)) return denyClinical();
    const supabase = createAdminClient();
    const { data: visit } = await supabase
      .from('visits')
      .select('id, status')
      .eq('id', body.visitId)
      .eq('organization_id', auth.organizationId)
      .maybeSingle();
    if (!visit) return NextResponse.json({ error: 'Consulta no encontrada' }, { status: 404 });
    if (visit.status !== 'in_progress') {
      return NextResponse.json({ error: 'La consulta ya está cerrada.' }, { status: 400 });
    }
    const { error } = await supabase
      .from('visits')
      .update({
        subjective: body.subjective?.trim() || null,
        objective: body.objective?.trim() || null,
        assessment: body.assessment?.trim() || null,
        plan: body.plan?.trim() || null,
        weight_kg: numberOrNull(body.weightKg),
        temperature_c: numberOrNull(body.temperatureC),
        heart_rate: intOrNull(body.heartRate),
        respiratory_rate: intOrNull(body.respiratoryRate),
        followup_at: body.followupOn?.trim() || null,
      })
      .eq('id', visit.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 400 });
    return NextResponse.json({ ok: true });
  }
  if (body.action === 'complete') {
    if (!canWriteClinical(auth)) return denyClinical();
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
