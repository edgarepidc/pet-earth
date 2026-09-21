'use client';

import { useRef } from 'react';

import { formatMoney } from '@petearth/shared';

import type { PublicCatalogItem } from '@/lib/clinic';

export function ServiceCarousel({
  services,
}: {
  services: (PublicCatalogItem & { href: string })[];
}) {
  const scroller = useRef<HTMLDivElement>(null);

  function move(direction: number) {
    scroller.current?.scrollBy({ left: direction * 288, behavior: 'smooth' });
  }

  return (
    <div className="relative">
      <div className="mb-3 flex justify-end gap-2">
        <button type="button" className="pe-btn-ghost px-3 py-1.5 text-sm" onClick={() => move(-1)} aria-label="Servicios anteriores">
          ←
        </button>
        <button type="button" className="pe-btn-ghost px-3 py-1.5 text-sm" onClick={() => move(1)} aria-label="Más servicios">
          →
        </button>
      </div>
      <div
        ref={scroller}
        className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {services.map((item) => (
          <article
            key={item.id}
            className="pe-card flex w-[min(85%,19rem)] shrink-0 snap-start flex-col overflow-hidden sm:w-[19rem]"
          >
            <div className="flex h-40 items-center justify-center bg-pe-wash">
              <img src={item.image} alt="" className="h-24 w-24 object-contain" />
            </div>
            <div className="flex flex-1 flex-col p-5">
              <h3 className="font-serif text-2xl font-semibold">{item.name}</h3>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
              <p className="mt-5 text-lg font-semibold tabular-nums">{formatMoney(item.unit_price)}</p>
              <a href={item.href} className="pe-btn-primary mt-4 px-4 py-2 text-center text-sm">
                Agendar
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
