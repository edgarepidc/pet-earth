'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { DEFAULT_SPECIES_OPTIONS } from '@petearth/shared';

function intentFromNext(next: string) {
  const value = decodeURIComponent(next);
  if (value.includes('carrito')) return 'cart' as const;
  if (value.includes('agendar')) return 'schedule' as const;
  return 'account' as const;
}

export function TutorLoginForm({ next = '/cuenta' }: { next?: string }) {
  const router = useRouter();
  const intent = intentFromNext(next);
  const [mode, setMode] = useState<'login' | 'register'>(intent === 'account' ? 'login' : 'register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [petName, setPetName] = useState('');
  const [petSpecies, setPetSpecies] = useState(DEFAULT_SPECIES_OPTIONS[0]?.slug ?? 'dog');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const heading =
    mode === 'register'
      ? intent === 'schedule'
        ? 'Crea tu cuenta para agendar'
        : intent === 'cart'
          ? 'Crea tu cuenta para recoger'
          : 'Crea tu cuenta'
      : intent === 'schedule'
        ? 'Entra para agendar'
        : 'Entra a tu cuenta';
  const intro =
    mode === 'register'
      ? intent === 'schedule'
        ? 'Registra tutor y mascota. La cita queda en la agenda del consultorio.'
        : intent === 'cart'
          ? 'Así el pedido de recolección queda ligado a tu nombre en sucursal.'
          : 'Para ver la cartilla, agendar o armar el carrito de recolección.'
      : intent === 'schedule'
        ? 'Inicia sesión para elegir la mascota y dejar la cita.'
        : 'Tutores ven la cartilla. El equipo de la clínica entra al panel.';

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);
    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const body =
      mode === 'register'
        ? { email, password, fullName, phone, petName, petSpecies }
        : { email, password };
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const payload = (await response.json()) as {
      error?: string;
      ok?: boolean;
      role?: string;
      handoff?: { action?: string; token?: string };
    };
    if (!response.ok) {
      setLoading(false);
      setError(payload.error ?? 'No se pudo continuar');
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
        <h1 className="mt-2 font-serif text-4xl font-semibold tracking-tight">{heading}</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-pe-muted">{intro}</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${mode === 'login' ? 'pe-chip-active' : ''}`}
            onClick={() => setMode('login')}
          >
            Ya tengo cuenta
          </button>
          <button
            type="button"
            className={`pe-btn-ghost px-3 py-1.5 text-sm ${mode === 'register' ? 'pe-chip-active' : ''}`}
            onClick={() => setMode('register')}
          >
            Crear cuenta
          </button>
        </div>
        <form onSubmit={submit} className="pe-panel mt-6 space-y-4 p-6 text-left">
          {mode === 'register' ? (
            <>
              <label className="block text-sm font-medium">
                Tu nombre
                <input
                  className="pe-input mt-1"
                  autoComplete="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </label>
              <label className="block text-sm font-medium">
                Teléfono
                <input
                  className="pe-input mt-1"
                  autoComplete="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </label>
            </>
          ) : null}
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
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              minLength={mode === 'register' ? 8 : undefined}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>
          {mode === 'register' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm font-medium sm:col-span-1">
                Mascota {intent === 'schedule' ? '' : '(opcional)'}
                <input
                  className="pe-input mt-1"
                  placeholder="Luna"
                  value={petName}
                  onChange={(e) => setPetName(e.target.value)}
                  required={intent === 'schedule'}
                />
              </label>
              <label className="block text-sm font-medium">
                Especie
                <select className="pe-input mt-1" value={petSpecies} onChange={(e) => setPetSpecies(e.target.value)}>
                  {DEFAULT_SPECIES_OPTIONS.map((item) => (
                    <option key={item.slug} value={item.slug}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
          {error ? <p className="text-sm text-pe-danger">{error}</p> : null}
          <button type="submit" className="pe-btn-primary w-full py-2.5 text-sm" disabled={loading}>
            {loading ? 'Continuando…' : mode === 'register' ? 'Crear cuenta' : intent === 'schedule' ? 'Continuar para agendar' : 'Entrar'}
          </button>
        </form>
      </div>
    </main>
  );
}
