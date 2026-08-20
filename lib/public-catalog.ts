export type PublicProduct = {
  slug: string;
  collection: string;
  category: string;
  brandLabel: string;
  name: string;
  price: number;
  compareAt?: number;
  image: string;
  gallery: string[];
  statement: string;
  details: string[];
};

export const publicProducts: PublicProduct[] = [
  {
    slug: "atelier-leather-tote",
    collection: "bags-leather",
    category: "Bags & Leather",
    brandLabel: "Premium Leather Collection",
    name: "Atelier Leather Tote",
    price: 895,
    compareAt: 1295,
    image: "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=2400&q=96",
    gallery: [
      "https://images.unsplash.com/photo-1584917865442-de89df76afd3?auto=format&fit=crop&w=2400&q=96",
      "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=2400&q=96",
    ],
    statement: "Architectural form, refined proportions and an understated finish designed for everyday luxury.",
    details: ["Premium material selection", "Structured silhouette", "Protective presentation", "Curated by SAHJONY"],
  },
  {
    slug: "signature-top-handle",
    collection: "bags-leather",
    category: "Bags & Leather",
    brandLabel: "Private Edit",
    name: "Signature Top Handle",
    price: 745,
    compareAt: 1095,
    image: "https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=2400&q=96",
    gallery: ["https://images.unsplash.com/photo-1566150905458-1bf1fc113f0d?auto=format&fit=crop&w=2400&q=96"],
    statement: "A precise, compact silhouette with a polished presence and timeless appeal.",
    details: ["Curated premium selection", "Elegant proportions", "Limited presentation", "SAHJONY client care"],
  },
  {
    slug: "precision-chronograph",
    collection: "timepieces",
    category: "Timepieces",
    brandLabel: "Swiss-Inspired Collection",
    name: "Precision Chronograph",
    price: 1195,
    compareAt: 1650,
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2400&q=96",
    gallery: [
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&w=2400&q=96",
      "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=2400&q=96",
    ],
    statement: "Crisp geometry and a balanced dial create a modern expression of precision.",
    details: ["Premium timepiece presentation", "Detailed dial architecture", "Gift-ready experience", "Curated by SAHJONY"],
  },
  {
    slug: "heritage-dress-watch",
    collection: "timepieces",
    category: "Timepieces",
    brandLabel: "Heritage Edit",
    name: "Heritage Dress Watch",
    price: 875,
    compareAt: 1240,
    image: "https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=2400&q=96",
    gallery: ["https://images.unsplash.com/photo-1522312346375-d1a52e2b99b3?auto=format&fit=crop&w=2400&q=96"],
    statement: "A restrained profile built around timeless proportion and quiet sophistication.",
    details: ["Refined profile", "Premium finish", "Collector-inspired styling", "SAHJONY presentation"],
  },
  {
    slug: "performance-runner",
    collection: "footwear",
    category: "Footwear",
    brandLabel: "Performance Collection",
    name: "Performance Runner",
    price: 225,
    compareAt: 310,
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=96",
    gallery: [
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=2400&q=96",
      "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2400&q=96",
    ],
    statement: "Sculpted for movement with a silhouette designed to look as strong off-track as it performs on it.",
    details: ["Performance-led design", "Premium construction", "Modern silhouette", "Curated by SAHJONY"],
  },
  {
    slug: "minimal-court-sneaker",
    collection: "footwear",
    category: "Footwear",
    brandLabel: "Minimal Edit",
    name: "Minimal Court Sneaker",
    price: 195,
    compareAt: 275,
    image: "https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2400&q=96",
    gallery: ["https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=2400&q=96"],
    statement: "Clean lines, elevated materials and an intentionally understated finish.",
    details: ["Minimal profile", "Premium finish", "Everyday versatility", "SAHJONY selected"],
  },
  {
    slug: "noir-parfum-extrait",
    collection: "beauty-fragrance",
    category: "Beauty & Fragrance",
    brandLabel: "Fragrance Collection",
    name: "Noir Parfum Extrait",
    price: 185,
    compareAt: 250,
    image: "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=2400&q=96",
    gallery: [
      "https://images.unsplash.com/photo-1541643600914-78b084683601?auto=format&fit=crop&w=2400&q=96",
      "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2400&q=96",
    ],
    statement: "A deep, polished fragrance presentation created for evening ritual and lasting impression.",
    details: ["Premium fragrance presentation", "Statement profile", "Gift-worthy design", "Curated by SAHJONY"],
  },
  {
    slug: "signature-eau-de-parfum",
    collection: "beauty-fragrance",
    category: "Beauty & Fragrance",
    brandLabel: "Private Scent Edit",
    name: "Signature Eau de Parfum",
    price: 145,
    compareAt: 205,
    image: "https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2400&q=96",
    gallery: ["https://images.unsplash.com/photo-1594035910387-fea47794261f?auto=format&fit=crop&w=2400&q=96"],
    statement: "Modern elegance in a refined scent profile designed to feel personal and memorable.",
    details: ["Premium presentation", "Distinctive scent profile", "Elegant bottle design", "SAHJONY selected"],
  },
];

export const collectionTitles: Record<string, { eyebrow: string; title: string; description: string }> = {
  "bags-leather": { eyebrow: "BAGS & LEATHER", title: "Sculpted essentials", description: "Refined forms, elevated textures and timeless silhouettes." },
  timepieces: { eyebrow: "TIMEPIECES", title: "Precision, elevated", description: "Modern expressions of proportion, detail and enduring design." },
  footwear: { eyebrow: "FOOTWEAR", title: "Icons in motion", description: "Premium silhouettes selected for presence, comfort and versatility." },
  "beauty-fragrance": { eyebrow: "BEAUTY & FRAGRANCE", title: "Rare signatures", description: "Distinctive fragrances and beauty objects with exceptional presentation." },
};
