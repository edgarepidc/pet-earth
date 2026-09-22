import assert from 'node:assert/strict';
import { test } from 'node:test';

import { DEFAULT_RX_FOOTER, parseLetterhead } from './letterhead';

test('parseLetterhead fills the consultorio defaults', () => {
  const sheet = parseLetterhead({});
  assert.equal(sheet.logo, null);
  assert.equal(sheet.footer, DEFAULT_RX_FOOTER);
  assert.equal(sheet.showAssessment, true);
  assert.equal(sheet.showMeds, true);
});

test('parseLetterhead reads the nested letterhead block', () => {
  const sheet = parseLetterhead({
    letterhead: {
      logo: '/catalog/srv-con.jpg',
      footer: 'Llama al 555.',
      showAssessment: false,
    },
  });
  assert.equal(sheet.logo, '/catalog/srv-con.jpg');
  assert.equal(sheet.footer, 'Llama al 555.');
  assert.equal(sheet.showAssessment, false);
  assert.equal(sheet.showPlan, true);
});
