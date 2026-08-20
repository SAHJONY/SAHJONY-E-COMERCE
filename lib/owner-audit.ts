import { getSql } from './db';

export async function ensureOwnerAuditSchema() {
  const sql = getSql();
  await sql`create table if not exists public.owner_audit_log (
    id uuid primary key default gen_random_uuid(),
    action text not null,
    entity_type text not null,
    entity_id text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
  )`;
  await sql`create index if not exists owner_audit_log_created_idx
    on public.owner_audit_log(created_at desc)`;
  await sql`create index if not exists owner_audit_log_entity_idx
    on public.owner_audit_log(entity_type, entity_id, created_at desc)`;
}

export async function writeOwnerAudit(input: {
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
}) {
  await ensureOwnerAuditSchema();
  const sql = getSql();
  await sql`
    insert into public.owner_audit_log (action, entity_type, entity_id, metadata)
    values (
      ${input.action},
      ${input.entityType},
      ${input.entityId ?? null},
      ${JSON.stringify(input.metadata ?? {})}::jsonb
    )
  `;
}
