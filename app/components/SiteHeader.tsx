'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

type Props = { tone?: 'light' | 'dark'; overlay?: boolean };
type BagItem = { quantity?: number };

export default function SiteHeader({ tone = 'dark', overlay = false }: Props) {
  const [bagCount, setBagCount] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const refresh = () => {
      try {
        const items = JSON.parse(localStorage.getItem('sahjony-bag-v1') || '[]') as BagItem[];
        setBagCount(items.reduce((total, item) => total + (Number(item.quantity) || 0), 0));
      } catch { setBagCount(0); }
    };
    refresh();
    window.addEventListener('storage', refresh);
    window.addEventListener('sahjony:bag-updated', refresh);
    return () => {
      window.removeEventListener('storage', refresh);
      window.removeEventListener('sahjony:bag-updated', refresh);
    };
  }, []);

  return (
    <header className={`site-header ${tone === 'light' ? 'site-header-light' : ''} ${overlay ? 'site-header-overlay' : ''}`}>
      <button className="menu-trigger" type="button" aria-label="Open navigation" aria-expanded={open} onClick={() => setOpen(!open)}>
        <span /><span />
      </button>
      <Link className="wordmark" href="/" aria-label="SAHJONY home">SAHJONY</Link>
      <nav className={`site-nav ${open ? 'is-open' : ''}`} aria-label="Primary navigation">
        <Link href="/discover" onClick={() => setOpen(false)}>SHOP ALL</Link>
        <Link href="/collections/bags-leather" onClick={() => setOpen(false)}>BAGS</Link>
        <Link href="/collections/timepieces" onClick={() => setOpen(false)}>TIMEPIECES</Link>
        <Link href="/collections/footwear" onClick={() => setOpen(false)}>FOOTWEAR</Link>
        <Link href="/client-services" onClick={() => setOpen(false)}>CLIENT SERVICES</Link>
      </nav>
      <div className="header-actions">
        <Link href="/discover" aria-label="Search">SEARCH</Link>
        <Link href="/saved" aria-label="Saved items">SAVED</Link>
        <Link href="/bag" aria-label={`Shopping bag with ${bagCount} items`}>BAG <span className="bag-count">{bagCount}</span></Link>
      </div>
      {open ? <button className="menu-scrim" aria-label="Close navigation" onClick={() => setOpen(false)} /> : null}
    </header>
  );
}
