'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

function safeNextPath(raw: string | null): string {
  if (!raw || !raw.startsWith('/') || raw.startsWith('//')) return '/';
  return raw;
}

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(
    searchParams.get('error') === 'handoff' ? 'No se pudo abrir la sesión. Entra de nuevo.' : null,
  );
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
      const payload = (await response.json().catch(() => null)) as {
        error?: string;
        redirect?: string;
      } | null;
      if (!response.ok) {
        setError(payload?.error ?? 'No se pudo entrar.');
        return;
      }
      router.push(safeNextPath(searchParams.get('next') || payload?.redirect || '/'));
      router.refresh();
    } catch {
      setError('No se pudo conectar.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="pe-app flex min-h-screen flex-col">
      <header className="px-5 py-5 lg:px-8">
        <a href="/login" className="inline-block no-underline">
          <img
            src="/brand/logo.png"
            alt="Pet Earth Consultorio Veterinario"
            className="h-[4.5rem] w-auto sm:h-20"
          />
        </a>
      </header>
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-16">
        <p className="mb-8 max-w-sm text-center text-lg leading-snug text-pe-muted">
          Sala, consulta y ticket en el mismo circuito.
        </p>
        <form onSubmit={handleSubmit} className="pe-panel w-full max-w-md p-8">
          <p className="pe-kicker">Staff</p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight">Entrar a la clínica</h1>
          <p className="mt-2 text-sm text-pe-muted">Clínica, recepción o super admin.</p>
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
          {error ? <p className="mt-3 text-sm text-pe-danger">{error}</p> : null}
          <button type="submit" disabled={loading} className="pe-btn-primary mt-6 w-full py-2.5 text-sm">
            {loading ? 'Entrando…' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
