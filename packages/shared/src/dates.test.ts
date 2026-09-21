import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  addMexicoDays,
  isValidYmd,
  mexicoAgendaRange,
  mexicoMonthGridDays,
  mexicoWeekDays,
  mexicoWeekStart,
  parseClockToIso,
  patientAgeLabel,
} from './dates';

test('isValidYmd', () => {
  assert.equal(isValidYmd('2026-09-14'), true);
  assert.equal(isValidYmd('2026-02-30'), false);
});

test('week starts on Monday', () => {
  assert.equal(mexicoWeekStart('2026-09-14'), '2026-09-14');
  assert.equal(mexicoWeekStart('2026-09-16'), '2026-09-14');
});

test('week days are Monday to Sunday', () => {
  assert.deepEqual(mexicoWeekDays('2026-09-23'), [
    '2026-09-21',
    '2026-09-22',
    '2026-09-23',
    '2026-09-24',
    '2026-09-25',
    '2026-09-26',
    '2026-09-27',
  ]);
});

test('month grid pads from Monday and fills complete weeks', () => {
  const days = mexicoMonthGridDays('2026-09-21');
  assert.equal(days[0], '2026-08-31');
  assert.equal(days[1], '2026-09-01');
  assert.equal(days.at(-1), '2026-10-04');
  assert.equal(days.length, 35);
  assert.equal(days.length % 7, 0);
  const range = mexicoAgendaRange('2026-09-21', 'month');
  assert.equal(range.start, '2026-08-31');
  assert.equal(range.end, '2026-10-05');
});

test('parseClockToIso uses Mexico offset', () => {
  assert.equal(parseClockToIso('2026-09-14', '09:30'), '2026-09-14T09:30:00-06:00');
});

test('patientAgeLabel', () => {
  assert.equal(patientAgeLabel('2025-09-14', '2026-09-14'), '1 año');
  assert.equal(patientAgeLabel('2026-03-14', '2026-09-14'), '6 meses');
  assert.equal(addMexicoDays('2026-09-14', 7), '2026-09-21');
});
