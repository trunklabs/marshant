import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const productId = url.searchParams.get('productId');
  const envId = url.searchParams.get('envId');
  const actorId = url.searchParams.get('actorId');

  if (!productId || !envId || !actorId) {
    return NextResponse.json({ error: 'Missing required query parameters' }, { status: 400 });
  }

  try {
    const flags = await listEnabledFlags({ productId, envId, actorId });
    return NextResponse.json(flags);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
function listEnabledFlags(arg0: { productId: string; envId: string; actorId: string }) {
  throw new Error('Function not implemented.');
}
