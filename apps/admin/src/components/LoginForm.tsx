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
    <main className="pe-app flex min-h-screen">
      <aside className="pe-sidebar hidden w-[280px] flex-col justify-between p-8 md:flex">
        <BrandLogo href="/login" subtitle="Consultorio" inverted />
        <p className="font-serif text-2xl leading-snug text-[#f3eee6]">
          Sala, consulta y ticket en el mismo circuito.
        </p>
      </aside>
      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <form onSubmit={handleSubmit} className="pe-panel w-full max-w-md p-8">
          <p className="pe-kicker">Staff</p>
          <h1 className="mt-2 font-serif text-2xl font-semibold">Entrar a la clínica</h1>
          <p className="mt-2 text-sm text-[#6b5e55]">
            Veterinaria o recepción. Contraseña del piloto: piloto123.
          </p>
          <label className="mt-6 block text-sm font-medium">
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
          <label className="mt-4 block text-sm font-medium">
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
          {error ? <p className="mt-3 text-sm text-red-700">{error}</p> : null}
          <button type="submit" disabled={loading} className="pe-btn-primary mt-6 w-full py-2.5 text-sm">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
