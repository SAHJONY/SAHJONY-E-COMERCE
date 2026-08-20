import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';
import { writeOwnerAudit } from '@/lib/owner-audit';

const allowedStatuses = new Set(['unfulfilled','processing','shipped','delivered','canceled']);

function authorized(request: Request) {
  const configured = process.env.OWNER_OPERATIONS_TOKEN;
  const supplied = request.headers.get('x-owner-token');
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured);
  const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a, b);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });
  await ensureCommerceSchema();
  const sql = getSql();
  const orders = await sql`
    select id, order_number, email, status, payment_status, fulfillment_status,
           total_cents, currency, tracking_carrier, tracking_number,
           shipped_at, delivered_at, created_at, updated_at
    from public.orders
    order by created_at desc
    limit 200
  `;
  return NextResponse.json({ orders });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });

  const body = await request.json();
  const orderId = String(body?.orderId ?? '').trim();
  const fulfillmentStatus = String(body?.fulfillmentStatus ?? '').trim();
  const trackingCarrier = body?.trackingCarrier ? String(body.trackingCarrier).trim() : null;
  const trackingNumber = body?.trackingNumber ? String(body.trackingNumber).trim() : null;

  if (!orderId || !allowedStatuses.has(fulfillmentStatus)) {
    return NextResponse.json({ error: 'invalid_fulfillment_update' }, { status: 400 });
  }
  if (fulfillmentStatus === 'shipped' && (!trackingCarrier || !trackingNumber)) {
    return NextResponse.json({ error: 'tracking_required_for_shipment' }, { status: 400 });
  }

  await ensureCommerceSchema();
  const sql = getSql();
  const updated = await sql`
    update public.orders
    set fulfillment_status = ${fulfillmentStatus},
        tracking_carrier = case when ${fulfillmentStatus} = 'shipped' then ${trackingCarrier} else tracking_carrier end,
        tracking_number = case when ${fulfillmentStatus} = 'shipped' then ${trackingNumber} else tracking_number end,
        shipped_at = case when ${fulfillmentStatus} = 'shipped' then coalesce(shipped_at, now()) else shipped_at end,
        delivered_at = case when ${fulfillmentStatus} = 'delivered' then coalesce(delivered_at, now()) else delivered_at end,
        updated_at = now()
    where id = ${orderId}::uuid
    returning id, order_number, fulfillment_status, tracking_carrier, tracking_number, shipped_at, delivered_at
  `;

  if (!Array.isArray(updated) || updated.length === 0) {
    return NextResponse.json({ error: 'order_not_found' }, { status: 404 });
  }

  const order = updated[0] as { order_number?: string; fulfillment_status?: string; tracking_carrier?: string | null; tracking_number?: string | null };
  await writeOwnerAudit({
    action: 'order.fulfillment_update',
    entityType: 'order',
    entityId: orderId,
    metadata: {
      orderNumber: order.order_number,
      fulfillmentStatus: order.fulfillment_status,
      trackingCarrier: order.tracking_carrier,
      trackingNumber: order.tracking_number,
    },
  });

  return NextResponse.json({ order });
}
