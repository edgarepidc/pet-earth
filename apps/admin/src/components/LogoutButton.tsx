'use client';

import { useRouter } from 'next/navigation';

export function LogoutButton({ className = 'pe-btn-ghost px-4 py-2 text-sm' }: { className?: string }) {
  const router = useRouter();

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  }

  return (
    <button type="button" onClick={logout} className={className}>
      Salir
    </button>
  );
}
