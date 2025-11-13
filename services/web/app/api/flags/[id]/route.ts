import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

const adapter = getDb();

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const f = await adapter.getFeatureFlag(params.id);
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(f);
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const body = await req.json();
    const updated = await adapter.updateFeatureFlag(params.id, {
      description: body.description,
      gates: body.gates,
      label: body.label,
      enabled: typeof body.enabled === 'undefined' ? undefined : Boolean(body.enabled),
    });
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  await adapter.deleteFeatureFlag(params.id);
  return NextResponse.json({}, { status: 204 });
}
