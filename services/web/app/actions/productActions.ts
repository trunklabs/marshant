'use server';

import { createProduct, updateProductById, deleteProductById } from '@/lib/apiHandlers/products';
import { revalidatePath } from 'next/cache';

export async function createProductAction(formData: FormData) {
  const name = String(formData.get('name') ?? '').trim();
  const description = String(formData.get('description') ?? '').trim() || undefined;
  if (!name) throw new Error('name is required');
  const p = await createProduct({ name, description });
  revalidatePath('/products');
  revalidatePath(`/products/${p.id}`);
}

export async function updateProductAction(formData: FormData) {
  const id = String(formData.get('id') ?? '').trim();
  const name = formData.get('name');
  const description = formData.get('description');
  if (!id) throw new Error('id is required');
  await updateProductById(id, {
    name: typeof name === 'string' ? name : undefined,
    description: typeof description === 'string' ? description : undefined,
  });
  revalidatePath('/products');
  revalidatePath(`/products/${id}`);
}

export async function deleteProductAction(id: string) {
  await deleteProductById(id);
  revalidatePath('/products');
}
