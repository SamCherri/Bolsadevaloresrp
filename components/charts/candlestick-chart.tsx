'use client';

import { useEffect, useRef } from 'react';
import { createChart, CandlestickData, ColorType } from 'lightweight-charts';

export function CandlestickChart({ data }: { data: CandlestickData[] }) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const chart = createChart(ref.current, {
      layout: { background: { type: ColorType.Solid, color: '#111827' }, textColor: '#E5E7EB' },
      grid: { vertLines: { color: '#243041' }, horzLines: { color: '#243041' } },
      width: ref.current.clientWidth,
      height: window.innerWidth < 640 ? 260 : 340,
      timeScale: { timeVisible: true, secondsVisible: false },
    });

    const series = chart.addCandlestickSeries();
    series.setData(data);

    const resize = () =>
      chart.applyOptions({
        width: ref.current?.clientWidth ?? 500,
        height: window.innerWidth < 640 ? 260 : 340,
      });
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      chart.remove();
    };
  }, [data]);

  return <div className="card overflow-x-auto" ref={ref} />;
}
