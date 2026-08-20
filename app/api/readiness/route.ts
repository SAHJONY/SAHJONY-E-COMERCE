import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';
import { ensureInventoryReservationSchema, releaseExpiredReservations } from '@/lib/inventory-reservations';

type OkRow = { ok?: number };
type CountRow = { count?: number };

export async function GET() {
  const checks = {
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    liveSalesEnabled: process.env.COMMERCE_LIVE_SALES_ENABLED === 'true',
    databaseConnected: false,
    ledgerReady: false,
    verifiedInventoryReady: false,
    reservationLayerReady: false,
    staleReservationsCleared: false,
  };

  let verifiedSellableProducts = 0;
  let openReservations = 0;

  if (checks.databaseConfigured) {
    try {
      await ensureCommerceSchema();
      await ensureInventoryReservationSchema();
      await releaseExpiredReservations();
      const sql = getSql();
      const result = (await sql`select 1 as ok`) as unknown as OkRow[];
      checks.databaseConnected = result[0]?.ok === 1;

      const tables = (await sql`
        select count(*)::int as count
        from information_schema.tables
        where table_schema = 'public'
          and table_name in ('products','customers','orders','order_items','checkout_sessions','inventory_reservations')
      `) as unknown as CountRow[];
      checks.ledgerReady = Number(tables[0]?.count ?? 0) === 6;
      checks.reservationLayerReady = checks.ledgerReady;

      const inventory = (await sql`
        select count(*)::int as count
        from public.products
        where is_active = true and source_verified = true and inventory_quantity > 0
      `) as unknown as CountRow[];
      verifiedSellableProducts = Number(inventory[0]?.count ?? 0);
      checks.verifiedInventoryReady = verifiedSellableProducts > 0;

      const stale = (await sql`
        select count(*)::int as count
        from public.inventory_reservations
        where status = 'reserved' and expires_at <= now()
      `) as unknown as CountRow[];
      checks.staleReservationsCleared = Number(stale[0]?.count ?? 0) === 0;

      const open = (await sql`
        select count(*)::int as count
        from public.inventory_reservations
        where status = 'reserved' and expires_at > now()
      `) as unknown as CountRow[];
      openReservations = Number(open[0]?.count ?? 0);
    } catch {
      checks.databaseConnected = false;
      checks.ledgerReady = false;
      checks.verifiedInventoryReady = false;
      checks.reservationLayerReady = false;
      checks.staleReservationsCleared = false;
    }
  }

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({
    service: 'sahjony-commerce',
    ready,
    verifiedSellableProducts,
    openReservations,
    checks,
  }, { status: ready ? 200 : 503 });
}
