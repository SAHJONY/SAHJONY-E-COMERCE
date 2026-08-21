import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import intake from '@/data/catalog-intake-batch-001.json';
import { getSql } from '@/lib/db';
import { ensureOperationsSchema } from '@/lib/operations-schema';
import { writeOwnerAudit } from '@/lib/owner-audit';

const statuses = new Set(['hold','evidence_requested','evidence_received','under_review','approved','rejected']);
const supplierCodes: Record<string,string> = {
  'Perfumes Plus Wholesale': 'PERFUMES_PLUS',
  'Ready Distribution': 'READY_DISTRIBUTION',
  'Shinola Wholesale': 'SHINOLA_DIRECT',
  'Stratum Co.': 'STRATUM_CO',
};

function authorized(request: Request) {
  const configured = process.env.OWNER_OPERATIONS_TOKEN;
  const supplied = request.headers.get('x-owner-token');
  if (!configured || !supplied) return false;
  const a = Buffer.from(configured); const b = Buffer.from(supplied);
  return a.length === b.length && timingSafeEqual(a,b);
}

export async function GET(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error:'unauthorized' },{ status:401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error:'database_not_ready' },{ status:503 });
  await ensureOperationsSchema();
  const sql = getSql();
  const candidates = (await sql`select sc.id, sc.candidate_code, sc.priority, sc.category, sc.brand,
    sc.proposed_name, sc.manufacturer_sku, sc.status, sc.evidence_status, sc.target_price_cents,
    sc.proposed_inventory, sc.verification_method, sc.image_rights_status, sc.fulfillment_status,
    sa.code as supplier_code, sa.display_name as supplier_name, sa.status as supplier_status, sc.updated_at
    from public.sourcing_candidates sc left join public.supplier_accounts sa on sa.id = sc.supplier_account_id
    order by sc.priority asc, sc.candidate_code asc`) as unknown as Array<Record<string,unknown>>;
  return NextResponse.json({ candidates, count:candidates.length });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error:'unauthorized' },{ status:401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error:'database_not_ready' },{ status:503 });
  const body = await request.json();
  if (body?.action !== 'seed_intake') return NextResponse.json({ error:'unsupported_action' },{ status:400 });
  await ensureOperationsSchema();
  const sql = getSql();
  for (const [displayName,code] of Object.entries(supplierCodes)) {
    await sql`insert into public.supplier_accounts (code,display_name,status,source_type,updated_at)
      values (${code},${displayName},'prospect','wholesale_program',now())
      on conflict (code) do update set display_name=excluded.display_name, updated_at=now()`;
  }
  for (const candidate of intake.candidates) {
    const supplierCode = supplierCodes[candidate.sourceProgram];
    await sql`insert into public.sourcing_candidates (
      candidate_code,supplier_account_id,priority,category,brand,proposed_name,manufacturer_sku,
      status,evidence_status,target_price_cents,proposed_inventory,verification_method,updated_at
    ) values (
      ${candidate.candidateId},(select id from public.supplier_accounts where code=${supplierCode}),
      ${candidate.priority},${candidate.category},${candidate.brand},${candidate.product},null,'hold',
      ${candidate.evidenceStatus},null,0,null,now()
    ) on conflict (candidate_code) do update set supplier_account_id=excluded.supplier_account_id,
      priority=excluded.priority,category=excluded.category,brand=excluded.brand,
      evidence_status=excluded.evidence_status,updated_at=now()`;
  }
  await writeOwnerAudit({ action:'sourcing.intake_seeded',entityType:'sourcing_batch',entityId:intake.batchId,metadata:{ count:intake.candidates.length,status:'hold' } });
  return NextResponse.json({ seeded:intake.candidates.length,batchId:intake.batchId,status:'hold' },{ status:201 });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error:'unauthorized' },{ status:401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error:'database_not_ready' },{ status:503 });
  const body = await request.json();
  const id = String(body?.id ?? ''); const status = String(body?.status ?? '');
  if (!id || !statuses.has(status)) return NextResponse.json({ error:'invalid_candidate_update' },{ status:400 });
  await ensureOperationsSchema();
  const sql = getSql();
  const updated = (await sql`update public.sourcing_candidates set status=${status},updated_at=now()
    where id=${id}::uuid returning id,candidate_code,status,updated_at`) as unknown as Array<Record<string,unknown>>;
  if (!updated.length) return NextResponse.json({ error:'candidate_not_found' },{ status:404 });
  await writeOwnerAudit({ action:'sourcing.status_update',entityType:'sourcing_candidate',entityId:id,metadata:{ status } });
  return NextResponse.json({ candidate:updated[0] });
}
