'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function TutorLoginForm({ next = '/cuenta' }: { next?: string }) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const scheduling = next.includes('agendar');

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const payload = (await response.json()) as {
      error?: string;
      role?: string;
      handoff?: { action?: string; token?: string };
    };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? 'No se pudo entrar');
      return;
    }
    if (payload.role === 'staff' && payload.handoff?.action && payload.handoff.token) {
      const allowed =
        process.env.NEXT_PUBLIC_ADMIN_URL?.replace(/\/$/, '') ??
        (window.location.hostname === 'localhost' ? 'http://localhost:3000' : 'https://pet-earth-admin.vercel.app');
      if (payload.handoff.action !== `${allowed}/api/auth/handoff`) {
        setLoading(false);
        setError('No se pudo abrir el panel.');
        return;
      }
      const form = document.createElement('form');
      form.method = 'POST';
      form.action = payload.handoff.action;
      form.style.display = 'none';
      const input = document.createElement('input');
      input.name = 'token';
      input.value = payload.handoff.token;
      form.appendChild(input);
      document.body.appendChild(form);
      form.submit();
      return;
    }
    router.push(next);
    router.refresh();
  }

  return (
    <main className="flex justify-center px-5 py-16 sm:px-8">
      <div className="w-full max-w-md text-center">
        <p className="pe-kicker">Consultorio</p>
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">
          {scheduling ? 'Entra para agendar' : 'Entra a tu cuenta'}
        </h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pe-muted">
          {scheduling
            ? 'Inicia sesión para elegir la mascota y dejar la cita en la agenda del consultorio.'
            : 'Tutores ven la cartilla. El equipo de la clínica entra al panel.'}
        </p>
        <form onSubmit={submit} className="pe-panel mt-8 space-y-4 p-6 text-left">
          <label className="block text-sm font-medium">
            Correo
            <input
              className="pe-input mt-1"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>
          <label className="block text-sm font-medium">
            Contraseña
            <input
              className="pe-input mt-1"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
          <button type="submit" className="pe-btn-primary w-full py-2.5 text-sm" disabled={loading}>
            {loading ? 'Entrando…' : scheduling ? 'Continuar para agendar' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
