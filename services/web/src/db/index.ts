import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from './schema';

export const db = drizzle(process.env.DATABASE_URL!, { schema });

export type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

export * from './schema';
