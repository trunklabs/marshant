import { db } from '@/db';
import { sql } from 'drizzle-orm';

export async function GET() {
  try {
    await db.execute(sql`SELECT 1`);
    return Response.json({ status: 'ok' });
  } catch {
    return Response.json({ status: 'error', message: 'Database connection failed' }, { status: 503 });
  }
}
