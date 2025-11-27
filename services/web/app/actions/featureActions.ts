'use server';

import { listEnvironments, createEnvironment } from '@/lib/apiHandlers/environments';
import {
  createFeatureFlag,
  getFeatureFlagById,
  deleteFeatureFlagById,
  updateFeatureFlagById,
  listFeatureFlags,
} from '@/lib/apiHandlers/flags';
import { listProducts, createProduct } from '@/lib/apiHandlers/products';
import { revalidatePath } from 'next/cache';

async function ensureDefaultProductAndEnv() {
  const products = await listProducts();
  let product = products[0];
  if (!product) {
    product = await createProduct({ name: 'Default Product', description: 'Auto-created' });
  }
  const envs = await listEnvironments({ productId: product.id });
  let env = envs[0];
  if (!env) {
    env = await createEnvironment({ productId: product.id, name: 'Prod', description: 'Default environment' });
  }
  return { productId: product.id, envId: env.id };
}

export async function createFeature(formData: FormData) {
  const label = String(formData.get('label') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || undefined;
  const enabled = (formData.get('enabled') ?? 'off') === 'on';

  // Parse gates from JSON if provided
  const gatesJson = formData.get('gates');
  let gates = [];
  if (gatesJson && typeof gatesJson === 'string') {
    try {
      gates = JSON.parse(gatesJson);
    } catch {
      // If parsing fails, use default gate
      gates = [{ type: 'all', enabled }];
    }
  } else {
    // Default gate if no gates provided
    gates = [{ type: 'all', enabled }];
  }

  // Allow contextual creation within a specific product/environment if provided by the form
  let productId = String(formData.get('productId') ?? '') || undefined;
  let envId = String(formData.get('envId') ?? '') || undefined;

  if (!productId || !envId) {
    const defaults = await ensureDefaultProductAndEnv();
    productId = defaults.productId;
    envId = defaults.envId;
  }

  await createFeatureFlag({ productId, envId, label, description, enabled, gates });
  revalidatePath('/');
  revalidatePath('/features');
  if (productId && envId) {
    revalidatePath(`/products/${productId}`);
    revalidatePath(`/products/${productId}/environments/${envId}`);
  }
}

export async function deleteFeature(id: string) {
  const f = await getFeatureFlagById(id).catch(() => null);
  await deleteFeatureFlagById(id);
  revalidatePath('/');
  revalidatePath('/features');
  if (f) {
    revalidatePath(`/products/${f.productId}`);
    revalidatePath(`/products/${f.productId}/environments/${f.envId}`);
  }
}

export async function updateFeature(formData: FormData) {
  const id = String(formData.get('id'));
  const label = formData.get('label');
  const description = formData.get('description');
  const enabled = formData.get('enabled');

  // Parse gates from JSON if provided
  const gatesJson = formData.get('gates');
  let gates = undefined;
  if (gatesJson && typeof gatesJson === 'string') {
    try {
      gates = JSON.parse(gatesJson);
    } catch {
      // If parsing fails, leave gates undefined (no update)
      gates = undefined;
    }
  }

  await updateFeatureFlagById(id, {
    label: typeof label === 'string' ? label : undefined,
    description: typeof description === 'string' ? description : undefined,
    enabled: typeof enabled !== 'undefined' ? enabled === 'on' : undefined,
    gates,
  });
  revalidatePath(`/features/${id}`);
  revalidatePath('/');
  revalidatePath('/features');
  const f = await getFeatureFlagById(id).catch(() => null);
  if (f) {
    revalidatePath(`/products/${f.productId}`);
    revalidatePath(`/products/${f.productId}/environments/${f.envId}`);
  }
}

export async function getAllFeatures() {
  return listFeatureFlags({});
}
