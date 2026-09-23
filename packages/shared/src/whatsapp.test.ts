import assert from 'node:assert/strict';
import { test } from 'node:test';

import { isMobileWhatsAppShare, mexicoWhatsAppNumber, recetaWhatsAppText, whatsappHref } from './whatsapp';

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

test('isMobileWhatsAppShare skips Mac desktop share sheets', () => {
  assert.equal(
    isMobileWhatsAppShare(
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15',
    ),
    false,
  );
  assert.equal(isMobileWhatsAppShare('Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)'), true);
  assert.equal(isMobileWhatsAppShare('Mozilla/5.0 (Linux; Android 14; Pixel)'), true);
});
