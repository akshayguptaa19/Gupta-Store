'use client';
import { SHOP } from '@/lib/config';

export default function Ticker() {
  const msgs = [...SHOP.tickerMessages, ...SHOP.tickerMessages];
  return (
    <div className="ticker-bar">
      <div className="ticker-content">
        {msgs.map((m, i) => <span key={i}>{m}</span>)}
      </div>
    </div>
  );
}
