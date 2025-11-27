import { listProducts, createProduct } from '@/lib/apiHandlers/products';
import { NextResponse } from 'next/server';

export async function GET() {
  const products = await listProducts();
  return NextResponse.json(products);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const p = await createProduct(body);
    return NextResponse.json(p, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
