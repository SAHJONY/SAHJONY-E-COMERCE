import { notFound } from "next/navigation";
import ProductActions from "@/app/components/ProductActions";
import { publicProducts } from "@/lib/public-catalog";
import SiteHeader from "@/app/components/SiteHeader";
import SiteFooter from "@/app/components/SiteFooter";

type Props = { params: Promise<{ slug: string }> };

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = publicProducts.find((item) => item.slug === slug);
  if (!product) notFound();

  return (
    <main className="pdp" id="main-content">
      <SiteHeader tone="light" />

      <section className="pdp-stage">
        <div className="pdp-gallery">{product.gallery.map((image, index) => <div className="pdp-image" key={image} style={{ backgroundImage: `url(${image})` }}><span>0{index + 1}</span></div>)}</div>
        <aside className="pdp-buybox">
          <p className="micro">{product.brandLabel.toUpperCase()}</p><h1>{product.name}</h1><p className="pdp-statement">{product.statement}</p>
          <div className="pdp-price"><b>${product.price.toLocaleString()}</b>{product.compareAt ? <span>${product.compareAt.toLocaleString()}</span> : null}</div>
          {product.compareAt ? <div className="pdp-value">EXCEPTIONAL VALUE · SAVE ${(product.compareAt-product.price).toLocaleString()}</div> : null}
          <ProductActions slug={product.slug} name={product.name} price={product.price} />
          <div className="pdp-details"><h2>THE DETAILS</h2>{product.details.map((detail) => <div key={detail}><span>◇</span>{detail}</div>)}</div>
          <div className="pdp-assurance"><b>SAHJONY STANDARD</b><p>Premium presentation, attentive client care and a shopping experience designed around confidence and clarity.</p></div>
        </aside>
      </section>

      <section className="pdp-story"><p className="micro light">THE SAHJONY EDIT</p><h2>Objects worth<br/><em>remembering.</em></h2><p>Every piece is presented with the same philosophy: exceptional product, exceptional visual clarity and no unnecessary distraction.</p></section>
      <SiteFooter />
    </main>
  );
}
