import assert from 'node:assert/strict';
import { test } from 'node:test';

import { addMexicoDays, isValidYmd, mexicoWeekStart, parseClockToIso, patientAgeLabel } from './dates';

test('isValidYmd', () => {
  assert.equal(isValidYmd('2026-09-14'), true);
  assert.equal(isValidYmd('2026-02-30'), false);
});

test('week starts on Monday', () => {
  assert.equal(mexicoWeekStart('2026-09-14'), '2026-09-14');
  assert.equal(mexicoWeekStart('2026-09-16'), '2026-09-14');
});

test('parseClockToIso uses Mexico offset', () => {
  assert.equal(parseClockToIso('2026-09-14', '09:30'), '2026-09-14T09:30:00-06:00');
});

test('patientAgeLabel', () => {
  assert.equal(patientAgeLabel('2025-09-14', '2026-09-14'), '1 año');
  assert.equal(patientAgeLabel('2026-03-14', '2026-09-14'), '6 meses');
  assert.equal(addMexicoDays('2026-09-14', 7), '2026-09-21');
});
