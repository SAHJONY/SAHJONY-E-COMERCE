import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureCommerceSchema } from '@/lib/commerce-schema';

export async function GET() {
  const checks = {
    databaseConfigured: Boolean(process.env.DATABASE_URL),
    stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
    webhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
    appUrlConfigured: Boolean(process.env.NEXT_PUBLIC_APP_URL),
    databaseConnected: false,
    ledgerReady: false,
  };

  if (checks.databaseConfigured) {
    try {
      await ensureCommerceSchema();
      const sql = getSql();
      const result = await sql`select 1 as ok`;
      checks.databaseConnected = result[0]?.ok === 1;
      const tables = await sql`
        select count(*)::int as count
        from information_schema.tables
        where table_schema = 'public'
          and table_name in ('customers','orders','order_items','checkout_sessions')
      `;
      checks.ledgerReady = Number(tables[0]?.count ?? 0) === 4;
    } catch {
      checks.databaseConnected = false;
      checks.ledgerReady = false;
    }
  }

  const ready = Object.values(checks).every(Boolean);
  return NextResponse.json({ service: 'sahjony-commerce', ready, checks }, { status: ready ? 200 : 503 });
}
