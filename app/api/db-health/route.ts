import { NextResponse } from 'next/server';
import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

type HealthRow = { ok?: number; database?: string };

export async function GET() {
  try {
    const sql = getSql();
    const result = (await sql`select 1 as ok, current_database() as database`) as unknown as HealthRow[];
    const row = result[0];
    return NextResponse.json({
      status: 'connected',
      database: row?.database ?? 'unknown',
      check: row?.ok === 1,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'disconnected',
        error: error instanceof Error ? error.message : 'Database connection failed',
      },
      { status: 503 },
    );
  }
}
