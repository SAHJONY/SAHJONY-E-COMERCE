import { getSql } from './db';

type ReservationItem = { slug: string; quantity: number };
type ProductRow = {
  slug: string;
  name: string;
  price_cents: number | string;
  image_url?: string | null;
  inventory_quantity: number;
  is_active: boolean;
  source_verified: boolean;
};
type ReservationRow = { product_slug: string; quantity: number | string };

export async function ensureInventoryReservationSchema() {
  const sql = getSql();
  await sql`create table if not exists public.inventory_reservations (
    id uuid primary key default gen_random_uuid(),
    session_key text not null,
    product_slug text not null,
    quantity integer not null check (quantity > 0),
    status text not null default 'reserved',
    expires_at timestamptz not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(session_key, product_slug)
  )`;
  await sql`create index if not exists inventory_reservations_expiry_idx
    on public.inventory_reservations(status, expires_at)`;
}

export async function releaseExpiredReservations() {
  await ensureInventoryReservationSchema();
  const sql = getSql();
  const expired = (await sql`
    update public.inventory_reservations
    set status = 'expired', updated_at = now()
    where status = 'reserved' and expires_at <= now()
    returning product_slug, quantity
  `) as unknown as ReservationRow[];

  for (const row of expired) {
    await sql`
      update public.products
      set inventory_quantity = inventory_quantity + ${Number(row.quantity)}, updated_at = now()
      where slug = ${row.product_slug}
    `;
  }
}

export async function reserveInventory(sessionKey: string, items: ReservationItem[]) {
  await ensureInventoryReservationSchema();
  await releaseExpiredReservations();
  const sql = getSql();
  const reserved: ReservationItem[] = [];
  const products: Array<{ product: ProductRow; quantity: number }> = [];

  try {
    for (const item of items) {
      const rows = (await sql`
        update public.products
        set inventory_quantity = inventory_quantity - ${item.quantity}, updated_at = now()
        where slug = ${item.slug}
          and is_active = true
          and source_verified = true
          and inventory_quantity >= ${item.quantity}
        returning slug, name, price_cents, image_url, inventory_quantity, is_active, source_verified
      `) as unknown as ProductRow[];

      const product = rows[0];
      if (!product) throw new Error(`inventory_unavailable:${item.slug}`);

      await sql`
        insert into public.inventory_reservations (session_key, product_slug, quantity, status, expires_at)
        values (${sessionKey}, ${item.slug}, ${item.quantity}, 'reserved', now() + interval '30 minutes')
      `;
      reserved.push(item);
      products.push({ product, quantity: item.quantity });
    }
    return products;
  } catch (error) {
    for (const item of reserved) {
      await sql`
        update public.products
        set inventory_quantity = inventory_quantity + ${item.quantity}, updated_at = now()
        where slug = ${item.slug}
      `;
      await sql`
        update public.inventory_reservations
        set status = 'released', updated_at = now()
        where session_key = ${sessionKey} and product_slug = ${item.slug} and status = 'reserved'
      `;
    }
    throw error;
  }
}

export async function releaseReservation(sessionKey: string) {
  await ensureInventoryReservationSchema();
  const sql = getSql();
  const rows = (await sql`
    update public.inventory_reservations
    set status = 'released', updated_at = now()
    where session_key = ${sessionKey} and status = 'reserved'
    returning product_slug, quantity
  `) as unknown as ReservationRow[];

  for (const row of rows) {
    await sql`
      update public.products
      set inventory_quantity = inventory_quantity + ${Number(row.quantity)}, updated_at = now()
      where slug = ${row.product_slug}
    `;
  }
}

export async function consumeReservation(sessionKey: string) {
  await ensureInventoryReservationSchema();
  const sql = getSql();
  await sql`
    update public.inventory_reservations
    set status = 'consumed', updated_at = now()
    where session_key = ${sessionKey} and status = 'reserved'
  `;
}
