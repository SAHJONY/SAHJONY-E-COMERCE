const categories = [
  { label: "BAGS & LEATHER", title: "Sculpted essentials", image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=1800&q=95" },
  { label: "TIMEPIECES", title: "Precision, elevated", image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=1800&q=95" },
  { label: "FOOTWEAR", title: "Icons in motion", image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1800&q=95" },
  { label: "BEAUTY & FRAGRANCE", title: "Rare signatures", image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=1800&q=95" },
];

const assurances = ["Premium selection", "Authenticity first", "Secure checkout", "Private client care"];

export default function Home() {
  return (
    <main className="site-shell">
      <div className="announcement">SAHJONY · PREMIUM BRANDS FOR LESS · COMPLIMENTARY U.S. DELIVERY ON QUALIFYING ORDERS</div>
      <nav className="nav">
        <button className="nav-icon" aria-label="Open menu">☰</button>
        <a className="wordmark" href="#top" aria-label="SAHJONY home">SAHJONY</a>
        <div className="nav-actions"><a href="#shop">SHOP</a><a href="#world">THE WORLD OF SAHJONY</a><a href="#client">CLIENT SERVICES</a><button aria-label="Search">SEARCH</button><button aria-label="Shopping bag">BAG · 0</button></div>
      </nav>

      <section className="cinema-hero" id="top">
        <div className="hero-media"></div>
        <div className="hero-vignette"></div>
        <div className="hero-content">
          <p className="micro light">THE NEW STANDARD IN PREMIUM RETAIL</p>
          <h1><span>PREMIUM</span><span>BRANDS</span><em>FOR LESS.</em></h1>
          <p className="hero-sub">The world&apos;s most desirable categories, presented with cinematic clarity and an uncompromising eye for quality.</p>
          <div className="hero-actions"><a className="button-glass" href="#shop">ENTER THE COLLECTION</a><a className="hero-link" href="#world">DISCOVER SAHJONY <span>↗</span></a></div>
        </div>
        <div className="hero-caption"><span>SAHJONY / 001</span><span>ULTRA PREMIUM COMMERCE</span></div>
        <div className="scroll-mark">SCROLL <span>↓</span></div>
      </section>

      <section className="assurance-bar" aria-label="SAHJONY service promises">{assurances.map((item, index) => <div key={item}><span>0{index + 1}</span><b>{item}</b></div>)}</section>

      <section className="statement" id="world">
        <p className="micro">SAHJONY / THE POINT OF VIEW</p>
        <h2>Top-tier products deserve<br/><em>a top-tier experience.</em></h2>
        <p>SAHJONY is designed around restraint, confidence and detail. Every screen is built to feel like a flagship store: immersive when it should be, invisible when it needs to be, and always focused on the product.</p>
      </section>

      <section className="product-theater" id="shop">
        <div className="theater-head"><div><p className="micro light">THE SAHJONY EDIT</p><h2>Four worlds.<br/><em>One standard.</em></h2></div><p>Explore premium categories through high-resolution editorial imagery. Live brand and SKU photography will replace these visual placeholders as authorized catalog assets are connected.</p></div>
        <div className="product-runway">{categories.map((item, index) => <article className="runway-card" key={item.label}>
          <div className="runway-image" style={{backgroundImage:`linear-gradient(180deg,rgba(0,0,0,.02),rgba(0,0,0,.52)),url(${item.image})`}}></div>
          <div className="runway-index">0{index + 1}</div>
          <div className="runway-copy"><p>{item.label}</p><h3>{item.title}</h3><a href="#client">EXPLORE <span>↗</span></a></div>
        </article>)}</div>
      </section>

      <section className="cinematic-panel watch-panel">
        <div className="panel-image"></div><div className="panel-shade"></div>
        <div className="panel-copy"><p className="micro light">OBJECTS OF DESIRE</p><h2>Made to be<br/><em>remembered.</em></h2><p>Timeless form, exceptional materiality and premium product stories presented without distraction.</p><a className="button-glass" href="#shop">DISCOVER THE EDIT</a></div>
      </section>

      <section className="material-section">
        <div className="material-copy"><p className="micro">DESIGN WITHOUT COMPROMISE</p><h2>Every pixel should feel<br/>as considered as the product.</h2><p>Obsidian black. Mineral white. Champagne metal. Deep cinematic photography. Precise typography. Subtle motion. SAHJONY is engineered to feel expensive before a customer ever sees a price.</p></div>
        <div className="material-grid"><div className="swatch obsidian"><span>OBSIDIAN</span><b>#050505</b></div><div className="swatch pearl"><span>PEARL</span><b>#F5F2EA</b></div><div className="swatch champagne"><span>CHAMPAGNE</span><b>#C4A775</b></div></div>
      </section>

      <section className="cinematic-panel fashion-panel">
        <div className="panel-image"></div><div className="panel-shade"></div>
        <div className="panel-copy panel-right"><p className="micro light">PRIVATE SELECTION</p><h2>Quietly<br/><em>extraordinary.</em></h2><p>Distinctive pieces, limited opportunities and premium discoveries for clients who expect more from retail.</p><a className="button-glass" href="#client">CLIENT SERVICES</a></div>
      </section>

      <section className="client-suite" id="client">
        <div className="client-kicker">SAHJONY PRIVATE CLIENT</div>
        <div className="client-grid"><div><h2>A personal layer<br/>to digital luxury.</h2></div><div><p>For product discovery, gifting, special requests and premium assistance, SAHJONY Client Services delivers a more considered experience.</p><a className="button-dark" href="mailto:clientservices@sahjony.com">CONTACT CLIENT SERVICES</a></div></div>
      </section>

      <section className="closing-film"><div className="closing-image"></div><div className="closing-shade"></div><div className="closing-content"><p>SAHJONY</p><h2>PREMIUM BRANDS<br/><em>FOR LESS.</em></h2><a href="#top">RETURN TO TOP ↑</a></div></section>

      <footer><div><a className="wordmark footer-mark" href="#top">SAHJONY</a><p>PREMIUM BRANDS FOR LESS</p></div><div className="footer-links"><a href="#shop">SHOP</a><a href="#world">ABOUT</a><a href="#client">CLIENT SERVICES</a></div><div className="legal">© 2026 SAHJONY. ALL RIGHTS RESERVED.<br/>Independent multi-brand retailer.</div></footer>
    </main>
  );
}
