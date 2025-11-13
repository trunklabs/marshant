import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') ?? undefined;
  const envId = url.searchParams.get('envId') ?? undefined;
  const flags = await adapter.listFeatureFlags(productId, envId);
  return NextResponse.json(flags);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { productId, envId, id, label, enabled, description, gates } = body;
    if (!productId || !envId || !label || typeof enabled === 'undefined')
      return NextResponse.json({ error: 'productId, envId, label and enabled are required' }, { status: 400 });
    if (typeof enabled !== 'boolean') return NextResponse.json({ error: 'enabled must be boolean' }, { status: 400 });

    const f = await adapter.createFeatureFlag({
      id: typeof id === 'undefined' ? undefined : String(id),
      productId: String(productId),
      envId: String(envId),
      label: String(label),
      enabled: Boolean(enabled),
      description,
      gates: gates ?? [],
    });
    return NextResponse.json(f, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
