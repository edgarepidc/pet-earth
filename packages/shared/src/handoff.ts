import { createHmac, timingSafeEqual } from 'node:crypto';

export type AuthHandoffPayload = {
  access_token: string;
  refresh_token: string;
  exp: number;
  redirect: '/' | '/plataforma';
};

function sign(body: string, secret: string) {
  return createHmac('sha256', secret).update(body).digest('base64url');
}

export function createAuthHandoff(
  input: { access_token: string; refresh_token: string; redirect: '/' | '/plataforma' },
  secret: string,
  ttlSec = 60,
) {
  if (!secret) throw new Error('Missing handoff secret');
  const payload: AuthHandoffPayload = {
    ...input,
    exp: Math.floor(Date.now() / 1000) + ttlSec,
  };
  const body = Buffer.from(JSON.stringify(payload), 'utf8').toString('base64url');
  return `${body}.${sign(body, secret)}`;
}

export function parseAuthHandoff(token: string, secret: string): AuthHandoffPayload | null {
  if (!secret || !token) return null;
  const dot = token.lastIndexOf('.');
  if (dot <= 0) return null;
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = sign(body, secret);
  const actualBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expected);
  if (actualBuf.length !== expectedBuf.length || !timingSafeEqual(actualBuf, expectedBuf)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as AuthHandoffPayload;
    if (!payload.access_token || !payload.refresh_token) return null;
    if (payload.redirect !== '/' && payload.redirect !== '/plataforma') return null;
    if (typeof payload.exp !== 'number' || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}
