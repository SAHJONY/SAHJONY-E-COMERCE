import Link from "next/link";
import { products, evaluate } from "@/lib/commerce";

export default function Home() {
  return <main className="shell">
    <nav><div className="logo">SAHJONY</div><div className="links"><a href="#shop">SHOP</a><Link href="/operations">OPERATIONS</Link></div></nav>
    <section className="hero"><div><div className="eyebrow">INTELLIGENT PREMIUM RETAIL</div><h1>PREMIUM BRANDS<br/>FOR LESS.</h1><p>Shop premium products selected through SAHJONY&apos;s sourcing and margin controls. You buy from SAHJONY. We source, receive, inspect, package and ship qualifying orders.</p><a className="cta" href="#shop">SHOP SELECTED DEALS</a></div><aside><span>SAHJONY DEAL STANDARD</span><strong>25%+</strong><p>Minimum post-fulfillment contribution margin target before procurement approval.</p></aside></section>
    <section id="shop" className="shop"><header><div><div className="eyebrow">CURATED VALUE</div><h2>Selected deals</h2></div><p>Demo catalog until approved commercial sourcing feeds are connected.</p></header><div className="grid">{products.map(p=>{const d=evaluate(p);return <article key={p.slug}><div className="visual">{p.category}</div><div className="card"><small>{p.brand}</small><h3>{p.name}</h3><div className="prices"><b>${p.price}</b><span>Reference ${p.reference}</span></div><div className={d.status==="approved"?"ready":"review"}>{d.status.toUpperCase()}</div></div></article>})}</div></section>
    <section className="model"><div className="eyebrow">HOW SAHJONY WORKS</div><h2>Customer pays. We procure. We inspect. We ship.</h2><div className="steps"><span>01 PAYMENT</span><span>02 SOURCE</span><span>03 BUY</span><span>04 RECEIVE</span><span>05 INSPECT</span><span>06 SHIP</span></div></section>
    <footer><b>SAHJONY</b><span>PREMIUM BRANDS FOR LESS</span><span>Independent multi-brand retailer.</span></footer>
  </main>;
}
