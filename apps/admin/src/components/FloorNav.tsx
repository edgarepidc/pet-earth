'use client';

import Link from 'next/link';
import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

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

export function withVetParam(href: string, vet: string | null | undefined): string {
  if (!vet) return href;
  return `${href}${href.includes('?') ? '&' : '?'}vet=${encodeURIComponent(vet)}`;
}

function tabClass(active: boolean): string {
  return `whitespace-nowrap px-3 py-1.5 text-sm ${active ? 'pe-chip-active pe-btn-ghost' : 'pe-btn-ghost'}`;
}

function FloorNavButtons({ active, date, vet }: { active: FloorNavActive; date: string; vet: string | null }) {
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
      <Link href={withVetParam('/', vet)} className="pe-btn-primary whitespace-nowrap px-3 py-1.5 text-sm">
        Hoy
      </Link>
      <Link
        href={withVetParam(`/agenda?view=week&start=${mexicoWeekStart(today)}`, vet)}
        className={tabClass(active === 'week')}
      >
        Semana
      </Link>
      <Link
        href={withVetParam(`/agenda?view=month&start=${mexicoMonthStart(date)}`, vet)}
        className={tabClass(active === 'month')}
      >
        Mes
      </Link>
      <Link href={withVetParam(prev, vet)} className="pe-btn-secondary px-3 py-1.5 font-mono text-sm leading-none" aria-label="Anterior">
        {'<<'}
      </Link>
      <Link href={withVetParam(next, vet)} className="pe-btn-secondary px-3 py-1.5 font-mono text-sm leading-none" aria-label="Siguiente">
        {'>>'}
      </Link>
    </div>
  );
}

function FloorNavWithVet({ active, date }: { active: FloorNavActive; date: string }) {
  const vet = useSearchParams().get('vet');
  return <FloorNavButtons active={active} date={date} vet={vet} />;
}

export function FloorNav({ active, date }: { active: FloorNavActive; date: string }) {
  return (
    <Suspense fallback={<FloorNavButtons active={active} date={date} vet={null} />}>
      <FloorNavWithVet active={active} date={date} />
    </Suspense>
  );
}
