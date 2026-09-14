import assert from 'node:assert/strict';
import { test } from 'node:test';

import { formatMoney, lineTotal, splitInvoiceTotals } from './money';

test('lineTotal rounds to cents', () => {
  assert.equal(lineTotal(2, 450.5), 901);
  assert.equal(lineTotal(1.5, 220), 330);
});

test('splitInvoiceTotals separates services and products', () => {
  const split = splitInvoiceTotals([
    { kind: 'service', lineTotal: 450 },
    { kind: 'service', lineTotal: 80 },
    { kind: 'product', lineTotal: 650 },
    { kind: 'product', lineTotal: 185 },
  ]);
  assert.equal(split.services, 530);
  assert.equal(split.products, 835);
  assert.equal(split.total, 1365);
});

test('formatMoney uses Mexican locale', () => {
  assert.match(formatMoney(1365), /1,365\.00/);
});
