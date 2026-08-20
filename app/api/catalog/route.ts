import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';

type LiveProductRow = {
  slug: string;
  sku: string | null;
  brand: string | null;
  name: string;
  price_cents: number | string;
  compare_at_cents: number | string | null;
  currency: string;
  image_url: string | null;
  inventory_quantity: number;
};

export async function GET() {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ products: [], error: 'catalog_unavailable' }, { status: 503 });
  }

  try {
    await ensureCommerceSchema();
    const sql = getSql();
    const rows = (await sql`
      select slug, sku, brand, name, price_cents, compare_at_cents, currency, image_url, inventory_quantity
      from public.products
      where is_active = true
        and source_verified = true
        and inventory_quantity > 0
      order by updated_at desc, name asc
    `) as unknown as LiveProductRow[];

    const products = rows.map((row) => ({
      slug: row.slug,
      sku: row.sku,
      brand: row.brand,
      name: row.name,
      price: Number(row.price_cents) / 100,
      compareAt: row.compare_at_cents == null ? null : Number(row.compare_at_cents) / 100,
      currency: row.currency,
      image: row.image_url,
      inventoryQuantity: Number(row.inventory_quantity),
    }));

    return NextResponse.json({ products, count: products.length });
  } catch (error) {
    console.error('live_catalog_error', error);
    return NextResponse.json({ products: [], error: 'catalog_unavailable' }, { status: 503 });
  }
}
