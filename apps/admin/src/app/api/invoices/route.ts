import { NextResponse } from 'next/server';

import { canTakePayment } from '@petearth/shared';

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
