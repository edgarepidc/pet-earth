import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mexicoWhatsAppNumber, whatsappHref } from './whatsapp';

test('mexicoWhatsAppNumber prefixes 10-digit numbers', () => {
  assert.equal(mexicoWhatsAppNumber('5551234567'), '525551234567');
  assert.equal(mexicoWhatsAppNumber('52 55 5123 4567'), '525551234567');
  assert.equal(mexicoWhatsAppNumber('12'), null);
});

test('whatsappHref encodes the message', () => {
  const href = whatsappHref('5551234567', 'Hola Luna');
  assert.equal(href, 'https://wa.me/525551234567?text=Hola%20Luna');
});
