import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSql } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { ensureCommerceSchema } from '@/lib/commerce-schema';

type CheckoutItem = { slug: string; quantity: number };
type CheckoutRequest = { email?: string; items?: CheckoutItem[] };
type ProductRow = {
  slug: string;
  name: string;
  price_cents: number | string;
  image_url?: string | null;
  inventory_quantity: number;
  is_active: boolean;
  source_verified: boolean;
};

export async function POST(request: Request) {
  try {
    if (process.env.COMMERCE_LIVE_SALES_ENABLED !== 'true') {
      return NextResponse.json({ error: 'live_sales_not_enabled' }, { status: 503 });
    }
    if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });
    if (!process.env.STRIPE_SECRET_KEY) return NextResponse.json({ error: 'payments_not_ready' }, { status: 503 });

    await ensureCommerceSchema();
    const sql = getSql();

    const body = (await request.json()) as CheckoutRequest;
    const email = body.email?.trim().toLowerCase();
    const requestedItems = Array.isArray(body.items) ? body.items : [];

    if (!email || !email.includes('@')) return NextResponse.json({ error: 'valid_email_required' }, { status: 400 });
    if (!requestedItems.length) return NextResponse.json({ error: 'bag_is_empty' }, { status: 400 });

    const normalized = requestedItems.map((item) => ({
      slug: String(item.slug),
      quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
    }));

    const pricedItems: Array<{ product: ProductRow; quantity: number }> = [];
    for (const item of normalized) {
      const rows = (await sql`
        select slug, name, price_cents, image_url, inventory_quantity, is_active, source_verified
        from public.products
        where slug = ${item.slug}
        limit 1
      `) as unknown as ProductRow[];
      const product = rows[0];
      if (!product) return NextResponse.json({ error: 'product_not_live' }, { status: 409 });
      if (!product.is_active || !product.source_verified) return NextResponse.json({ error: 'product_not_verified' }, { status: 409 });
      if (Number(product.inventory_quantity) < item.quantity) return NextResponse.json({ error: 'insufficient_inventory' }, { status: 409 });
      pricedItems.push({ product, quantity: item.quantity });
    }

    const sessionKey = randomUUID();
    const cartSnapshot = pricedItems.map(({ product, quantity }) => ({
      slug: product.slug,
      name: product.name,
      unitPriceCents: Number(product.price_cents),
      quantity,
      image: product.image_url ?? undefined,
    }));

    await sql`
      insert into public.checkout_sessions (session_key, customer_email, cart_snapshot, status, expires_at)
      values (${sessionKey}, ${email}, ${JSON.stringify(cartSnapshot)}::jsonb, 'open', now() + interval '30 minutes')
    `;

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const stripeSession = await getStripe().checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: pricedItems.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Number(product.price_cents),
          product_data: {
            name: product.name,
            images: product.image_url ? [product.image_url] : undefined,
          },
        },
      })),
      metadata: { sahjony_session_key: sessionKey },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout`,
      billing_address_collection: 'auto',
      shipping_address_collection: { allowed_countries: ['US'] },
      allow_promotion_codes: false,
    });

    await sql`
      update public.checkout_sessions
      set stripe_session_id = ${stripeSession.id}, status = 'stripe_created', updated_at = now()
      where session_key = ${sessionKey}
    `;

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('checkout_session_error', error);
    return NextResponse.json({ error: 'checkout_unavailable' }, { status: 503 });
  }
}
