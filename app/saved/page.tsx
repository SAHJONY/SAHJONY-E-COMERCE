'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { publicProducts } from '@/lib/public-catalog';

const SAVE_KEY = 'sahjony-saved-v1';

export default function SavedPage() {
  const [saved, setSaved] = useState<string[]>([]);
  useEffect(() => { try { setSaved(JSON.parse(localStorage.getItem(SAVE_KEY) || '[]')); } catch { setSaved([]); } }, []);
  const products = publicProducts.filter((p) => saved.includes(p.slug));
  function remove(slug: string) { const next = saved.filter((item) => item !== slug); setSaved(next); localStorage.setItem(SAVE_KEY, JSON.stringify(next)); }

  return <main className="collection-page"><nav className="nav nav-dark"><Link className="nav-back" href="/">← SAHJONY</Link><Link className="wordmark wordmark-light" href="/">SAHJONY</Link><div className="nav-actions nav-actions-light"><Link href="/discover">SEARCH</Link><Link href="/bag">BAG</Link></div></nav><header className="collection-hero"><div className="collection-hero-shade"></div><div className="collection-hero-copy"><p className="micro light">YOUR PRIVATE EDIT</p><h1>Saved for later.</h1><p>Keep exceptional pieces close while you decide.</p></div><span className="collection-count">{String(products.length).padStart(2,'0')} SAVED</span></header><section className="collection-products">{products.length ? <div className="collection-product-grid">{products.map((p) => <article className="luxury-product-card" key={p.slug}><Link href={`/product/${p.slug}`}><div className="luxury-product-image" style={{backgroundImage:`url(${p.image})`}}><span>VIEW</span></div></Link><div className="luxury-product-copy"><small>{p.brandLabel}</small><h3>{p.name}</h3><div><b>${p.price.toLocaleString()}</b>{p.compareAt ? <span>${p.compareAt.toLocaleString()}</span> : null}</div><button type="button" onClick={() => remove(p.slug)} style={{marginTop:18,border:0,background:'transparent',padding:0,fontSize:9,letterSpacing:'.16em',cursor:'pointer'}}>REMOVE</button></div></article>)}</div> : <div style={{textAlign:'center',padding:'80px 0'}}><p className="micro">YOUR PRIVATE EDIT IS EMPTY</p><h2 style={{fontWeight:400}}>Save what deserves another look.</h2><Link className="button-dark" href="/discover">DISCOVER SAHJONY</Link></div>}</section></main>;
}
