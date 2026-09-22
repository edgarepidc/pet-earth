export const CLINIC_OPEN_MIN = 8 * 60;
export const CLINIC_CLOSE_MIN = 19 * 60;
export const SLOT_MINUTES = 30;

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

export function daySlotStarts(appointments: { starts_at: string }[], timeOf: (iso: string) => string): number[] {
  let start = CLINIC_OPEN_MIN;
  let end = CLINIC_CLOSE_MIN;
  for (const row of appointments) {
    const minutes = clockToMinutes(timeOf(row.starts_at));
    start = Math.min(start, slotFloor(minutes));
    end = Math.max(end, slotFloor(minutes) + SLOT_MINUTES);
  }
  const slots: number[] = [];
  for (let cursor = start; cursor < end; cursor += SLOT_MINUTES) slots.push(cursor);
  return slots;
}
