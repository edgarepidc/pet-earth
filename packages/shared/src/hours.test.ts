import assert from 'node:assert/strict';
import { test } from 'node:test';

import {
  clinicSlotClocks,
  hoursLabelFromSchedule,
  parseBranchSettings,
} from './hours';

test('parses seed hours into floor clocks', () => {
  const roma = parseBranchSettings({ hours: 'Lunes a sábado · 9:00 a 19:00', image: '/catalog/srv-con.jpg' });
  assert.equal(roma.open, '09:00');
  assert.equal(roma.close, '19:00');
  assert.deepEqual(roma.days, [1, 2, 3, 4, 5, 6]);
  assert.equal(roma.image, '/catalog/srv-con.jpg');
});

test('structured open/close win over the public label', () => {
  const condesa = parseBranchSettings({
    hours: 'Lunes a sábado · 10:00 a 20:00',
    open: '10:00',
    close: '20:00',
    days: [1, 2, 3, 4, 5, 6],
  });
  assert.equal(condesa.open, '10:00');
  assert.equal(condesa.close, '20:00');
});

test('hours label and slots match 9 to 19', () => {
  assert.equal(hoursLabelFromSchedule([1, 2, 3, 4, 5, 6], '09:00', '19:00'), 'Lunes a sábado · 9:00 a 19:00');
  const slots = clinicSlotClocks(9 * 60, 19 * 60);
  assert.equal(slots[0], '09:00');
  assert.equal(slots.at(-1), '18:00');
});
