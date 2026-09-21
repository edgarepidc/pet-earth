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
  const n = services.length;
  const looped = n > 1;
  const [index, setIndex] = useState(looped ? n : 0);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);

  const slides = looped ? [...services, ...services, ...services] : services;
  const real = looped ? ((index % n) + n) % n : index;

  useEffect(() => {
    if (paused || !looped) return;
    const timer = window.setInterval(() => {
      setAnimate(true);
      setIndex((value) => value + 1);
    }, 4800);
    return () => window.clearInterval(timer);
  }, [paused, looped]);

  useEffect(() => {
    if (animate) return;
    const frame = window.requestAnimationFrame(() => setAnimate(true));
    return () => window.cancelAnimationFrame(frame);
  }, [animate]);

  if (!n) return null;

  function wrap(next: number) {
    if (!looped) return;
    if (next >= n * 2) {
      setAnimate(false);
      setIndex(next - n);
    } else if (next < n) {
      setAnimate(false);
      setIndex(next + n);
    }
  }

  const offset = (100 - SLIDE) / 2 - index * SLIDE;

  return (
    <div
      className="w-full"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div
          className={`flex items-stretch ${animate ? 'transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]' : ''}`}
          style={{ transform: `translateX(${offset}%)` }}
          onTransitionEnd={(event) => {
            if (event.target === event.currentTarget) wrap(index);
          }}
        >
          {slides.map((item, i) => {
            const active = i === index;
            const copy = looped ? Math.floor(i / n) : 0;
            return (
              <article key={`${item.id}-${copy}-${i % n}`} className="flex w-[70%] shrink-0 px-2 sm:px-3">
                <div
                  role={active ? undefined : 'button'}
                  tabIndex={active ? undefined : 0}
                  onClick={() => {
                    if (!active) {
                      setAnimate(true);
                      setIndex(i);
                    }
                  }}
                  onKeyDown={(event) => {
                    if (!active && (event.key === 'Enter' || event.key === ' ')) {
                      event.preventDefault();
                      setAnimate(true);
                      setIndex(i);
                    }
                  }}
                  className={`flex h-full w-full flex-col overflow-hidden rounded-[var(--pe-radius)] bg-pe-paper shadow-[var(--pe-shadow)] ring-1 ring-pe-line transition-opacity duration-700 ${
                    active ? 'opacity-100' : 'cursor-pointer opacity-50 hover:opacity-75'
                  }`}
                  aria-label={active ? undefined : `Ver ${item.name}`}
                >
                  <div className="relative aspect-[16/9] w-full bg-pe-wash">
                    <img
                      src={item.image}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[rgba(30,36,32,0.72)] via-transparent to-transparent" />
                    <div className="absolute inset-x-0 bottom-0 p-5 sm:p-7">
                      <p className="text-[11px] font-bold uppercase tracking-[0.16em] text-white/70">
                        Servicio {String((i % n) + 1).padStart(2, '0')}
                      </p>
                      <h3 className="mt-1 font-serif text-2xl font-semibold text-white sm:text-3xl">
                        {item.name}
                      </h3>
                    </div>
                  </div>
                  <div className="flex flex-1 flex-col items-center justify-center px-5 py-5 text-center sm:px-8">
                    <p className="max-w-md text-sm leading-relaxed text-pe-muted">{item.blurb}</p>
                    <p className="mt-3 text-lg font-semibold tabular-nums">{formatMoney(item.unit_price)}</p>
                    <a
                      href={item.href}
                      className={`pe-btn-primary mt-4 px-7 py-2 text-sm ${active ? '' : 'pointer-events-none'}`}
                      tabIndex={active ? undefined : -1}
                      aria-hidden={active ? undefined : true}
                    >
                      Agendar
                    </a>
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
            aria-current={i === real ? true : undefined}
            onClick={() => {
              setAnimate(true);
              setIndex(looped ? n + i : i);
            }}
            className={`h-2.5 rounded-full transition-all duration-500 ${
              i === real
                ? 'w-8 bg-pe-ink'
                : 'w-2.5 bg-[rgba(31,36,40,0.22)] hover:bg-[rgba(31,36,40,0.4)]'
            }`}
          />
        ))}
      </div>
    </div>
  );
}
