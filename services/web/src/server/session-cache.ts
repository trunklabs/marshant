'use server';

import { revalidatePath } from 'next/cache';

/**
 * Invalidates the server-side cache for all app routes.
 * Used when the active organization changes to ensure
 * server components refetch with the new session context.
 */
export async function invalidateSessionCache() {
  revalidatePath('/app', 'layout');
}
