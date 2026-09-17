import { addMexicoDays, formatMoney, isValidYmd, todayMexicoYmd } from '@petearth/shared';
import { createAdminClient } from '@petearth/supabase/admin';

import { AdminShell } from '@/components/AdminShell';
import { ClinicFiscalForm } from '@/components/ClinicFiscalForm';
import { PageHeading, SectionMark } from '@/components/SectionTitle';
import { loadClinicSession } from '@/lib/auth';
import { pacConfigured } from '@/lib/cfdi';
import { loadClinicReports, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  const params = await searchParams;
  const today = todayMexicoYmd();
  const start = params.start && isValidYmd(params.start) ? params.start : addMexicoDays(today, -30);
  const end = params.end && isValidYmd(params.end) ? params.end : today;
  const [report, lowStock, org] = await Promise.all([
    loadClinicReports(
      staff.organizationId,
      `${start}T00:00:00-06:00`,
      `${addMexicoDays(end, 1)}T00:00:00-06:00`,
      staff.branchId,
    ),
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
      <PageHeading
        mark="informes"
        kicker="Dirección"
        title="Informes"
        description={`${staff.branchName}. Servicio vs medicamento y cobro por MVZ.`}
      />
      <form className="mt-4 flex flex-wrap items-end gap-2" method="get">
        <label className="text-sm">
          Desde
          <input type="date" name="start" defaultValue={start} className="pe-input mt-1" />
        </label>
        <label className="text-sm">
          Hasta
          <input type="date" name="end" defaultValue={end} className="pe-input mt-1" />
        </label>
        <button type="submit" className="pe-btn-secondary px-4 py-2 text-sm">
          Ver periodo
        </button>
      </form>

      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-pe-muted">Tickets cobrados</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{report.invoiceCount}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-pe-muted">Servicios</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatMoney(report.services)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-pe-muted">Productos</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatMoney(report.products)}</p>
        </div>
        <div className="pe-card p-4">
          <p className="text-xs uppercase tracking-wide text-pe-muted">Total</p>
          <p className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{formatMoney(report.total)}</p>
        </div>
      </div>

      <section className="pe-card mt-5 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <SectionMark name="consulta" size="sm" />
          Ingreso por MVZ
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {report.byVet.map((row) => (
            <li key={row.name} className="flex justify-between gap-3">
              <span>
                {row.name} <span className="text-pe-muted">· {row.count} altas</span>
              </span>
              <span className="tabular-nums">{formatMoney(row.total)}</span>
            </li>
          ))}
          {report.byVet.length === 0 ? <li className="text-pe-muted">Aún no hay cobros en el periodo.</li> : null}
        </ul>
      </section>

      <section className="pe-card mt-5 p-4">
        <h2 className="flex items-center gap-2 font-semibold">
          <SectionMark name="stock" size="sm" />
          Stock bajo mínimo
        </h2>
        <ul className="mt-3 space-y-2 text-sm">
          {lowStock.map((item) => (
            <li key={item.id} className="flex justify-between gap-3">
              <span>{item.name}</span>
              <span className="text-pe-clay-700">
                {Number(item.stock ?? 0)} / mín {Number(item.min_stock)}
              </span>
            </li>
          ))}
          {lowStock.length === 0 ? <li className="text-pe-muted">Nada por debajo del mínimo.</li> : null}
        </ul>
      </section>

      <ClinicFiscalForm
        rfc={fiscal.rfc}
        razonSocial={fiscal.razonSocial}
        regimen={fiscal.regimen}
        codigoPostal={fiscal.codigoPostal}
        pacReady={pacConfigured()}
      />
    </AdminShell>
  );
}
