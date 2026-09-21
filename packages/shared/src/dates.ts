export const MEXICO_TZ = 'America/Mexico_City';

const YMD_RE = /^\d{4}-\d{2}-\d{2}$/;

export function todayMexicoYmd(date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: MEXICO_TZ }).format(date);
}

export function mexicoHour(date = new Date()): number {
  const hour = new Intl.DateTimeFormat('en-GB', {
    timeZone: MEXICO_TZ,
    hour: 'numeric',
    hour12: false,
    hourCycle: 'h23',
  }).format(date);
  const n = Number(hour === '24' ? '0' : hour);
  return Number.isFinite(n) ? n : 0;
}

export function mexicoDayGreeting(date = new Date()): 'Buenos días' | 'Buenas tardes' | 'Buenas noches' {
  const hour = mexicoHour(date);
  if (hour < 12) return 'Buenos días';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
}

export function isValidYmd(value: string): boolean {
  if (!YMD_RE.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number);
  const probe = new Date(Date.UTC(y, m - 1, d));
  return probe.getUTCFullYear() === y && probe.getUTCMonth() === m - 1 && probe.getUTCDate() === d;
}

export function mexicoYmdAtNoonIso(ymd: string): string {
  return `${ymd}T12:00:00-06:00`;
}

export function addMexicoDays(ymd: string, days: number): string {
  const probe = new Date(mexicoYmdAtNoonIso(ymd));
  probe.setUTCDate(probe.getUTCDate() + days);
  return todayMexicoYmd(probe);
}

export function mexicoYmdBoundsIso(ymd: string): { start: string; end: string } {
  return {
    start: `${ymd}T00:00:00-06:00`,
    end: `${addMexicoDays(ymd, 1)}T00:00:00-06:00`,
  };
}

export function mexicoWeekStart(ymd: string): string {
  const date = new Date(mexicoYmdAtNoonIso(ymd));
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone: MEXICO_TZ,
    weekday: 'short',
  }).format(date);
  const map: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };
  return addMexicoDays(ymd, -(map[weekday] ?? 0));
}

export function mexicoWeekDays(ymd: string): string[] {
  const start = mexicoWeekStart(ymd);
  return Array.from({ length: 7 }, (_, i) => addMexicoDays(start, i));
}

export function mexicoMonthGridDays(ymd: string): string[] {
  const monthStart = mexicoMonthStart(ymd);
  const start = mexicoWeekStart(monthStart);
  const last = addMexicoDays(monthStart, daysInMexicoMonth(monthStart) - 1);
  const end = addMexicoDays(mexicoWeekStart(last), 7);
  const days: string[] = [];
  for (let cursor = start; cursor < end; cursor = addMexicoDays(cursor, 1)) {
    days.push(cursor);
  }
  return days;
}

export function mexicoAgendaRange(ymd: string, view: 'week' | 'month'): { start: string; end: string; days: string[] } {
  const days = view === 'week' ? mexicoWeekDays(ymd) : mexicoMonthGridDays(ymd);
  return { start: days[0], end: addMexicoDays(days[days.length - 1], 1), days };
}

export function mexicoMonthStart(ymd: string): string {
  return `${ymd.slice(0, 7)}-01`;
}

export function daysInMexicoMonth(ymd: string): number {
  const [year, month] = ymd.split('-').map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

export function formatMexicoDate(ymd: string, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TZ,
    day: 'numeric',
    month: 'short',
    ...options,
  }).format(new Date(mexicoYmdAtNoonIso(ymd)));
}

export function formatMexicoTime(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TZ,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function formatMexicoClock(date = new Date()): string {
  return formatMexicoTime(date.toISOString());
}

export function formatMexicoDateTime(iso: string): string {
  return new Intl.DateTimeFormat('es-MX', {
    timeZone: MEXICO_TZ,
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(iso));
}

export function parseClockToIso(ymd: string, clock: string): string {
  const [hour, minute] = clock.split(':').map(Number);
  const hh = String(Number.isFinite(hour) ? hour : 0).padStart(2, '0');
  const mm = String(Number.isFinite(minute) ? minute : 0).padStart(2, '0');
  return `${ymd}T${hh}:${mm}:00-06:00`;
}

export function patientAgeLabel(birthDate: string | null, today = todayMexicoYmd()): string | null {
  if (!birthDate || !isValidYmd(birthDate)) return null;
  const start = new Date(mexicoYmdAtNoonIso(birthDate));
  const end = new Date(mexicoYmdAtNoonIso(today));
  let months =
    (end.getUTCFullYear() - start.getUTCFullYear()) * 12 + (end.getUTCMonth() - start.getUTCMonth());
  if (end.getUTCDate() < start.getUTCDate()) months -= 1;
  if (months < 0) return null;
  if (months < 12) return `${months} mes${months === 1 ? '' : 'es'}`;
  const years = Math.floor(months / 12);
  const rest = months % 12;
  if (rest === 0) return `${years} año${years === 1 ? '' : 's'}`;
  return `${years} año${years === 1 ? '' : 's'} ${rest} mes${rest === 1 ? '' : 'es'}`;
}
