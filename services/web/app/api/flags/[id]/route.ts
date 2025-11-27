import { getFeatureFlagById, updateFeatureFlagById, deleteFeatureFlagById } from '@/lib/apiHandlers/flags';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const f = await getFeatureFlagById(id);
  if (!f) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(f);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const body = await req.json();
    const { id } = await params;
    const updated = await updateFeatureFlagById(id, body);
    return NextResponse.json(updated);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteFeatureFlagById(id);
  return NextResponse.json({}, { status: 204 });
}
