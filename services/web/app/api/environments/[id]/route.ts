import { getEnvironmentById, updateEnvironmentById, deleteEnvironmentById } from '@/lib/apiHandlers/environments';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const e = await getEnvironmentById(id);
  if (!e) return NextResponse.json({ error: 'not found' }, { status: 404 });
  return NextResponse.json(e);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const body = await req.json();
  const { id } = await params;
  const updated = await updateEnvironmentById(id, { name: body.name, description: body.description });
  return NextResponse.json(updated);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  await deleteEnvironmentById(id);
  return NextResponse.json({}, { status: 204 });
}
