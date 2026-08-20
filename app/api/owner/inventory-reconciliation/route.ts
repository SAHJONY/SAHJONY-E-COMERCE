import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'crypto';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';
import { writeOwnerAudit } from '@/lib/owner-audit';

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

  const hasReservations = (await sql`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'inventory_reservations'
    ) as exists
  `) as unknown as Array<{ exists?: boolean }>;

  const reservationTableExists = hasReservations[0]?.exists === true;
  const products = await sql`
    select slug, sku, inventory_quantity, is_active, source_verified
    from public.products
    order by updated_at desc
  `;

  let reserved: unknown[] = [];
  let expiredReservations = 0;
  if (reservationTableExists) {
    reserved = await sql`
      select product_slug, sum(quantity)::int as reserved_quantity
      from public.inventory_reservations
      where status = 'reserved' and expires_at > now()
      group by product_slug
      order by product_slug
    `;

    const expired = (await sql`
      select count(*)::int as count
      from public.inventory_reservations
      where status = 'reserved' and expires_at <= now()
    `) as unknown as Array<{ count?: number }>;
    expiredReservations = Number(expired[0]?.count ?? 0);
  }

  const negativeInventory = Array.isArray(products)
    ? products.filter((row: any) => Number(row.inventory_quantity) < 0).length
    : 0;

  const sellable = Array.isArray(products)
    ? products.filter((row: any) => row.is_active === true && row.source_verified === true && Number(row.inventory_quantity) > 0).length
    : 0;

  const healthy = negativeInventory === 0 && expiredReservations === 0;
  return NextResponse.json({
    healthy,
    reservationTableExists,
    expiredReservations,
    negativeInventory,
    sellableProducts: sellable,
    products,
    reservations: reserved,
  }, { status: healthy ? 200 : 409 });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });

  await ensureCommerceSchema();
  const sql = getSql();
  const exists = (await sql`
    select exists (
      select 1 from information_schema.tables
      where table_schema = 'public' and table_name = 'inventory_reservations'
    ) as exists
  `) as unknown as Array<{ exists?: boolean }>;

  if (exists[0]?.exists !== true) {
    return NextResponse.json({ reconciled: false, reason: 'reservation_layer_not_installed' }, { status: 409 });
  }

  const expired = (await sql`
    update public.inventory_reservations
    set status = 'expired', updated_at = now()
    where status = 'reserved' and expires_at <= now()
    returning product_slug, quantity
  `) as unknown as Array<{ product_slug: string; quantity: number | string }>;

  for (const row of expired) {
    await sql`
      update public.products
      set inventory_quantity = inventory_quantity + ${Number(row.quantity)}, updated_at = now()
      where slug = ${row.product_slug}
    `;
  }

  await writeOwnerAudit({
    action: 'inventory.reconcile',
    entityType: 'inventory',
    metadata: { expiredReservationsReleased: expired.length },
  });

  return NextResponse.json({ reconciled: true, expiredReservationsReleased: expired.length });
}
