import { getSql } from './db';
import { ensureCommerceSchema } from './commerce-schema';

let operationsSchemaPromise: Promise<void> | null = null;

async function createOperationsSchema() {
  await ensureCommerceSchema();
  const sql = getSql();

  await sql`create table if not exists public.supplier_accounts (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    display_name text not null,
    status text not null default 'prospect',
    source_type text,
    contact_email text,
    terms text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.product_operations (
    product_id uuid primary key references public.products(id) on delete cascade,
    supplier_account_id uuid references public.supplier_accounts(id) on delete set null,
    unit_cost_cents bigint,
    reorder_point integer not null default 0,
    procurement_status text not null default 'hold',
    last_verified_at timestamptz,
    notes text,
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.purchase_orders (
    id uuid primary key default gen_random_uuid(),
    po_number text not null unique,
    supplier_account_id uuid references public.supplier_accounts(id) on delete set null,
    status text not null default 'draft',
    subtotal_cents bigint not null default 0,
    shipping_cents bigint not null default 0,
    total_cents bigint not null default 0,
    expected_at timestamptz,
    received_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.purchase_order_items (
    id uuid primary key default gen_random_uuid(),
    purchase_order_id uuid not null references public.purchase_orders(id) on delete cascade,
    product_id uuid references public.products(id) on delete set null,
    sku_snapshot text,
    unit_cost_cents bigint not null default 0,
    quantity integer not null check (quantity > 0),
    received_quantity integer not null default 0 check (received_quantity >= 0),
    created_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.owner_tasks (
    id uuid primary key default gen_random_uuid(),
    title text not null,
    category text not null default 'operations',
    priority text not null default 'medium',
    status text not null default 'open',
    due_at timestamptz,
    entity_type text,
    entity_id text,
    notes text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
  )`;

  await sql`create table if not exists public.commerce_events (
    id uuid primary key default gen_random_uuid(),
    session_key text not null,
    event_name text not null,
    path text,
    product_slug text,
    order_id uuid references public.orders(id) on delete set null,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`;

  await sql`create index if not exists supplier_accounts_status_idx on public.supplier_accounts(status, updated_at desc)`;
  await sql`create index if not exists product_operations_supplier_idx on public.product_operations(supplier_account_id)`;
  await sql`create index if not exists purchase_orders_status_idx on public.purchase_orders(status, created_at desc)`;
  await sql`create index if not exists purchase_order_items_po_idx on public.purchase_order_items(purchase_order_id)`;
  await sql`create index if not exists owner_tasks_status_idx on public.owner_tasks(status, priority, created_at desc)`;
  await sql`create index if not exists commerce_events_created_idx on public.commerce_events(created_at desc)`;
  await sql`create index if not exists commerce_events_session_idx on public.commerce_events(session_key, created_at desc)`;
  await sql`create index if not exists commerce_events_name_idx on public.commerce_events(event_name, created_at desc)`;
}

export function ensureOperationsSchema() {
  if (!operationsSchemaPromise) {
    operationsSchemaPromise = createOperationsSchema().catch((error) => {
      operationsSchemaPromise = null;
      throw error;
    });
  }
  return operationsSchemaPromise;
}
