import { normalizeRfc } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

type Fiscal = {
  rfc?: string | null;
  razonSocial?: string | null;
  regimen?: string | null;
  codigoPostal?: string | null;
};

const PAYMENT_FORM: Record<string, string> = {
  cash: '01',
  transfer: '03',
  card: '04',
};

export function pacConfigured() {
  return Boolean(process.env.FACTURAPI_SECRET_KEY);
}

export async function stampInvoiceCfdi(input: {
  organizationId: string;
  invoiceId: string;
}): Promise<{ ok: true; uuid: string } | { ok: false; error: string; status: 'requested' | 'error' }> {
  const supabase = createAdminClient();
  const { data: invoice } = await supabase
    .from('invoices')
    .select(
      'id, status, total, client_id, cfdi_status, receptor_rfc, receptor_name, receptor_zip, uso_cfdi',
    )
    .eq('id', input.invoiceId)
    .eq('organization_id', input.organizationId)
    .maybeSingle();
  if (!invoice) return { ok: false, error: 'Ticket no encontrado.', status: 'error' };
  if (invoice.status !== 'paid') {
    return { ok: false, error: 'Cobra el ticket antes de timbrar.', status: 'requested' };
  }
  if (invoice.cfdi_status === 'stamped') {
    return { ok: false, error: 'Esta factura ya tiene UUID.', status: 'error' };
  }

  const [{ data: org }, { data: client }, { data: lines }, { data: payments }] = await Promise.all([
    supabase.from('organizations').select('name, settings').eq('id', input.organizationId).maybeSingle(),
    supabase
      .from('clients')
      .select('rfc, fiscal_name, tax_zip, uso_cfdi, full_name')
      .eq('id', invoice.client_id)
      .maybeSingle(),
    supabase
      .from('invoice_lines')
      .select('description, quantity, unit_price, kind')
      .eq('invoice_id', invoice.id),
    supabase.from('payments').select('method').eq('invoice_id', invoice.id).order('paid_at', { ascending: false }).limit(1),
  ]);

  const rfc = normalizeRfc(invoice.receptor_rfc || client?.rfc);
  const zip = invoice.receptor_zip || client?.tax_zip;
  if (!rfc || !zip) {
    return { ok: false, error: 'Faltan RFC y código postal fiscal del tutor.', status: 'error' };
  }

  const fiscal = ((org?.settings as { fiscal?: Fiscal } | null)?.fiscal ?? {}) as Fiscal;
  const emisorRfc = normalizeRfc(fiscal.rfc);
  if (!emisorRfc || !fiscal.codigoPostal) {
    return {
      ok: false,
      error: 'Faltan RFC y C.P. del emisor. Captúralos en Informes.',
      status: 'error',
    };
  }

  const receptorName = invoice.receptor_name || client?.fiscal_name?.trim() || client?.full_name || 'Público en general';
  const uso = invoice.uso_cfdi || client?.uso_cfdi || 'G03';

  await supabase
    .from('invoices')
    .update({
      cfdi_status: 'requested',
      receptor_rfc: rfc,
      receptor_name: receptorName,
      receptor_zip: zip,
      uso_cfdi: uso,
      cfdi_requested_at: new Date().toISOString(),
      cfdi_error: null,
    })
    .eq('id', invoice.id);

  const key = process.env.FACTURAPI_SECRET_KEY;
  if (!key) {
    return {
      ok: false,
      error: 'Lista para timbrar. Falta FACTURAPI_SECRET_KEY (no hay PAC en Marketplace).',
      status: 'requested',
    };
  }

  const items =
    (lines ?? []).length > 0
      ? (lines ?? []).map((line) => ({
          quantity: Number(line.quantity) || 1,
          product: {
            description: line.description,
            product_key: line.kind === 'product' ? '53131600' : '90111501',
            unit_key: line.kind === 'product' ? 'H87' : 'E48',
            price: Number(line.unit_price),
          },
        }))
      : [
          {
            quantity: 1,
            product: {
              description: `Servicios veterinarios · ${org?.name ?? 'Clínica'}`,
              product_key: '90111501',
              unit_key: 'E48',
              price: Number(invoice.total),
            },
          },
        ];

  const response = await fetch('https://www.facturapi.io/v2/invoices', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      customer: {
        legal_name: receptorName,
        tax_id: rfc,
        tax_system: fiscal.regimen || '612',
        address: { zip },
      },
      items,
      payment_form: PAYMENT_FORM[payments?.[0]?.method ?? 'cash'] ?? '01',
      use: uso,
    }),
  });
  const payload = (await response.json().catch(() => null)) as {
    uuid?: string;
    id?: string;
    message?: string;
  } | null;
  if (!response.ok || !payload?.uuid) {
    const message = payload?.message ?? `El PAC rechazó el timbrado (${response.status}).`;
    await supabase
      .from('invoices')
      .update({ cfdi_status: 'error', cfdi_error: message })
      .eq('id', invoice.id);
    return { ok: false, error: message, status: 'error' };
  }

  await supabase
    .from('invoices')
    .update({
      cfdi_status: 'stamped',
      cfdi_uuid: payload.uuid,
      cfdi_stamped_at: new Date().toISOString(),
      cfdi_error: null,
    })
    .eq('id', invoice.id);
  return { ok: true, uuid: payload.uuid };
}
