'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type BagItem = { slug: string; name: string; price: number; quantity: number };
const BAG_KEY = 'sahjony-bag-v1';

function readBag(): BagItem[] {
  try { return JSON.parse(localStorage.getItem(BAG_KEY) || '[]') as BagItem[]; } catch { return []; }
}

export default function BagView() {
  const [items, setItems] = useState<BagItem[]>([]);
  useEffect(() => { queueMicrotask(() => setItems(readBag())); }, []);
  const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);

  function persist(next: BagItem[]) {
    setItems(next);
    localStorage.setItem(BAG_KEY, JSON.stringify(next));
    window.dispatchEvent(new Event('sahjony:bag-updated'));
  }

  function change(slug: string, delta: number) {
    const next = items.map((item) => item.slug === slug ? { ...item, quantity: item.quantity + delta } : item).filter((item) => item.quantity > 0);
    persist(next);
  }

  if (!items.length) return <section className="bag-empty"><p>YOUR BAG</p><h1>Quiet for now.</h1><span>Discover something exceptional and it will appear here.</span><Link className="button-dark" href="/discover">DISCOVER SAHJONY</Link></section>;

  return <section className="bag-layout">
    <div className="bag-items"><p className="micro">YOUR SELECTION</p><h1>Shopping Bag</h1>{items.map((item) => <article className="bag-row" key={item.slug}><div><Link href={`/product/${item.slug}`}>{item.name}</Link><span>${item.price.toLocaleString()}</span></div><div className="bag-quantity"><button onClick={() => change(item.slug,-1)} aria-label={`Remove one ${item.name}`}>−</button><b>{item.quantity}</b><button onClick={() => change(item.slug,1)} aria-label={`Add one ${item.name}`}>+</button></div><strong>${(item.price*item.quantity).toLocaleString()}</strong></article>)}</div>
    <aside className="bag-summary"><p className="micro">ORDER SUMMARY</p><div><span>Subtotal</span><b>${subtotal.toLocaleString()}</b></div><div><span>Delivery</span><b>Calculated at checkout</b></div><div className="bag-total"><span>Estimated total</span><strong>${subtotal.toLocaleString()}</strong></div><Link className="button-dark" href="/checkout" style={{display:'block',textAlign:'center'}}>CONTINUE TO SECURE CHECKOUT</Link><small>Payment capture remains disabled until payments, tax and order persistence are verified.</small></aside>
  </section>;
}
