'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type BagItem = { slug: string; name: string; price: number; quantity: number };
const BAG_KEY = 'sahjony-bag-v1';

export default function CheckoutPage() {
  const [items,setItems] = useState<BagItem[]>([]);
  const [email,setEmail] = useState('');
  const [busy,setBusy] = useState(false);
  const [message,setMessage] = useState('');

  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem(BAG_KEY) || '[]')); } catch { setItems([]); } }, []);
  const subtotal = useMemo(() => items.reduce((sum,item) => sum + item.price * item.quantity,0),[items]);

  async function beginCheckout() {
    if (!email.includes('@')) { setMessage('Enter a valid email to continue.'); return; }
    if (!items.length) { setMessage('Your bag is empty.'); return; }
    setBusy(true); setMessage('');
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, items: items.map(({slug,quantity}) => ({slug,quantity})) }),
      });
      const data = await response.json();
      if (!response.ok || !data.url) {
        setMessage(data.error === 'payments_not_ready' ? 'Secure payments are being activated. Please contact Client Services to complete your order.' : 'Checkout is temporarily unavailable. Please try again or contact Client Services.');
        return;
      }
      window.location.href = data.url;
    } catch {
      setMessage('Checkout is temporarily unavailable. Please contact Client Services.');
    } finally { setBusy(false); }
  }

  return <main className="bag-page"><nav className="nav pdp-nav"><Link className="nav-back" href="/bag">← BAG</Link><Link className="wordmark" href="/">SAHJONY</Link><div className="nav-actions"><Link href="/saved">SAVED</Link><Link href="/discover">SEARCH</Link></div></nav><section className="bag-layout"><div className="bag-items"><p className="micro">SECURE CHECKOUT</p><h1>Designed for confidence.</h1><div style={{maxWidth:680,display:'grid',gap:18,marginTop:36}}><label>EMAIL<input value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" inputMode="email" placeholder="you@example.com" style={{display:'block',width:'100%',height:52,marginTop:8,padding:'0 14px'}}/></label><div><p className="micro" style={{marginBottom:8}}>DELIVERY & PAYMENT</p><p style={{lineHeight:1.7,color:'#716b63',margin:0}}>Your delivery address and payment method are collected on our secure payment page. SAHJONY does not store your card number.</p></div></div>{message && <p role="status" style={{marginTop:24,maxWidth:640,lineHeight:1.6}}>{message}</p>}<p style={{marginTop:28,maxWidth:640,lineHeight:1.7,color:'#716b63'}}>Orders are confirmed only after successful payment authorization. Availability remains subject to final verification before fulfillment.</p></div><aside className="bag-summary"><p className="micro">ORDER SUMMARY</p>{items.map((item) => <div key={item.slug}><span>{item.name} × {item.quantity}</span><b>${(item.price*item.quantity).toLocaleString()}</b></div>)}<div className="bag-total"><span>Estimated total</span><strong>${subtotal.toLocaleString()}</strong></div><button type="button" onClick={beginCheckout} disabled={busy || !items.length}>{busy ? 'OPENING SECURE CHECKOUT…' : 'CONTINUE TO SECURE PAYMENT'}</button><small>Encrypted payment processing. Final taxes and delivery may be calculated before payment.</small><a className="pdp-client-link" href="mailto:clientservices@sahjony.com">NEED ASSISTANCE? CLIENT SERVICES</a></aside></section></main>;
}
