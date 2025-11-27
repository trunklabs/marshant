import { getDb } from '../db';

const adapter = getDb();

export async function listEnvironments(query: { productId?: string }) {
  return adapter.listEnvironments(query.productId);
}

export async function createEnvironment(body: unknown) {
  const b = (body as Record<string, unknown>) ?? {};
  if (!b?.productId || !b?.name) throw new Error('productId and name are required');
  return adapter.createEnvironment({
    productId: String(b.productId),
    name: String(b.name),
    description: typeof b.description === 'undefined' ? undefined : String(b.description),
  });
}

export async function getEnvironmentById(id: string) {
  return adapter.getEnvironment(id);
}

export async function updateEnvironmentById(id: string, body: { name?: unknown; description?: unknown } | unknown) {
  const b = (body as { name?: unknown; description?: unknown }) ?? {};
  return adapter.updateEnvironment(id, {
    name: typeof b.name === 'undefined' ? undefined : String(b.name),
    description: typeof b.description === 'undefined' ? undefined : String(b.description),
  });
}

export async function deleteEnvironmentById(id: string) {
  return adapter.deleteEnvironment(id);
}
