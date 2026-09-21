import Link from 'next/link';

import type { ReminderKind } from '@petearth/shared';

import { ReminderPill } from '@/components/StatusPill';
import { SectionMark } from '@/components/SectionTitle';

type NoticeReminder = {
  id: string;
  kind: ReminderKind;
  title: string;
  due_on: string;
};

type StockItem = {
  id: string;
  name: string;
  stock: number | null;
  min_stock: number | null;
};

export function ClinicNotices({
  overdue,
  lowStock,
}: {
  overdue: NoticeReminder[];
  lowStock: StockItem[];
}) {
  return (
    <aside className="pe-card h-fit p-4 xl:sticky xl:top-5">
      <h2 className="text-sm font-semibold tracking-tight">Avisos</h2>
      <p className="mt-0.5 text-xs text-pe-muted">Seguimiento y stock de la sucursal.</p>

      <section className="mt-4 border-t border-pe-line pt-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
          <SectionMark name="seguimiento" size="sm" />
          Seguimiento vencido
        </h3>
        {overdue.length === 0 ? (
          <p className="mt-2 text-sm text-pe-muted">Nada vencido.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {overdue.slice(0, 5).map((row) => (
              <li key={row.id} className="text-sm">
                <ReminderPill kind={row.kind} />
                <p className="mt-1 font-medium">{row.title}</p>
                <p className="text-xs text-pe-muted">{row.due_on}</p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/seguimiento" className="mt-3 inline-block text-sm pe-link">
          Ver bandeja
        </Link>
      </section>

      <section className="mt-4 border-t border-pe-line pt-3">
        <h3 className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.12em] text-pe-muted">
          <SectionMark name="stock" size="sm" />
          Stock bajo
        </h3>
        {lowStock.length === 0 ? (
          <p className="mt-2 text-sm text-pe-muted">Sin alertas.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {lowStock.slice(0, 5).map((item) => (
              <li key={item.id} className="text-sm">
                <p className="font-medium">{item.name}</p>
                <p className="text-xs text-pe-clay-700">
                  {Number(item.stock ?? 0)} / mín {Number(item.min_stock)}
                </p>
              </li>
            ))}
          </ul>
        )}
        <Link href="/catalogo" className="mt-3 inline-block text-sm pe-link">
          Catálogo
        </Link>
      </section>
    </aside>
  );
}
