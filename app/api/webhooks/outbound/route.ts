import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { targetUrl, payload } = body;

    if (!targetUrl || !payload) {
      return NextResponse.json({ error: 'Missing target URL or payload' }, { status: 400 });
    }

    // The Next.js server makes the request, bypassing browser CORS rules completely
    const response = await fetch(targetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      console.error(`External API rejected the webhook with status ${response.status}`);
      return NextResponse.json({ error: `External API returned ${response.status}` }, { status: response.status });
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error('Outbound Webhook Proxy Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}