import assert from 'node:assert/strict';
import { test } from 'node:test';

import { mexicoWhatsAppNumber, recetaWhatsAppText, whatsappHref } from './whatsapp';

test('mexicoWhatsAppNumber prefixes 10-digit numbers', () => {
  assert.equal(mexicoWhatsAppNumber('5551234567'), '525551234567');
  assert.equal(mexicoWhatsAppNumber('52 55 5123 4567'), '525551234567');
  assert.equal(mexicoWhatsAppNumber('12'), null);
});

test('whatsappHref encodes the message', () => {
  const href = whatsappHref('5551234567', 'Hola Luna');
  assert.equal(href, 'https://wa.me/525551234567?text=Hola%20Luna');
});

test('recetaWhatsAppText names the patient and clinic', () => {
  const text = recetaWhatsAppText({
    tutorName: 'Ana Ruiz',
    patientName: 'Luna',
    clinicName: 'Pet Earth',
  });
  assert.match(text, /Ana Ruiz/);
  assert.match(text, /Luna/);
  assert.match(text, /Pet Earth/);
});
