import { listEnvironments, createEnvironment } from '@/lib/apiHandlers/environments';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId') ?? undefined;
  const envs = await listEnvironments({ productId });
  return NextResponse.json(envs);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const e = await createEnvironment(body);
    return NextResponse.json(e, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: msg }, { status: 400 });
  }
}
