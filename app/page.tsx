const collections = [
  { kicker: "THE EDIT", title: "Icons, selected with intention", text: "A refined selection of fashion, accessories, watches and lifestyle pieces chosen for exceptional value.", code: "01" },
  { kicker: "NEW & NOTEWORTHY", title: "The latest worth knowing", text: "Discover elevated arrivals and distinctive finds without the traditional premium markup.", code: "02" },
  { kicker: "PRIVATE SELECTION", title: "Exceptional finds. Limited availability.", text: "Small releases and sought-after pieces selected for clients who know exactly what they want.", code: "03" },
];

const promises = ["Authenticity first", "Curated premium selection", "Secure checkout", "Attentive client care"];

export default function Home() {
  return (
    <main className="site-shell">
      <div className="announcement">COMPLIMENTARY U.S. DELIVERY ON QUALIFYING ORDERS</div>
      <nav className="nav">
        <button className="nav-icon" aria-label="Open menu">☰</button>
        <a className="wordmark" href="#top" aria-label="SAHJONY home">SAHJONY</a>
        <div className="nav-actions"><a href="#collections">COLLECTIONS</a><a href="#client">CLIENT SERVICES</a><button aria-label="Search">⌕</button><button aria-label="Shopping bag">BAG · 0</button></div>
      </nav>

      <section className="hero-luxe" id="top">
        <div className="hero-copy">
          <p className="micro">SAHJONY · THE PREMIUM STORE</p>
          <h1>PREMIUM<br/>BRANDS<br/><em>FOR LESS.</em></h1>
          <p className="lede">An elevated destination for remarkable products, compelling value and a shopping experience defined by taste—not noise.</p>
          <div className="hero-actions"><a className="button-dark" href="#collections">DISCOVER THE EDIT</a><a className="text-link" href="#philosophy">OUR PHILOSOPHY <span>↗</span></a></div>
        </div>
        <div className="hero-art" aria-label="SAHJONY editorial presentation"><div className="art-orbit"></div><div className="art-card"><span>THE SAHJONY EDIT</span><strong>01</strong><small>CURATED · PREMIUM · DISTINCTIVE</small></div><p>Quiet luxury.<br/>Exceptional value.</p></div>
      </section>

      <section className="trust-strip" aria-label="SAHJONY service promises">{promises.map((item, index) => <div key={item}><span>0{index + 1}</span>{item}</div>)}</section>

      <section className="manifesto" id="philosophy">
        <p className="micro">THE SAHJONY POINT OF VIEW</p>
        <h2>Luxury is not about paying more.<br/><em>It is about choosing better.</em></h2>
        <p>We created SAHJONY for clients who appreciate premium brands, considered design and intelligent value. Every public detail is intentionally simple: discover something exceptional, know what you are buying, and enjoy the experience.</p>
      </section>

      <section className="collections" id="collections">
        <div className="section-head"><div><p className="micro">CURATED FOR SAHJONY</p><h2>Explore the world<br/>of exceptional value.</h2></div><p>Seasonal edits, timeless signatures and compelling discoveries—presented with restraint and selected to earn a place in your life.</p></div>
        <div className="collection-grid">{collections.map((item) => <article className="collection-card" key={item.code}><div className="collection-visual"><span>{item.code}</span><div className="monogram">S</div><small>SAHJONY PRIVATE EDIT</small></div><div className="collection-copy"><p className="micro">{item.kicker}</p><h3>{item.title}</h3><p>{item.text}</p><a href="#client">EXPLORE <span>↗</span></a></div></article>)}</div>
      </section>

      <section className="private-room" id="client"><div><p className="micro">CLIENT SERVICES</p><h2>A more personal way<br/>to shop premium.</h2></div><div><p>Looking for a particular piece, category or gift? SAHJONY client services is designed to make discovery effortless and considered.</p><a className="button-light" href="mailto:clientservices@sahjony.com">CONTACT CLIENT SERVICES</a></div></section>

      <section className="journal"><p className="micro">THE SAHJONY STANDARD</p><div className="journal-grid"><h2>Authenticity.<br/>Taste.<br/>Value.</h2><div><p>Our promise is straightforward: a premium retail experience with clarity at every touchpoint. No operational complexity. No unnecessary noise. Just products worth discovering and service worthy of the SAHJONY name.</p><a className="text-link" href="#top">RETURN TO TOP ↑</a></div></div></section>

      <footer><div><a className="wordmark footer-mark" href="#top">SAHJONY</a><p>PREMIUM BRANDS FOR LESS</p></div><div className="footer-links"><a href="#collections">SHOP</a><a href="#client">CLIENT SERVICES</a><a href="#philosophy">ABOUT</a></div><div className="legal">© 2026 SAHJONY. ALL RIGHTS RESERVED.<br/>Independent multi-brand retailer.</div></footer>
    </main>
  );
}
