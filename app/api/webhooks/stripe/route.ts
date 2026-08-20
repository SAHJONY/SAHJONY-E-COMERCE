import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { getStripe } from '@/lib/stripe';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';

type CheckoutSnapshotItem = { slug:string; name:string; unitPriceCents:number; quantity:number; image?:string };
type CheckoutRow = { cart_snapshot?: CheckoutSnapshotItem[]; status?: string };
type IdRow = { id?: string };

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) return NextResponse.json({ error: 'webhook_not_configured' }, { status: 503 });

  const signature = request.headers.get('stripe-signature');
  if (!signature) return NextResponse.json({ error: 'missing_signature' }, { status: 400 });

  const payload = await request.text();
  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(payload, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: 'invalid_signature' }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    const sessionKey = session.metadata?.sahjony_session_key;
    const email = session.customer_details?.email || session.customer_email;

    if (sessionKey && email) {
      await ensureCommerceSchema();
      const sql = getSql();

      const existingOrders = (await sql`
        select id from public.orders where stripe_session_id = ${session.id} limit 1
      `) as unknown as IdRow[];
      if (existingOrders[0]?.id) {
        await sql`
          update public.checkout_sessions
          set status = 'completed', updated_at = now()
          where session_key = ${sessionKey}
        `;
        return NextResponse.json({ received: true, duplicate: true });
      }

      const rows = (await sql`
        select cart_snapshot, status from public.checkout_sessions
        where session_key = ${sessionKey}
        limit 1
      `) as unknown as CheckoutRow[];
      const checkout = rows[0];

      if (checkout?.cart_snapshot && checkout.status !== 'completed') {
        const orderNumber = `SAH-${Date.now().toString(36).toUpperCase()}-${session.id.slice(-6).toUpperCase()}`;
        const subtotal = checkout.cart_snapshot.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);

        const customers = (await sql`
          insert into public.customers (email)
          values (${email.toLowerCase()})
          on conflict (email) do update set updated_at = now()
          returning id
        `) as unknown as IdRow[];
        const customerId = customers[0]?.id;
        if (!customerId) throw new Error('customer_persistence_failed');

        const orders = (await sql`
          insert into public.orders (
            order_number, customer_id, email, currency, status, payment_status,
            fulfillment_status, subtotal_cents, shipping_cents, tax_cents, total_cents,
            shipping_address, billing_address, stripe_session_id
          ) values (
            ${orderNumber}, ${customerId}, ${email.toLowerCase()}, 'USD', 'confirmed', 'paid',
            'unfulfilled', ${subtotal}, 0, 0, ${session.amount_total ?? subtotal},
            ${JSON.stringify(session.customer_details?.address ?? null)}::jsonb,
            ${JSON.stringify(session.customer_details?.address ?? null)}::jsonb,
            ${session.id}
          ) returning id
        `) as unknown as IdRow[];
        const orderId = orders[0]?.id;
        if (!orderId) throw new Error('order_persistence_failed');

        for (const item of checkout.cart_snapshot) {
          await sql`
            insert into public.order_items (order_id, product_slug, product_name, unit_price_cents, quantity, image_url)
            values (${orderId}, ${item.slug}, ${item.name}, ${item.unitPriceCents}, ${item.quantity}, ${item.image ?? null})
          `;
        }

        await sql`
          update public.checkout_sessions
          set status = 'completed', stripe_session_id = ${session.id}, updated_at = now()
          where session_key = ${sessionKey}
        `;
      }
    }
  }

  return NextResponse.json({ received: true });
}
