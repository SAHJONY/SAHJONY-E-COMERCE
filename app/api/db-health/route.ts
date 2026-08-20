import { NextResponse } from 'next/server';
import { getSql } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const sql = getSql();
    const result = await sql`select 1 as ok, current_database() as database`;
    return NextResponse.json({
      status: 'connected',
      database: result[0]?.database ?? 'unknown',
      check: result[0]?.ok === 1,
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
