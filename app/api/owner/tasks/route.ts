import { timingSafeEqual } from 'crypto';
import { NextResponse } from 'next/server';
import { getSql } from '@/lib/db';
import { ensureOperationsSchema } from '@/lib/operations-schema';
import { writeOwnerAudit } from '@/lib/owner-audit';

const priorities = new Set(['critical','high','medium','low']);
const statuses = new Set(['open','in_progress','blocked','done','canceled']);

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
  await ensureOperationsSchema();
  const sql = getSql();
  const tasks = await sql`select id, title, category, priority, status, due_at, entity_type, entity_id, notes, created_at, updated_at
    from public.owner_tasks order by created_at desc limit 200`;
  return NextResponse.json({ tasks });
}

export async function POST(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });
  const body = await request.json();
  const title = String(body?.title ?? '').trim();
  const category = String(body?.category ?? 'operations').trim();
  const priority = String(body?.priority ?? 'medium').trim();
  const dueAt = body?.dueAt ? String(body.dueAt) : null;
  const notes = body?.notes ? String(body.notes).trim() : null;
  if (!title || !priorities.has(priority)) return NextResponse.json({ error: 'invalid_task' }, { status: 400 });
  await ensureOperationsSchema();
  const sql = getSql();
  const created = (await sql`insert into public.owner_tasks (title, category, priority, due_at, notes)
    values (${title}, ${category}, ${priority}, ${dueAt}::timestamptz, ${notes})
    returning id, title, category, priority, status, due_at, notes, created_at`) as unknown as Array<Record<string, unknown>>;
  const task = created[0];
  await writeOwnerAudit({ action: 'owner_task.create', entityType: 'owner_task', entityId: String(task?.id ?? ''), metadata: { title, category, priority } });
  return NextResponse.json({ task }, { status: 201 });
}

export async function PATCH(request: Request) {
  if (!authorized(request)) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (!process.env.DATABASE_URL) return NextResponse.json({ error: 'database_not_ready' }, { status: 503 });
  const body = await request.json();
  const id = String(body?.id ?? '').trim();
  const status = String(body?.status ?? '').trim();
  if (!id || !statuses.has(status)) return NextResponse.json({ error: 'invalid_task_update' }, { status: 400 });
  await ensureOperationsSchema();
  const sql = getSql();
  const updated = (await sql`update public.owner_tasks set status = ${status}, updated_at = now()
    where id = ${id}::uuid returning id, title, category, priority, status, due_at, notes, updated_at`) as unknown as Array<Record<string, unknown>>;
  if (!updated.length) return NextResponse.json({ error: 'task_not_found' }, { status: 404 });
  await writeOwnerAudit({ action: 'owner_task.status_update', entityType: 'owner_task', entityId: id, metadata: { status } });
  return NextResponse.json({ task: updated[0] });
}
