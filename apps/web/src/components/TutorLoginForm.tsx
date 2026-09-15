'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TutorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('ana@petearth.local');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(payload.error ?? 'No se pudo entrar');
      return;
    }
    router.push('/');
    router.refresh();
  }

  return (
    <main className="pe-app min-h-screen px-5 py-12 sm:px-10 lg:px-16">
      <div className="max-w-lg">
        <p className="pe-kicker">Cartilla del tutor</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">Pet Earth</h1>
        <p className="mt-3 max-w-sm text-sm leading-relaxed text-pe-muted">
          Vacunas, altas y citas de tu mascota. El expediente que te llevas a casa.
        </p>
        <form onSubmit={submit} className="pe-panel mt-8 space-y-4 p-6">
          <label className="block text-sm font-medium">
            Correo
            <input className="pe-input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              className="pe-input mt-1"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
          <button type="submit" className="pe-btn-primary w-full py-2.5 text-sm" disabled={loading}>
            {loading ? 'Entrando…' : 'Ver cartilla'}
          </button>
        </form>
      </div>
    </main>
  );
}
