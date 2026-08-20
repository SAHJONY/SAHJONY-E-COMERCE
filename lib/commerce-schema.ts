import { getSql } from './db';

let schemaPromise: Promise<void> | null = null;

async function createSchema() {
  const sql = getSql();

  await sql`create extension if not exists pgcrypto`;

  await sql`create table if not exists public.products (
    id uuid primary key default gen_random_uuid(),
    slug text not null unique,
    sku text unique,
    brand text,
    name text not null,
    price_cents bigint not null,
    compare_at_cents bigint,
    currency text not null default 'USD',
    image_url text,
    inventory_quantity integer not null default 0 check (inventory_quantity >= 0),
    is_active boolean not null default false,
    source_verified boolean not null default false,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.customers (
    id uuid primary key default gen_random_uuid(),
    email text not null unique,
    first_name text,
    last_name text,
    phone text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.customer_addresses (
    id uuid primary key default gen_random_uuid(),
    customer_id uuid not null references public.customers(id) on delete cascade,
    label text,
    line1 text not null,
    line2 text,
    city text not null,
    region text not null,
    postal_code text not null,
    country_code text not null default 'US',
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.orders (
    id uuid primary key default gen_random_uuid(),
    order_number text not null unique,
    customer_id uuid references public.customers(id) on delete set null,
    email text not null,
    currency text not null default 'USD',
    status text not null default 'draft',
    payment_status text not null default 'unpaid',
    fulfillment_status text not null default 'unfulfilled',
    subtotal_cents bigint not null default 0,
    shipping_cents bigint not null default 0,
    tax_cents bigint not null default 0,
    total_cents bigint not null default 0,
    shipping_address jsonb,
    billing_address jsonb,
    stripe_session_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`alter table public.orders add column if not exists stripe_session_id text`;

  await sql`create table if not exists public.order_items (
    id uuid primary key default gen_random_uuid(),
    order_id uuid not null references public.orders(id) on delete cascade,
    product_slug text not null,
    product_name text not null,
    unit_price_cents bigint not null,
    quantity integer not null check (quantity > 0),
    image_url text,
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.checkout_sessions (
    id uuid primary key default gen_random_uuid(),
    session_key text not null unique,
    customer_email text,
    cart_snapshot jsonb not null,
    stripe_session_id text,
    status text not null default 'open',
    expires_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`alter table public.checkout_sessions add column if not exists stripe_session_id text`;

  await sql`create unique index if not exists orders_stripe_session_id_uidx on public.orders(stripe_session_id) where stripe_session_id is not null`;
  await sql`create unique index if not exists checkout_sessions_stripe_session_id_uidx on public.checkout_sessions(stripe_session_id) where stripe_session_id is not null`;
  await sql`create index if not exists products_active_idx on public.products(is_active, source_verified)`;
  await sql`create index if not exists orders_customer_id_idx on public.orders(customer_id)`;
  await sql`create index if not exists orders_created_at_idx on public.orders(created_at desc)`;
  await sql`create index if not exists order_items_order_id_idx on public.order_items(order_id)`;
  await sql`create index if not exists customer_addresses_customer_id_idx on public.customer_addresses(customer_id)`;
}

export function ensureCommerceSchema() {
  if (!schemaPromise) {
    schemaPromise = createSchema().catch((error) => {
      schemaPromise = null;
      throw error;
    });
  }
  return schemaPromise;
}
