import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();
    
    const META_TOKEN = process.env.META_ACCESS_TOKEN;
    const PHONE_ID = process.env.META_PHONE_ID;

    if (!META_TOKEN || !PHONE_ID) {
      return NextResponse.json({ error: 'Missing Meta credentials' }, { status: 500 });
    }

    const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${META_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: to,
        type: 'text',
        text: { preview_url: false, body: message }
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Meta Send Error:", data);
      return NextResponse.json({ error: data.error?.message || 'Failed to send' }, { status: response.status });
    }

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Send API Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}