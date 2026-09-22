export const SLOT_MINUTES = 60;
export const DEFAULT_OPEN = '09:00';
export const DEFAULT_CLOSE = '19:00';
export const DEFAULT_OPEN_MIN = 9 * 60;
export const DEFAULT_CLOSE_MIN = 19 * 60;
export const CLINIC_OPEN_MIN = DEFAULT_OPEN_MIN;
export const CLINIC_CLOSE_MIN = DEFAULT_CLOSE_MIN;
export const DEFAULT_OPEN_DAYS = [1, 2, 3, 4, 5, 6] as const;

const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0] as const;
const DAY_NAMES: Record<number, { short: string; long: string }> = {
  0: { short: 'Dom', long: 'Domingo' },
  1: { short: 'Lun', long: 'Lunes' },
  2: { short: 'Mar', long: 'Martes' },
  3: { short: 'Mié', long: 'Miércoles' },
  4: { short: 'Jue', long: 'Jueves' },
  5: { short: 'Vie', long: 'Viernes' },
  6: { short: 'Sáb', long: 'Sábado' },
};

export const WEEKDAY_CHIPS = WEEK_ORDER.map((day) => ({
  day,
  label: DAY_NAMES[day].short,
}));

export type BranchSchedule = {
  open: string;
  close: string;
  days: number[];
  hours: string;
  phone: string | null;
  image: string | null;
};

export function clockToMinutes(clock: string): number {
  const [hour, minute] = clock.split(':').map(Number);
  return (Number.isFinite(hour) ? hour : 0) * 60 + (Number.isFinite(minute) ? minute : 0);
}

export function minutesToClock(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function slotFloor(minutes: number): number {
  return Math.floor(minutes / SLOT_MINUTES) * SLOT_MINUTES;
}

export function normalizeClock(clock: string, fallback = DEFAULT_OPEN): string {
  const match = clock.trim().match(/^(\d{1,2})(?::(\d{2}))?$/);
  if (!match) return fallback;
  const hour = Number(match[1]);
  const minute = Number(match[2] ?? '0');
  if (!Number.isFinite(hour) || hour < 0 || hour > 23 || minute < 0 || minute > 59) return fallback;
  return minutesToClock(hour * 60 + minute);
}

export function clinicSlotClocks(openMin = DEFAULT_OPEN_MIN, closeMin = DEFAULT_CLOSE_MIN): string[] {
  const start = Number.isFinite(openMin) ? openMin : DEFAULT_OPEN_MIN;
  const end = Number.isFinite(closeMin) && closeMin > start ? closeMin : start + SLOT_MINUTES;
  const slots: string[] = [];
  for (let cursor = start; cursor < end; cursor += SLOT_MINUTES) {
    slots.push(minutesToClock(cursor));
  }
  return slots.length ? slots : [minutesToClock(start)];
}

export function hourSelectClocks(fromHour = 6, toHour = 23): string[] {
  return clinicSlotClocks(fromHour * 60, (toHour + 1) * 60);
}

export function daySlotStarts(
  appointments: { starts_at: string }[],
  timeOf: (iso: string) => string,
  openMin = DEFAULT_OPEN_MIN,
  closeMin = DEFAULT_CLOSE_MIN,
): number[] {
  let start = openMin;
  let end = closeMin > openMin ? closeMin : openMin + SLOT_MINUTES;
  for (const row of appointments) {
    const minutes = clockToMinutes(timeOf(row.starts_at));
    start = Math.min(start, slotFloor(minutes));
    end = Math.max(end, slotFloor(minutes) + SLOT_MINUTES);
  }
  const slots: number[] = [];
  for (let cursor = start; cursor < end; cursor += SLOT_MINUTES) slots.push(cursor);
  return slots;
}

function normalizeDays(days: unknown): number[] {
  if (!Array.isArray(days)) return [...DEFAULT_OPEN_DAYS];
  const next = WEEK_ORDER.filter((day) => days.some((value) => Number(value) === day));
  return next.length ? [...next] : [...DEFAULT_OPEN_DAYS];
}

function clocksFromLabel(label: string): { open: string; close: string } | null {
  const matches = [...label.matchAll(/(\d{1,2}):(\d{2})/g)];
  if (matches.length < 2) return null;
  return {
    open: normalizeClock(`${matches[0][1]}:${matches[0][2]}`),
    close: normalizeClock(`${matches[1][1]}:${matches[1][2]}`, DEFAULT_CLOSE),
  };
}

function daysFromLabel(label: string): number[] | null {
  const value = label.trim().toLowerCase();
  if (!value) return null;
  if (value.includes('todos')) return [1, 2, 3, 4, 5, 6, 0];
  if (value.includes('lunes a sábado') || value.includes('lunes a sabado')) return [1, 2, 3, 4, 5, 6];
  if (value.includes('lunes a viernes')) return [1, 2, 3, 4, 5];
  if (value.includes('lunes a domingo')) return [1, 2, 3, 4, 5, 6, 0];
  return null;
}

function prettyClock(clock: string): string {
  const minutes = clockToMinutes(clock);
  const hour = Math.floor(minutes / 60);
  const minute = minutes % 60;
  return minute === 0 ? `${hour}:00` : minutesToClock(minutes);
}

export function hoursLabelFromSchedule(days: number[], open: string, close: string): string {
  const ordered = normalizeDays(days);
  const first = DAY_NAMES[ordered[0]];
  const last = DAY_NAMES[ordered[ordered.length - 1]];
  const consecutive =
    ordered.length > 2 &&
    ordered.every((day, index) => day === WEEK_ORDER[WEEK_ORDER.indexOf(ordered[0] as (typeof WEEK_ORDER)[number]) + index]);
  let when = ordered.map((day) => DAY_NAMES[day].short).join(', ');
  if (ordered.length === 7) when = 'Todos los días';
  else if (consecutive && ordered[0] === 1 && last) when = `${first.long} a ${last.long.toLowerCase()}`;
  return `${when} · ${prettyClock(open)} a ${prettyClock(close)}`;
}

export function parseBranchSettings(settings: unknown): BranchSchedule {
  const raw = settings && typeof settings === 'object' ? (settings as Record<string, unknown>) : {};
  const hours = typeof raw.hours === 'string' && raw.hours.trim() ? raw.hours.trim() : '';
  const parsedClocks = hours ? clocksFromLabel(hours) : null;
  const parsedDays = hours ? daysFromLabel(hours.split('·')[0] ?? hours) : null;
  const open = typeof raw.open === 'string' && raw.open.trim() ? normalizeClock(raw.open) : (parsedClocks?.open ?? DEFAULT_OPEN);
  const close =
    typeof raw.close === 'string' && raw.close.trim() ? normalizeClock(raw.close, DEFAULT_CLOSE) : (parsedClocks?.close ?? DEFAULT_CLOSE);
  const days = raw.days !== undefined ? normalizeDays(raw.days) : (parsedDays ?? [...DEFAULT_OPEN_DAYS]);
  const phone = typeof raw.phone === 'string' && raw.phone.trim() ? raw.phone.trim() : null;
  const image = typeof raw.image === 'string' && raw.image.trim() ? raw.image.trim() : null;
  const safeClose = clockToMinutes(close) > clockToMinutes(open) ? close : minutesToClock(clockToMinutes(open) + 60);
  return {
    open,
    close: safeClose,
    days,
    hours: hours || hoursLabelFromSchedule(days, open, safeClose),
    phone,
    image,
  };
}

export function branchSettingsPayload(input: {
  open?: string;
  close?: string;
  days?: number[];
  hours?: string | null;
  phone?: string | null;
  image?: string | null;
}): {
  open: string;
  close: string;
  days: number[];
  hours: string;
  phone: string | null;
  image: string | null;
} {
  const schedule = parseBranchSettings(input);
  return {
    open: schedule.open,
    close: schedule.close,
    days: schedule.days,
    hours: input.hours?.trim() || hoursLabelFromSchedule(schedule.days, schedule.open, schedule.close),
    phone: schedule.phone,
    image: schedule.image,
  };
}
