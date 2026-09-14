'use client';

import { useRouter } from 'next/navigation';

export function ExitClinicButton({ className = 'pe-btn-ghost px-3 py-1.5 text-sm' }: { className?: string }) {
  const router = useRouter();

  async function exit() {
    await fetch('/api/platform/exit', { method: 'POST' });
    router.push('/plataforma');
    router.refresh();
  }

  return (
    <button type="button" className={className} onClick={() => void exit()}>
      Volver a plataforma
    </button>
  );
}
