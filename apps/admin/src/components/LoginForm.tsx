'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

import { BrandLogo } from '@/components/BrandLogo';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'No se pudo entrar.');
        return;
      }
      router.push(safeNextPath(searchParams.get('next')));
      router.refresh();
    } catch {
      setError('No se pudo conectar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="relative flex min-h-screen items-center justify-center px-4">
      <div className="pe-glass-panel w-full max-w-md p-8 sm:p-10">
        <div className="mb-6 flex flex-col items-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Admin</p>
          <BrandLogo href="/login" subtitle="Clínica" />
        </div>
        <h1 className="text-center text-xl font-bold text-slate-900">Acceso al panel</h1>
        <p className="mt-2 text-center text-sm text-slate-500">
          Prueba con la cuenta de veterinaria o recepcion y la contraseña del piloto.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <label className="block text-sm font-medium text-slate-700">
            Correo
            <input
              type="email"
              required
              autoComplete="username"
              className="pe-input mt-1"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </label>
          <label className="block text-sm font-medium text-slate-700">
            Contraseña
            <input
              type="password"
              required
              autoComplete="current-password"
              className="pe-input mt-1"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </label>
          {error ? <p className="text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={loading} className="pe-btn-primary w-full py-2.5 text-sm">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
