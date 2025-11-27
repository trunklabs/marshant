import { getDb } from '../db';
import { Gate } from '../db/types';

const adapter = getDb();

export async function listFeatureFlags(query: { productId?: string; envId?: string }) {
  return adapter.listFeatureFlags(query.productId, query.envId);
}

export async function createFeatureFlag(body: unknown) {
  const b = (body as Record<string, unknown>) ?? {};
  const { productId, envId, label, enabled, description, gates } = b;

  if (!productId || !envId || !label || typeof enabled === 'undefined')
    throw new Error('productId, envId, label and enabled are required');
  if (typeof enabled !== 'boolean') throw new Error('enabled must be boolean');

  return adapter.createFeatureFlag({
    productId: String(productId),
    envId: String(envId),
    label: String(label),
    enabled: Boolean(enabled),
    description: typeof description === 'undefined' ? undefined : String(description),
    gates: Array.isArray(gates) ? (gates as unknown as Gate[]) : [],
  });
}

export async function getFeatureFlagById(id: string) {
  return adapter.getFeatureFlag(id);
}

export async function updateFeatureFlagById(id: string, body: unknown) {
  const b = (body as Record<string, unknown>) ?? {};
  return adapter.updateFeatureFlag(id, {
    description: typeof b.description === 'undefined' ? undefined : String(b.description),
    gates: typeof b.gates === 'undefined' ? undefined : (b.gates as unknown as Gate[]),
    label: typeof b.label === 'undefined' ? undefined : String(b.label),
    enabled: typeof b.enabled === 'undefined' ? undefined : Boolean(b.enabled),
  });
}

export async function deleteFeatureFlagById(id: string) {
  return adapter.deleteFeatureFlag(id);
}

export async function listEnabledFlags(query: { productId: string; envId: string; actorId: string }) {
  return adapter.getEnabledFlagsForActor(query.productId, query.envId, query.actorId);
}
