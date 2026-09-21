'use client';

import { useEffect, useState } from 'react';

import { formatMoney } from '@petearth/shared';

import type { PublicCatalogItem } from '@/lib/clinic';

const SLIDE = 70;

export function ServiceCarousel({
  services,
}: {
  services: (PublicCatalogItem & { href: string })[];
}) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = services.length;

  useEffect(() => {
    if (paused || count < 2) return;
    const timer = window.setInterval(() => {
      setIndex((value) => (value + 1) % count);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [paused, count]);

  if (!count) return null;

  const offset = (100 - SLIDE) / 2 - index * SLIDE;

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div
          className="flex items-start transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
          style={{ transform: `translateX(${offset}%)` }}
        >
          {services.map((item, i) => {
            const active = i === index;
            return (
              <article key={item.id} className="w-[70%] shrink-0 px-2 sm:px-3">
                <div
                  role={active ? undefined : 'button'}
                  tabIndex={active ? undefined : 0}
                  onClick={() => {
                    if (!active) setIndex(i);
                  }}
                  onKeyDown={(event) => {
                    if (!active && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setIndex(i);
                    }
                  }}
                  className={`overflow-hidden rounded-[var(--pe-radius)] bg-pe-paper shadow-[var(--pe-shadow)] ring-1 ring-[rgba(31,36,40,0.1)] transition-all duration-700 ${
                    active ? 'scale-100 opacity-100' : 'scale-[0.94] cursor-pointer opacity-45 hover:opacity-70'
                  }`}
                  aria-label={active ? undefined : `Ver ${item.name}`}
                >
                  <div className="relative aspect-[16/9] w-full bg-pe-wash">
                    <img
                      src={item.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(31,36,40,0.72)] via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                        Servicio {String(i + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-semibold text-white sm:text-3xl">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                  <div
                    className={`grid transition-[grid-template-rows] duration-700 ${
                      active ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                    }`}
                  >
                    <div className="overflow-hidden">
                      <div className="flex flex-col items-center px-5 py-5 text-center sm:px-8">
                        <p className="max-w-md text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                        <p className="mt-3 text-lg font-semibold tabular-nums">{formatMoney(item.unit_price)}</p>
                        {active ? (
                          <a href={item.href} className="pe-btn-primary mt-4 px-7 py-2 text-sm">
                            Agendar
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-2.5">
        {services.map((item, i) => (
          <button
            key={item.id}
            type="button"
            aria-label={`Ver ${item.name}`}
            aria-current={i === index ? true : undefined}
            onClick={() => setIndex(i)}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              i === index
                ? 'w-8 bg-pe-ink'
                : 'w-2.5 bg-[rgba(31,36,40,0.22)] hover:bg-[rgba(31,36,40,0.4)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
