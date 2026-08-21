import { getSql } from './db';

export async function ensureCommunicationsSchema(){
  const sql=getSql();
  await sql`create table if not exists public.communication_messages (
    id uuid primary key default gen_random_uuid(), provider_id text unique, direction text not null,
    department text not null, from_address text, to_addresses jsonb not null default '[]'::jsonb,
    subject text, status text not null default 'received', metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now(), updated_at timestamptz not null default now()
  )`;
  await sql`create index if not exists communication_messages_department_idx
    on public.communication_messages(department,created_at desc)`;
}
