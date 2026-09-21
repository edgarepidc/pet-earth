'use client';

import Link from 'next/link';

import { CartBadge } from '@/components/CartBadge';

export function AccountActions({
  signedIn,
  pets = [],
}: {
  signedIn?: boolean;
  pets?: { id: string; name: string }[];
}) {
  if (!signedIn) {
    return (
      <div className="flex items-center gap-2">
        <CartBadge />
        <Link href="/login" className="pe-btn-ghost px-3 py-2 text-sm">
          Mi cuenta
        </Link>
        <Link href="/login" className="pe-btn-primary px-4 py-2 text-sm">
          <span className="sm:hidden">Perfil</span>
          <span className="hidden sm:inline">Perfil de mascota</span>
        </Link>
      </div>
    );
  }

  const profileHref = pets.length === 1 ? `/mascotas/${pets[0].id}` : '/cuenta';

  return (
    <div className="flex items-center gap-2">
      <CartBadge signedIn />
      <Link href="/cuenta" className="pe-btn-ghost px-3 py-2 text-sm">
        Mi cuenta
      </Link>
      {pets.length > 1 ? (
        <details className="relative">
          <summary className="pe-btn-primary cursor-pointer list-none px-4 py-2 text-sm [&::-webkit-details-marker]:hidden">
            Perfil
          </summary>
          <ul className="pe-card absolute right-0 z-50 mt-2 min-w-44 overflow-hidden p-1">
            {pets.map((pet) => (
              <li key={pet.id}>
                <Link href={`/mascotas/${pet.id}`} className="block rounded-md px-3 py-2 text-sm hover:bg-pe-wash">
                  {pet.name}
                </Link>
              </li>
            ))}
          </ul>
        </details>
      ) : (
        <Link href={profileHref} className="pe-btn-primary px-4 py-2 text-sm">
          Perfil
        </Link>
      )}
    </div>
  );
}
