import assert from 'node:assert/strict';
import { test } from 'node:test';

import { createAuthHandoff, parseAuthHandoff } from './handoff';

test('createAuthHandoff round-trips a valid token', () => {
  const token = createAuthHandoff(
    { access_token: 'acc', refresh_token: 'ref', redirect: '/' },
    'secret',
  );
  const parsed = parseAuthHandoff(token, 'secret');
  assert.equal(parsed?.access_token, 'acc');
  assert.equal(parsed?.refresh_token, 'ref');
  assert.equal(parsed?.redirect, '/');
});

test('parseAuthHandoff rejects a bad signature', () => {
  const token = createAuthHandoff(
    { access_token: 'acc', refresh_token: 'ref', redirect: '/' },
    'secret',
  );
  assert.equal(parseAuthHandoff(token, 'other'), null);
});
