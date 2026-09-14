import { addMexicoDays, formatMoney, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { ClinicFiscalForm } from '@/components/ClinicFiscalForm';
import { loadClinicSession } from '@/lib/auth';
import { loadClinicReports, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function InformesPage() {
  const staff = await loadClinicSession();
  const end = addMexicoDays(todayMexicoYmd(), 1);
  const start = addMexicoDays(todayMexicoYmd(), -30);
  const [report, lowStock, org] = await Promise.all([
    loadClinicReports(staff.organizationId, `${start}T00:00:00-06:00`, `${end}T00:00:00-06:00`, staff.branchId),
    loadLowStock(staff.organizationId),
    createAdminClient().from('organizations').select('settings').eq('id', staff.organizationId).maybeSingle(),
  ]);
  const fiscal = ((org.data?.settings as { fiscal?: Record<string, string | null> } | null)?.fiscal ?? {}) as {
    rfc?: string | null;
    razonSocial?: string | null;
    regimen?: string | null;
    codigoPostal?: string | null;
  };

  return (
    <AdminShell>
      <p className="pe-kicker">Dirección</p>
      <h1 className="font-serif text-2xl font-semibold">Informes</h1>
      <p className="text-sm text-[#6b5e55]">
        Últimos 30 días en {staff.branchName}. Servicio vs medicamento y cobro por MVZ.
      </p>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#6b5e55]">Tickets cobrados</p>
          <p className="mt-1 font-serif text-2xl">{report.invoiceCount}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#6b5e55]">Servicios</p>
          <p className="mt-1 font-serif text-2xl">{formatMoney(report.services)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#6b5e55]">Productos</p>
          <p className="mt-1 font-serif text-2xl">{formatMoney(report.products)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-[#6b5e55]">Total</p>
          <p className="mt-1 font-serif text-2xl">{formatMoney(report.total)}</p>
        </div>
      </div>

      <section className="pe-card mt-5 p-4">
        <h2 className="font-semibold">Ingreso por MVZ</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {report.byVet.map((row) => (
            <li key={row.name} className="flex justify-between gap-3">
              <span>
                {row.name} <span className="text-[#6b5e55]">· {row.count} altas</span>
              </span>
              <span className="tabular-nums">{formatMoney(row.total)}</span>
            </li>
          ))}
          {report.byVet.length === 0 ? <li className="text-[#6b5e55]">Aún no hay cobros en el periodo.</li> : null}
        </ul>
      </section>

      <section className="pe-card mt-5 p-4">
        <h2 className="font-semibold">Stock bajo mínimo</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lowStock.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.name}</span>
              <span className="text-[#8f4328]">
                {Number(item.stock ?? 0)} / mín {Number(item.min_stock)}
              </span>
            </li>
          ))}
          {lowStock.length === 0 ? <li className="text-[#6b5e55]">Nada por debajo del mínimo.</li> : null}
        </ul>
      </section>

      <ClinicFiscalForm
        rfc={fiscal.rfc}
        razonSocial={fiscal.razonSocial}
        regimen={fiscal.regimen}
        codigoPostal={fiscal.codigoPostal}
      />
    </AdminShell>
  );
}
