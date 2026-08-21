import { neon } from '@neondatabase/serverless';
import intake from '../data/catalog-intake-batch-001.json' with { type:'json' };

if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL is required');
const sql=neon(process.env.DATABASE_URL);
const supplierPrograms={
  'Perfumes Plus Wholesale':{code:'PERFUMES_PLUS',sourceType:'wholesale_program'},
  'Ready Distribution':{code:'READY_DISTRIBUTION',sourceType:'authorized_distribution'},
  'Shinola Wholesale':{code:'SHINOLA_DIRECT',sourceType:'brand_direct'},
  'Stratum Co.':{code:'STRATUM_CO',sourceType:'authorized_closeout'},
  'Faire Wholesale':{code:'FAIRE_WHOLESALE',sourceType:'wholesale_marketplace'},
  'B-Stock Contemporary Fashion':{code:'BSTOCK_CONTEMPORARY',sourceType:'liquidation_marketplace'},
  'ShopSimon':{code:'SHOPSIMON',sourceType:'market_intelligence_affiliate_only'},
};

await sql`create extension if not exists pgcrypto`;
await sql`create table if not exists public.supplier_accounts (
  id uuid primary key default gen_random_uuid(), code text not null unique, display_name text not null,
  status text not null default 'prospect', source_type text, contact_email text, terms text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
)`;
await sql`create table if not exists public.sourcing_candidates (
  id uuid primary key default gen_random_uuid(), candidate_code text not null unique,
  supplier_account_id uuid references public.supplier_accounts(id) on delete set null,
  priority integer not null default 3 check (priority between 1 and 5), category text not null, brand text not null,
  proposed_name text, manufacturer_sku text, status text not null default 'hold', evidence_status text not null,
  target_price_cents bigint, proposed_inventory integer not null default 0 check (proposed_inventory >= 0),
  verification_method text, image_rights_status text not null default 'unverified',
  fulfillment_status text not null default 'unverified', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
)`;

for (const [displayName,program] of Object.entries(supplierPrograms)) {
  await sql`insert into public.supplier_accounts (code,display_name,status,source_type,updated_at)
    values (${program.code},${displayName},'prospect',${program.sourceType},now())
    on conflict (code) do update set display_name=excluded.display_name,source_type=excluded.source_type,updated_at=now()`;
}
for (const candidate of intake.candidates) {
  const supplierCode=supplierPrograms[candidate.sourceProgram]?.code;
  if (!supplierCode) throw new Error(`Unknown sourcing program: ${candidate.sourceProgram}`);
  await sql`insert into public.sourcing_candidates (
    candidate_code,supplier_account_id,priority,category,brand,proposed_name,status,evidence_status,proposed_inventory,updated_at
  ) values (
    ${candidate.candidateId},(select id from public.supplier_accounts where code=${supplierCode}),
    ${candidate.priority},${candidate.category},${candidate.brand},${candidate.product},'hold',${candidate.evidenceStatus},0,now()
  ) on conflict (candidate_code) do update set supplier_account_id=excluded.supplier_account_id,
    priority=excluded.priority,category=excluded.category,brand=excluded.brand,evidence_status=excluded.evidence_status,updated_at=now()`;
}

const counts=await sql`select count(*)::int as total,
  count(*) filter (where status='hold')::int as hold,
  count(*) filter (where manufacturer_sku is not null)::int as exact_skus
  from public.sourcing_candidates`;
const suppliers=await sql`select count(*)::int as total from public.supplier_accounts`;
console.log(JSON.stringify({ batchId:intake.batchId,candidates:counts[0],suppliers:Number(suppliers[0]?.total||0),publicProductsActivated:0 }));
