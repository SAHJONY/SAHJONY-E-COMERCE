'use client';

import { useEffect, useState } from 'react';

type Props = { slug: string; name: string; price: number };

type BagItem = { slug: string; name: string; price: number; quantity: number };

const BAG_KEY = 'sahjony-bag-v1';
const SAVE_KEY = 'sahjony-saved-v1';

function readBag(): BagItem[] {
  try { return JSON.parse(localStorage.getItem(BAG_KEY) || '[]') as BagItem[]; } catch { return []; }
}

function readSaved(): string[] {
  try { return JSON.parse(localStorage.getItem(SAVE_KEY) || '[]') as string[]; } catch { return []; }
}

export default function ProductActions({ slug, name, price }: Props) {
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { queueMicrotask(() => setSaved(readSaved().includes(slug))); }, [slug]);

  function addToBag() {
    const bag = readBag();
    const existing = bag.find((item) => item.slug === slug);
    if (existing) existing.quantity += 1;
    else bag.push({ slug, name, price, quantity: 1 });
    localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    window.dispatchEvent(new Event('sahjony:bag-updated'));
    setAdded(true);
  }

  function toggleSaved() {
    const current = readSaved();
    const next = current.includes(slug) ? current.filter((item) => item !== slug) : [...current, slug];
    localStorage.setItem(SAVE_KEY, JSON.stringify(next));
    setSaved(next.includes(slug));
  }

  return <div className="product-actions">
    <button className="pdp-add" type="button" onClick={addToBag}>{added ? 'ADDED TO BAG ✓' : 'ADD TO BAG'}</button>
    <button className="pdp-concierge" type="button" onClick={toggleSaved}>{saved ? 'SAVED ♥' : '♡ SAVE FOR LATER'}</button>
    <a className="pdp-client-link" href="mailto:clientservices@sahjony.com">ASK SAHJONY CLIENT SERVICES</a>
  </div>;
}
