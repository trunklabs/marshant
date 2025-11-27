import { getDb } from '../db';

const adapter = getDb();
export async function listProducts() {
  return adapter.listProducts();
}

export async function createProduct(data: { name?: unknown; description?: unknown } | unknown) {
  const d = (data as { name?: unknown; description?: unknown }) ?? {};
  if (!d?.name) throw new Error('name is required');
  return adapter.createProduct({
    name: String(d.name),
    description: typeof d.description === 'undefined' ? undefined : String(d.description),
  });
}

export async function getProductById(id: string) {
  return adapter.getProduct(id);
}

export async function updateProductById(id: string, body: { name?: unknown; description?: unknown } | unknown) {
  const b = (body as { name?: unknown; description?: unknown }) ?? {};
  return adapter.updateProduct(id, {
    name: typeof b.name === 'undefined' ? undefined : String(b.name),
    description: typeof b.description === 'undefined' ? undefined : String(b.description),
  });
}

export async function deleteProductById(id: string) {
  return adapter.deleteProduct(id);
}
