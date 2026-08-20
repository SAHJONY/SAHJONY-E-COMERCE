import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureOperationsSchema } from '@/lib/operations-schema';

const allowedEvents = new Set(['page_view','product_view','add_to_cart','remove_from_cart','checkout_started','checkout_completed']);

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) return NextResponse.json({ accepted: false }, { status: 202 });
  const body = await request.json().catch(() => null);
  const sessionKey = String(body?.sessionKey ?? '').trim().slice(0, 120);
  const eventName = String(body?.eventName ?? '').trim();
  const path = body?.path ? String(body.path).slice(0, 500) : null;
  const productSlug = body?.productSlug ? String(body.productSlug).slice(0, 200) : null;
  const metadata = body?.metadata && typeof body.metadata === 'object' ? body.metadata : {};
  if (!sessionKey || !allowedEvents.has(eventName)) return NextResponse.json({ accepted: false }, { status: 400 });

  await ensureOperationsSchema();
  const sql = getSql();
  await sql`insert into public.commerce_events (session_key, event_name, path, product_slug, metadata)
    values (${sessionKey}, ${eventName}, ${path}, ${productSlug}, ${JSON.stringify(metadata)}::jsonb)`;
  return NextResponse.json({ accepted: true }, { status: 202 });
}
