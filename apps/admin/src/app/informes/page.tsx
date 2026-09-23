import {
  addMexicoDays,
  formatMoney,
  isValidYmd,
  mexicoMonthStart,
  mexicoWeekStart,
  roleCan,
  todayMexicoYmd,
} from '@petearth/shared';
import Link from 'next/link';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/AdminShell';
import { PageHeading, SectionMark } from '@/components/SectionTitle';
import { loadClinicSession } from '@/lib/auth';
import { loadClinicReports, loadLowStock } from '@/lib/queries';

export const dynamic = 'force-dynamic';

function chipClass(active: boolean): string {
  return `whitespace-nowrap px-3 py-1.5 text-sm ${active ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`;
}

export default async function InformesPage({
  searchParams,
}: {
  searchParams: Promise<{ start?: string; end?: string }>;
}) {
  const staff = await loadClinicSession();
  if (!roleCan(staff.role, 'informes') && !staff.isPlatformAdmin) redirect('/agenda');
  const params = await searchParams;
  const today = todayMexicoYmd();
  const start = params.start && isValidYmd(params.start) ? params.start : today;
  const end = params.end && isValidYmd(params.end) ? params.end : today;
  const weekStart = mexicoWeekStart(today);
  const monthStart = mexicoMonthStart(today);
  const thirty = addMexicoDays(today, -30);
  const [report, lowStock] = await Promise.all([
    loadClinicReports(
      staff.organizationId,
      `${start}T00:00:00-06:00`,
      `${addMexicoDays(end, 1)}T00:00:00-06:00`,
      staff.branchId,
    ),
    loadLowStock(staff.organizationId),
  ]);

  return (
    <AdminShell>
      <PageHeading
        mark="informes"
        kicker="Dirección"
        title="Informes"
        description={`${staff.branchName}. Cierre de cobro y stock bajo.`}
      />
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Link href={`/informes?start=${today}&end=${today}`} className={chipClass(start === today && end === today)}>
          Hoy
        </Link>
        <Link href={`/informes?start=${weekStart}&end=${today}`} className={chipClass(start === weekStart && end === today)}>
          Semana
        </Link>
        <Link href={`/informes?start=${monthStart}&end=${today}`} className={chipClass(start === monthStart && end === today)}>
          Mes
        </Link>
        <Link href={`/informes?start=${thirty}&end=${today}`} className={chipClass(start === thirty && end === today)}>
          30 días
        </Link>
      </div>
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

      <section className="mt-5">
        <h2 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
          <SectionMark name="consulta" size="sm" />
          Ingreso por MVZ
        </h2>
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="px-3 py-2.5">Veterinario</th>
                <th className="px-3 py-2.5">Altas</th>
                <th className="px-3 py-2.5 text-right">Total</th>
              </tr>
            </thead>
            <tbody>
              {report.byVet.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={3}>
                    Aún no hay cobros en el periodo.
                  </td>
                </tr>
              ) : (
                report.byVet.map((row) => (
                  <tr key={row.name} className="border-b border-pe-line">
                    <td className="px-3 py-2.5 font-medium">{row.name}</td>
                    <td className="px-3 py-2.5 tabular-nums text-pe-muted">{row.count}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums font-semibold">{formatMoney(row.total)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="mt-5">
        <div className="mb-2 flex items-center justify-between gap-2 px-1">
          <h2 className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.12em] text-pe-muted">
            <SectionMark name="stock" size="sm" />
            Stock bajo mínimo
          </h2>
          <Link href="/catalogo" className="pe-link text-sm">
            Catálogo
          </Link>
        </div>
        <div className="pe-card overflow-x-auto px-1 py-2">
          <table className="w-full min-w-[28rem] text-left text-sm">
            <thead>
              <tr className="border-b border-pe-line text-[10px] font-bold uppercase tracking-[0.12em] text-pe-muted">
                <th className="px-3 py-2.5">Producto</th>
                <th className="px-3 py-2.5">Stock</th>
                <th className="px-3 py-2.5 text-right">Mínimo</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.length === 0 ? (
                <tr className="border-b border-pe-line">
                  <td className="px-3 py-6 text-pe-muted" colSpan={3}>
                    Nada por debajo del mínimo.
                  </td>
                </tr>
              ) : (
                lowStock.map((item) => (
                  <tr key={item.id} className="border-b border-pe-line">
                    <td className="px-3 py-2.5 font-medium">{item.name}</td>
                    <td className="px-3 py-2.5 tabular-nums text-pe-clay-700">{Number(item.stock ?? 0)}</td>
                    <td className="px-3 py-2.5 text-right tabular-nums text-pe-muted">{Number(item.min_stock)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </AdminShell>
  );
}
