import Link from "next/link";
import { notFound } from "next/navigation";
import { collectionTitles, publicProducts } from "@/lib/public-catalog";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";

type Props = { params: Promise<{ slug: string }> };

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params;
  const meta = collectionTitles[slug];
  if (!meta) notFound();
  const products = publicProducts.filter((product) => product.collection === slug);

  return (
    <main className="collection-page" id="main-content">
      <SiteHeader />

      <header className="collection-hero">
        <div className="collection-hero-shade"></div>
        <div className="collection-hero-copy">
          <p className="micro light">{meta.eyebrow}</p>
          <h1>{meta.title}</h1>
          <p>{meta.description}</p>
        </div>
        <span className="collection-count">{String(products.length).padStart(2, "0")} PIECES</span>
      </header>

      <section className="collection-products" id="pieces">
        <div className="collection-intro"><p>THE SAHJONY EDIT</p><h2>Selected for presence.<br/><em>Priced with intelligence.</em></h2></div>
        <div className="collection-product-grid">
          {products.map((product) => (
            <Link className="luxury-product-card" href={`/product/${product.slug}`} key={product.slug}>
              <div className="luxury-product-image" style={{ backgroundImage: `url(${product.image})` }}><span>VIEW</span></div>
              <div className="luxury-product-copy"><small>{product.brandLabel}</small><h3>{product.name}</h3><div><b>${product.price.toLocaleString()}</b>{product.compareAt ? <span>${product.compareAt.toLocaleString()}</span> : null}</div></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="collection-service"><p className="micro light">SAHJONY PRIVATE CLIENT</p><h2>Need something more specific?</h2><p>Our client services team can assist with premium product discovery, gifting and special requests.</p><a className="button-glass" href="mailto:clientservices@sahjony.com">CONTACT CLIENT SERVICES</a></section>
      <SiteFooter />
    </main>
  );
}
