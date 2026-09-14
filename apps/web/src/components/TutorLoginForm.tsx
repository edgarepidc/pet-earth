'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TutorLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('ana@petearth.local');
  const [password, setPassword] = useState('piloto123');
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
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="pe-glass-panel w-full max-w-md space-y-4 p-8">
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          Portal del tutor
        </p>
        <h1 className="text-center text-2xl font-bold">Pet Earth</h1>
        <p className="text-center text-sm text-slate-500">Consulta el perfil, las vacunas y el seguimiento de tu mascota.</p>
        <label className="block text-sm">
          Correo
          <input className="pe-input mt-1" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </label>
        <label className="block text-sm">
          Contraseña
          <input className="pe-input mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        </label>
        {error ? <p className="text-sm text-red-700">{error}</p> : null}
        <button type="submit" className="pe-btn-primary w-full py-2.5 text-sm" disabled={loading}>
          {loading ? 'Entrando…' : 'Entrar'}
        </button>
      </form>
    </main>
  );
}
