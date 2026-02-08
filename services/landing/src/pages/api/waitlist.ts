import type { APIRoute } from 'astro';

export const POST: APIRoute = async ({ request }) => {
  const body = await request.json().catch(() => null);

  if (!body?.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return new Response(JSON.stringify({ error: 'Please enter a valid email address.' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const apiKey = import.meta.env.RESEND_API_KEY;

  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Waitlist is not configured yet. Please try again later.' }), {
      status: 503,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const res = await fetch('https://api.resend.com/contacts', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: body.email,
      ...(import.meta.env.RESEND_SEGMENT_ID && {
        segments: [{ id: import.meta.env.RESEND_SEGMENT_ID }],
      }),
    }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const message = (data as { message?: string }).message || 'Failed to join waitlist. Please try again.';
    return new Response(JSON.stringify({ error: message }), {
      status: res.status,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
};
