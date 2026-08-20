import Link from "next/link";
import { notFound } from "next/navigation";
import { publicProducts } from "@/lib/public-catalog";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = publicProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main className="pdp">
      <nav className="nav pdp-nav">
        <Link className="nav-back" href={`/collections/${product.collection}`}>← {product.category.toUpperCase()}</Link>
        <Link className="wordmark" href="/">SAHJONY</Link>
        <div className="nav-actions"><button aria-label="Search">SEARCH</button><button aria-label="Save item">♡ SAVE</button><button aria-label="Shopping bag">BAG · 0</button></div>
      </nav>

      <section className="pdp-stage">
        <div className="pdp-gallery">
          {product.gallery.map((image, index) => <div className="pdp-image" key={image} style={{ backgroundImage: `url(${image})` }}><span>0{index + 1}</span></div>)}
        </div>
        <aside className="pdp-buybox">
          <p className="micro">{product.brandLabel.toUpperCase()}</p>
          <h1>{product.name}</h1>
          <p className="pdp-statement">{product.statement}</p>
          <div className="pdp-price"><b>${product.price.toLocaleString()}</b>{product.compareAt ? <span>${product.compareAt.toLocaleString()}</span> : null}</div>
          {product.compareAt ? <div className="pdp-value">EXCEPTIONAL VALUE · SAVE ${(product.compareAt-product.price).toLocaleString()}</div> : null}
          <button className="pdp-add" type="button">ADD TO BAG</button>
          <button className="pdp-concierge" type="button">ASK SAHJONY CLIENT SERVICES</button>
          <div className="pdp-details"><h2>THE DETAILS</h2>{product.details.map((detail) => <div key={detail}><span>◇</span>{detail}</div>)}</div>
          <div className="pdp-assurance"><b>SAHJONY STANDARD</b><p>Premium presentation, attentive client care and a shopping experience designed around confidence and clarity.</p></div>
        </aside>
      </section>

      <section className="pdp-story"><p className="micro light">THE SAHJONY EDIT</p><h2>Objects worth<br/><em>remembering.</em></h2><p>Every piece is presented with the same philosophy: exceptional product, exceptional visual clarity and no unnecessary distraction.</p></section>

      <footer className="pdp-footer"><Link className="wordmark footer-mark" href="/">SAHJONY</Link><span>PREMIUM BRANDS FOR LESS</span><Link href={`/collections/${product.collection}`}>BACK TO {product.category.toUpperCase()} ↑</Link></footer>
    </main>
  );
}
