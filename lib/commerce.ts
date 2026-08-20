export const PROCUREMENT_POLICY = {
  minimumContributionMargin: 0.25,
  minimumContributionDollars: 25,
  paymentFeeRate: 0.03,
} as const;

export type Quote = { supplier: string; cost: number; inbound: number; available: boolean; approved: boolean };
export type Product = { slug: string; brand: string; name: string; category: string; price: number; reference: number; outbound: number; handling: number; quotes: Quote[] };

export const products: Product[] = [
  { slug:"signature-leather-tote", brand:"Designer Collection", name:"Signature Leather Tote", category:"Handbags", price:179, reference:295, outbound:11, handling:5, quotes:[{supplier:"Approved Source A",cost:87,inbound:8,available:true,approved:true}] },
  { slug:"classic-chronograph", brand:"Premium Watch Co.", name:"Classic Chronograph", category:"Watches", price:159, reference:260, outbound:9, handling:6, quotes:[{supplier:"Approved Source B",cost:79,inbound:8,available:true,approved:true}] },
  { slug:"premium-runner", brand:"Athletic Collection", name:"Premium Runner", category:"Footwear", price:129, reference:180, outbound:12, handling:4, quotes:[{supplier:"Approved Source C",cost:68,inbound:7,available:true,approved:true}] },
];

export function evaluate(product: Product) {
  const quote = product.quotes.filter(q=>q.available && q.approved).sort((a,b)=>(a.cost+a.inbound)-(b.cost+b.inbound))[0];
  if (!quote) return { status:"review", reason:"No approved source available." } as const;
  const fees = product.price * PROCUREMENT_POLICY.paymentFeeRate;
  const totalCost = quote.cost + quote.inbound + product.outbound + product.handling + fees;
  const contribution = product.price - totalCost;
  const margin = contribution / product.price;
  const approved = contribution >= PROCUREMENT_POLICY.minimumContributionDollars && margin >= PROCUREMENT_POLICY.minimumContributionMargin;
  return { status: approved ? "approved" : "rejected", quote, contribution, margin, totalCost, reason: approved ? "Stock, source and margin gates passed." : "Post-fulfillment economics below policy." } as const;
}

export const ORDER_WORKFLOW = ["CUSTOMER_PAYMENT","PROCUREMENT_VALIDATION","SAHJONY_PURCHASE","INBOUND_TO_SAHJONY","RECEIVING","INSPECTION","PREMIUM_PACKAGING","OUTBOUND_SHIPMENT","DELIVERED"] as const;
