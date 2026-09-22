'use client';

import Link from 'next/link';

import { addMexicoDays, mexicoMonthStart, mexicoWeekStart, todayMexicoYmd } from '@petearth/shared';

export type FloorNavActive = 'hoy' | 'week' | 'month' | 'day';

function shiftMonth(ymd: string, delta: number): string {
  const [year, month] = ymd.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1 + delta, 1));
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}-01`;
}

export function dayFloorHref(ymd: string): string {
  return ymd === todayMexicoYmd() ? '/' : `/agenda?view=day&start=${ymd}`;
}

function tabClass(active: boolean): string {
  return `whitespace-nowrap px-3 py-1.5 text-sm ${active ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`;
}

export function FloorNav({ active, date }: { active: FloorNavActive; date: string }) {
  const today = todayMexicoYmd();
  const prev =
    active === 'week'
      ? `/agenda?view=week&start=${addMexicoDays(mexicoWeekStart(date), -7)}`
      : active === 'month'
        ? `/agenda?view=month&start=${shiftMonth(mexicoMonthStart(date), -1)}`
        : dayFloorHref(addMexicoDays(date, -1));
  const next =
    active === 'week'
      ? `/agenda?view=week&start=${addMexicoDays(mexicoWeekStart(date), 7)}`
      : active === 'month'
        ? `/agenda?view=month&start=${shiftMonth(mexicoMonthStart(date), 1)}`
        : dayFloorHref(addMexicoDays(date, 1));

  return (
    <div className="flex shrink-0 flex-nowrap items-center gap-2">
      <Link href="/" className="pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm">
        Hoy
      </Link>
      <Link href={`/agenda?view=week&start=${mexicoWeekStart(today)}`} className={tabClass(active === 'week')}>
        Semana
      </Link>
      <Link href={`/agenda?view=month&start=${mexicoMonthStart(date)}`} className={tabClass(active === 'month')}>
        Mes
      </Link>
      <Link href={prev} className="pe-btn-secondary px-3 py-1.5 font-mono text-sm leading-none" aria-label="Anterior">
        {'<<'}
      </Link>
      <Link href={next} className="pe-btn-secondary px-3 py-1.5 font-mono text-sm leading-none" aria-label="Siguiente">
        {'>>'}
      </Link>
    </div>
  );
}
