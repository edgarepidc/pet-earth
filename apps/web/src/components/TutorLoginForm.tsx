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
    <main className="pe-app flex min-h-screen items-center justify-center px-4">
      <form onSubmit={submit} className="pe-panel w-full max-w-md space-y-4 p-8">
        <p className="pe-kicker text-center">Cartilla del tutor</p>
        <h1 className="text-center font-serif text-3xl font-semibold">Pet Earth</h1>
        <p className="text-center text-sm text-[#6b5e55]">
          Vacunas, altas y citas de tu mascota. Contraseña del piloto: piloto123.
        </p>
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
          {loading ? 'Entrando…' : 'Ver cartilla'}
        </button>
      </form>
    </main>
  );
}
