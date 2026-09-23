import assert from 'node:assert/strict';
import { test } from 'node:test';

import { canAddVisitLines, canEditClinical, canTakePayment, normalizeStaffRole, roleCan, slugify } from './clinical';

test('reception cannot edit SOAP', () => {
  assert.equal(canEditClinical('reception'), false);
  assert.equal(canEditClinical('vet'), true);
});

test('reception can add visit lines', () => {
  assert.equal(canAddVisitLines('reception'), true);
  assert.equal(canAddVisitLines('vet'), true);
});

test('vet cannot take payment by default', () => {
  assert.equal(canTakePayment('vet'), false);
  assert.equal(canTakePayment('reception'), true);
});

test('normalizeStaffRole rejects unknown values', () => {
  assert.equal(normalizeStaffRole('vet'), 'vet');
  assert.equal(normalizeStaffRole('nurse'), null);
});

test('slugify strips accents and punctuation', () => {
  assert.equal(slugify('Clínica Roma Norte'), 'clinica-roma-norte');
  assert.equal(slugify('  '), 'clinica');
});

test('roleCan matches the floor cut', () => {
  assert.equal(roleCan('reception', 'caja'), true);
  assert.equal(roleCan('vet', 'caja'), false);
  assert.equal(roleCan('reception', 'consulta'), false);
  assert.equal(roleCan('vet', 'config'), true);
  assert.equal(roleCan('reception', 'config'), false);
});
