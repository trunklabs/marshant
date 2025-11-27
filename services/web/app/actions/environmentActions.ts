'use server';

import {
  createEnvironment,
  getEnvironmentById,
  updateEnvironmentById,
  deleteEnvironmentById,
} from '@/lib/apiHandlers/environments';
import { revalidatePath } from 'next/cache';

export async function createEnvironmentAction(formData: FormData) {
  const productId = String(formData.get('productId') ?? '').trim();
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || undefined;
  if (!productId) throw new Error('productId is required');
  if (!name) throw new Error('name is required');
  const env = await createEnvironment({ productId, name, description });
  revalidatePath(`/products/${productId}`);
  revalidatePath(`/products/${productId}/environments/${env.id}`);
}

export async function updateEnvironmentAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const name = formData.get('name');
  const description = formData.get('description');
  if (!id) throw new Error('id is required');

  const env = await getEnvironmentById(id);
  if (!env) throw new Error('environment not found');

  await updateEnvironmentById(id, {
    name: typeof name === 'string' ? name : undefined,
    description: typeof description === 'string' ? description : undefined,
  });
  revalidatePath(`/products/${env.productId}`);
  revalidatePath(`/products/${env.productId}/environments/${id}`);
}

export async function deleteEnvironmentAction(id: string) {
  const env = await getEnvironmentById(id);
  if (!env) return;
  await deleteEnvironmentById(id);
  revalidatePath(`/products/${env.productId}`);
}
