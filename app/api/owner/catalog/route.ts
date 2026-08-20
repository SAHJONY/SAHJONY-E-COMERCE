import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';

type CatalogItemInput = {
  slug?: string;
  sku?: string;
  brand?: string;
  name?: string;
  priceCents?: number;
  compareAtCents?: number | null;
  currency?: string;
  imageUrl?: string | null;
  inventoryQuantity?: number;
  isActive?: boolean;
  sourceVerified?: boolean;
};

function authorized(request: Request) {
  const configured = process.env.OWNER_OPERATIONS_TOKEN;
  const supplied = request.headers.get('x-owner-token');
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

function normalize(item: CatalogItemInput) {
  const slug = String(item.slug ?? '').trim().toLowerCase();
  const sku = String(item.sku ?? '').trim();
  const name = String(item.name ?? '').trim();
  const brand = String(item.brand ?? '').trim();
  const priceCents = Math.round(Number(item.priceCents));
  const compareAtCents = item.compareAtCents == null ? null : Math.round(Number(item.compareAtCents));
  const inventoryQuantity = Math.max(0, Math.floor(Number(item.inventoryQuantity ?? 0)));
  const currency = String(item.currency ?? 'USD').trim().toUpperCase();
  const imageUrl = item.imageUrl ? String(item.imageUrl).trim() : null;

  if (!slug || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug)) throw new Error('invalid_slug');
  if (!sku || !name || !brand) throw new Error('required_fields_missing');
  if (!Number.isFinite(priceCents) || priceCents <= 0) throw new Error('invalid_price');
  if (compareAtCents != null && (!Number.isFinite(compareAtCents) || compareAtCents < priceCents)) throw new Error('invalid_compare_at');
  if (currency !== 'USD') throw new Error('unsupported_currency');

  return {
    slug,
    sku,
    name,
    brand,
    priceCents,
    compareAtCents,
    inventoryQuantity,
    currency,
    imageUrl,
    isActive: item.isActive === true,
    sourceVerified: item.sourceVerified === true,
  };
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });

  await ensureCommerceSchema();
  const sql = getSql();
  const products = await sql`
    select slug, sku, brand, name, price_cents, compare_at_cents, currency, image_url,
           inventory_quantity, is_active, source_verified, created_at, updated_at
    from public.products
    order by updated_at desc
  `;
  return NextResponse.json({ products });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });

  try {
    const body = await request.json();
    const items = Array.isArray(body?.items) ? body.items : [body];
    if (!items.length || items.length > 100) return NextResponse.json({ error: 'invalid_batch_size' }, { status: 400 });

    await ensureCommerceSchema();
    const sql = getSql();
    const updated: string[] = [];

    for (const raw of items) {
      const item = normalize(raw as CatalogItemInput);
      await sql`
        insert into public.products (
          slug, sku, brand, name, price_cents, compare_at_cents, currency, image_url,
          inventory_quantity, is_active, source_verified, updated_at
        ) values (
          ${item.slug}, ${item.sku}, ${item.brand}, ${item.name}, ${item.priceCents},
          ${item.compareAtCents}, ${item.currency}, ${item.imageUrl}, ${item.inventoryQuantity},
          ${item.isActive}, ${item.sourceVerified}, now()
        )
        on conflict (slug) do update set
          sku = excluded.sku,
          brand = excluded.brand,
          name = excluded.name,
          price_cents = excluded.price_cents,
          compare_at_cents = excluded.compare_at_cents,
          currency = excluded.currency,
          image_url = excluded.image_url,
          inventory_quantity = excluded.inventory_quantity,
          is_active = excluded.is_active,
          source_verified = excluded.source_verified,
          updated_at = now()
      `;
      updated.push(item.slug);
    }

    return NextResponse.json({ updated, count: updated.length });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'catalog_update_failed';
    const known = ['invalid_slug','required_fields_missing','invalid_price','invalid_compare_at','unsupported_currency'];
    return NextResponse.json({ error: known.includes(message) ? message : 'catalog_update_failed' }, { status: known.includes(message) ? 400 : 503 });
  }
}
