'use client';

import { useEffect, useState } from 'react';

import { formatMexicoClock, formatMexicoDate, todayMexicoYmd } from '@petearth/shared';

export function ClinicClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  return (
    <p className="text-[11px] leading-snug text-[#d7cfc4]">
      <span className="block font-semibold tabular-nums text-[#faf7f2]">{formatMexicoClock(now)}</span>
      <span className="capitalize">{formatMexicoDate(todayMexicoYmd(now), { weekday: 'short' })}</span>
    </p>
  );
}
