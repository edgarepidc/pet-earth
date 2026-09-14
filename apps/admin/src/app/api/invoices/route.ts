import { NextResponse } from 'next/server';

import { canTakePayment, normalizeRfc } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { requireStaffApi } from '@/lib/auth';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canTakePayment(auth.role) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Solo recepción o administración pueden cobrar.' }, { status: 403 });
  }
  const body = (await request.json()) as {
    invoiceId?: string;
    method?: 'cash' | 'card' | 'transfer';
    amount?: number;
  };
  if (!body.invoiceId) return NextResponse.json({ error: 'Falta el ticket' }, { status: 400 });
  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.rpc('pe_pay_invoice', {
    p_invoice_id: body.invoiceId,
    p_method: body.method ?? 'cash',
    p_amount: body.amount ?? null,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  const auth = await requireStaffApi();
  if (auth instanceof NextResponse) return auth;
  if (!canTakePayment(auth.role) && !auth.isPlatformAdmin) {
    return NextResponse.json({ error: 'Solo recepción o administración pueden pedir factura.' }, { status: 403 });
  }
  const body = (await request.json()) as { invoiceId?: string; action?: string };
  if (!body.invoiceId || body.action !== 'request-cfdi') {
    return NextResponse.json({ error: 'Acción no soportada.' }, { status: 400 });
  }
  const supabase = createAdminClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select('id, client_id, cfdi_status')
    .eq('id', body.invoiceId)
    .eq('organization_id', auth.organizationId)
    .maybeSingle();
  if (!invoice) return NextResponse.json({ error: 'Ticket no encontrado.' }, { status: 404 });
  const { data: client } = await supabase
    .from('clients')
    .select('rfc, fiscal_name, tax_zip, uso_cfdi, full_name')
    .eq('id', invoice.client_id)
    .maybeSingle();
  const rfc = normalizeRfc(client?.rfc);
  if (!rfc || !client?.tax_zip) {
    return NextResponse.json(
      { error: 'Faltan RFC y código postal fiscal del tutor. Captúralos en Tutores.' },
      { status: 400 },
    );
  }
  const { error } = await supabase
    .from('invoices')
    .update({
      cfdi_status: 'requested',
      receptor_rfc: rfc,
      receptor_name: client.fiscal_name?.trim() || client.full_name,
      receptor_zip: client.tax_zip,
      uso_cfdi: client.uso_cfdi || 'G03',
      cfdi_requested_at: new Date().toISOString(),
    })
    .eq('id', invoice.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
