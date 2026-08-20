'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

type BagItem = { slug: string; name: string; price: number; quantity: number };
const BAG_KEY = 'sahjony-bag-v1';

export default function CheckoutPage() {
  const [items,setItems] = useState<BagItem[]>([]);
  useEffect(() => { try { setItems(JSON.parse(localStorage.getItem(BAG_KEY) || '[]')); } catch { setItems([]); } }, []);
  const subtotal = useMemo(() => items.reduce((sum,item) => sum + item.price * item.quantity,0),[items]);

  return <main className="bag-page"><nav className="nav pdp-nav"><Link className="nav-back" href="/bag">← BAG</Link><Link className="wordmark" href="/">SAHJONY</Link><div className="nav-actions"><Link href="/saved">SAVED</Link><Link href="/discover">SEARCH</Link></div></nav><section className="bag-layout"><div className="bag-items"><p className="micro">SECURE CHECKOUT</p><h1>Designed for confidence.</h1><div style={{maxWidth:680,display:'grid',gap:18,marginTop:36}}><label>EMAIL<input disabled placeholder="you@example.com" style={{display:'block',width:'100%',height:52,marginTop:8,padding:'0 14px'}}/></label><label>DELIVERY ADDRESS<input disabled placeholder="Shipping details" style={{display:'block',width:'100%',height:52,marginTop:8,padding:'0 14px'}}/></label><label>PAYMENT<input disabled placeholder="Secure payment method" style={{display:'block',width:'100%',height:52,marginTop:8,padding:'0 14px'}}/></label></div><p style={{marginTop:28,maxWidth:640,lineHeight:1.7,color:'#716b63'}}>Checkout UX is prepared, but payment capture remains intentionally disabled until the payment processor, tax calculation, order persistence and refund controls are verified end-to-end.</p></div><aside className="bag-summary"><p className="micro">ORDER SUMMARY</p>{items.map((item) => <div key={item.slug}><span>{item.name} × {item.quantity}</span><b>${(item.price*item.quantity).toLocaleString()}</b></div>)}<div className="bag-total"><span>Estimated total</span><strong>${subtotal.toLocaleString()}</strong></div><button type="button" disabled>PAYMENT ACTIVATION PENDING</button><small>No charge can be created from this page yet.</small></aside></section></main>;
}
