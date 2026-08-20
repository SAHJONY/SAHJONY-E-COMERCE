import Link from 'next/link';
import { publicProducts } from '@/lib/public-catalog';

export default async function DiscoverPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const { q = '' } = await searchParams;
  const query = q.trim().toLowerCase();
  const results = query ? publicProducts.filter((p) => [p.name,p.category,p.brandLabel,p.statement].join(' ').toLowerCase().includes(query)) : publicProducts;

  return <main className="collection-page">
    <nav className="nav nav-dark"><Link className="nav-back" href="/">← SAHJONY</Link><Link className="wordmark wordmark-light" href="/">SAHJONY</Link><div className="nav-actions nav-actions-light"><Link href="/saved">SAVED</Link><Link href="/bag">BAG</Link></div></nav>
    <header className="collection-hero"><div className="collection-hero-shade"></div><div className="collection-hero-copy"><p className="micro light">DISCOVER SAHJONY</p><h1>Find something exceptional.</h1><form action="/discover" method="get" style={{marginTop:32,display:'flex',gap:10,maxWidth:620}}><input name="q" defaultValue={q} aria-label="Search products" placeholder="Search bags, watches, footwear, fragrance..." style={{flex:1,minHeight:52,padding:'0 18px',background:'rgba(255,255,255,.08)',border:'1px solid rgba(255,255,255,.28)',color:'#fff',font:'inherit'}}/><button className="button-glass" type="submit">SEARCH</button></form></div><span className="collection-count">{String(results.length).padStart(2,'0')} RESULTS</span></header>
    <section className="collection-products" id="results"><div className="collection-intro"><p>{query ? `RESULTS FOR “${q.toUpperCase()}”` : 'THE FULL EDIT'}</p><h2>Selected for presence.<br/><em>Designed to discover.</em></h2></div><div className="collection-product-grid">{results.map((p) => <Link className="luxury-product-card" href={`/product/${p.slug}`} key={p.slug}><div className="luxury-product-image" style={{backgroundImage:`url(${p.image})`}}><span>VIEW</span></div><div className="luxury-product-copy"><small>{p.brandLabel}</small><h3>{p.name}</h3><div><b>${p.price.toLocaleString()}</b>{p.compareAt ? <span>${p.compareAt.toLocaleString()}</span> : null}</div></div></Link>)}</div>{!results.length ? <div style={{padding:'80px 0',textAlign:'center'}}><p className="micro">NO MATCHES YET</p><h2 style={{fontWeight:400}}>Try a broader search.</h2><Link className="button-dark" href="/discover">VIEW THE FULL EDIT</Link></div> : null}</section>
  </main>;
}
