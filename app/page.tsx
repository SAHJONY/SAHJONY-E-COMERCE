import Image from "next/image";
import Link from "next/link";
import SiteFooter from "./components/SiteFooter";
import SiteHeader from "./components/SiteHeader";

const categories = [
  { slug: "bags-leather", label: "BAGS & LEATHER", title: "Sculpted essentials", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1600&q=90" },
  { slug: "timepieces", label: "TIMEPIECES", title: "Precision, elevated", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1600&q=90" },
  { slug: "footwear", label: "FOOTWEAR", title: "Icons in motion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1600&q=90" },
  { slug: "beauty-fragrance", label: "BEAUTY & FRAGRANCE", title: "Rare signatures", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1600&q=90" },
];

export default function Home() {
  return (
    <main className="site-shell" id="main-content">
      <div className="announcement">COMPLIMENTARY U.S. DELIVERY ON QUALIFYING ORDERS</div>
      <SiteHeader overlay />

      <section className="cinema-hero" id="top">
        <Image className="hero-image" src="https://images.unsplash.com/photo-1529139574466-a303027c1d8b?auto=format&fit=crop&w=2400&q=92" alt="Editorial fashion from the SAHJONY collection" fill priority sizes="100vw" />
        <div className="hero-vignette" />
        <div className="hero-content">
          <p className="micro light">THE SAHJONY EDIT / 2026</p>
          <h1><span>PREMIUM</span><span>BRANDS</span><em>FOR LESS.</em></h1>
          <p className="hero-sub">Exceptional pieces across fashion, leather, timepieces and fragrance—selected for presence and priced with intelligence.</p>
          <div className="hero-actions"><Link className="button-glass" href="/discover">SHOP THE EDIT</Link><Link className="hero-link" href="/authenticity">OUR STANDARD <span>↗</span></Link></div>
        </div>
        <div className="hero-caption"><span>SAHJONY / 001</span><span>INDEPENDENT PREMIUM RETAIL</span></div>
        <a className="scroll-mark" href="#shop">DISCOVER <span>↓</span></a>
      </section>

      <section className="assurance-bar" aria-label="SAHJONY service promises">
        {["Curated selection", "Authenticity first", "Secure checkout", "Private client care"].map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b></div>)}
      </section>

      <section className="statement" id="world"><p className="micro">OUR POINT OF VIEW</p><h2>Desirable by design.<br/><em>Remarkable by value.</em></h2><p>We bring together distinctive pieces, considered presentation and attentive service. Every selection has a reason to be here—and every detail is designed to make shopping feel clear, confident and personal.</p></section>

      <section className="product-theater" id="shop">
        <div className="theater-head"><div><p className="micro light">SHOP BY WORLD</p><h2>Four perspectives.<br/><em>One point of view.</em></h2></div><Link className="text-link light" href="/discover">VIEW THE FULL EDIT ↗</Link></div>
        <div className="product-runway">{categories.map((item, index) => <Link className="runway-card" href={`/collections/${item.slug}`} key={item.label}><Image className="runway-image" src={item.image} alt={item.title} fill sizes="(max-width: 600px) 100vw, (max-width: 950px) 50vw, 25vw"/><div className="runway-overlay"/><div className="runway-index">0{index + 1}</div><div className="runway-copy"><p>{item.label}</p><h3>{item.title}</h3><span>EXPLORE ↗</span></div></Link>)}</div>
      </section>

      <section className="cinematic-panel watch-panel"><div className="panel-image"/><div className="panel-shade"/><div className="panel-copy"><p className="micro light">THE TIMEPIECE EDIT</p><h2>Made to be<br/><em>remembered.</em></h2><p>Enduring form, precise details and watches chosen to carry meaning well beyond the moment.</p><Link className="button-glass" href="/collections/timepieces">DISCOVER TIMEPIECES</Link></div></section>

      <section className="editorial-value"><p className="micro">THE SAHJONY DIFFERENCE</p><div className="value-grid"><div><span>01</span><h3>Chosen with intention</h3><p>A focused edit across the categories that matter—never an endless aisle.</p></div><div><span>02</span><h3>Value without compromise</h3><p>Premium positioning with a sharper perspective on price.</p></div><div><span>03</span><h3>Service that feels personal</h3><p>Thoughtful support for discovery, gifting and every order.</p></div></div></section>

      <section className="cinematic-panel fashion-panel"><div className="panel-image"/><div className="panel-shade"/><div className="panel-copy panel-right"><p className="micro light">PRIVATE CLIENT</p><h2>Quietly<br/><em>extraordinary.</em></h2><p>Personal product discovery, gifting guidance and special-request support for clients who expect more from retail.</p><Link className="button-glass" href="/client-services">EXPLORE CLIENT SERVICES</Link></div></section>

      <section className="client-suite"><div className="client-kicker">SAHJONY PRIVATE CLIENT</div><div className="client-grid"><div><h2>Tell us what<br/>you&apos;re looking for.</h2></div><div><p>Share a category, occasion or hard-to-find piece. Our client services team will help make the search more considered.</p><a className="button-dark" href="mailto:clientservices@sahjony.com?subject=Private%20Client%20Request">START A REQUEST</a></div></div></section>

      <section className="closing-film"><div className="closing-image"/><div className="closing-shade"/><div className="closing-content"><p>SAHJONY</p><h2>YOUR NEXT<br/><em>EXCEPTIONAL FIND.</em></h2><Link href="/discover">DISCOVER THE FULL EDIT ↗</Link></div></section>
      <SiteFooter />
    </main>
  );
}
