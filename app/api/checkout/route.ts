import { NextResponse } from 'next/server';
import { randomUUID } from 'crypto';
import { getSql } from '@/lib/db';
import { getStripe } from '@/lib/stripe';
import { publicProducts } from '@/lib/public-catalog';

type CheckoutItem = { slug: string; quantity: number };

type CheckoutRequest = {
  email?: string;
  items?: CheckoutItem[];
};

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });
    }
    if (!process.env.STRIPE_SECRET_KEY) {
      return NextResponse.json({ error: 'payments_not_ready' }, { status: 503 });
    }

    const body = (await request.json()) as CheckoutRequest;
    const email = body.email?.trim().toLowerCase();
    const requestedItems = Array.isArray(body.items) ? body.items : [];

    if (!email || !email.includes('@')) {
      return NextResponse.json({ error: 'valid_email_required' }, { status: 400 });
    }
    if (!requestedItems.length) {
      return NextResponse.json({ error: 'bag_is_empty' }, { status: 400 });
    }

    const normalized = requestedItems.map((item) => ({
      slug: String(item.slug),
      quantity: Math.max(1, Math.min(10, Number(item.quantity) || 1)),
    }));

    const pricedItems = normalized.map((item) => {
      const product = publicProducts.find((candidate) => candidate.slug === item.slug);
      if (!product) throw new Error(`unknown_product:${item.slug}`);
      return { product, quantity: item.quantity };
    });

    const sessionKey = randomUUID();
    const cartSnapshot = pricedItems.map(({ product, quantity }) => ({
      slug: product.slug,
      name: product.name,
      unitPriceCents: Math.round(product.price * 100),
      quantity,
      image: product.image,
    }));

    const sql = getSql();
    await sql`
      insert into public.checkout_sessions (session_key, customer_email, cart_snapshot, status, expires_at)
      values (${sessionKey}, ${email}, ${JSON.stringify(cartSnapshot)}::jsonb, 'open', now() + interval '30 minutes')
    `;

    const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(request.url).origin;
    const stripe = getStripe();
    const stripeSession = await stripe.checkout.sessions.create({
      mode: 'payment',
      customer_email: email,
      line_items: pricedItems.map(({ product, quantity }) => ({
        quantity,
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(product.price * 100),
          product_data: {
            name: product.name,
            images: product.image ? [product.image] : undefined,
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
      set status = 'stripe_created', updated_at = now()
      where session_key = ${sessionKey}
    `;

    return NextResponse.json({ url: stripeSession.url });
  } catch (error) {
    console.error('checkout_session_error', error);
    const message = error instanceof Error ? error.message : 'unknown_error';
    if (message.startsWith('unknown_product:')) {
      return NextResponse.json({ error: 'invalid_product' }, { status: 400 });
    }
    return NextResponse.json({ error: 'checkout_unavailable' }, { status: 503 });
  }
}
