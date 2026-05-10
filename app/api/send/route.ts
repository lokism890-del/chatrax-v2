import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { to, message } = await req.json();

    if (!to || !message) {
      return NextResponse.json({ error: 'Missing phone number or message' }, { status: 400 });
    }

    // Strip any "+" signs from the phone number (Meta requires pure numbers, e.g., 15551234567)
    const cleanPhone = to.replace('+', '');

    // Fire the message to Meta's Graph API
    const response = await fetch(`https://graph.facebook.com/v19.0/${process.env.META_PHONE_NUMBER_ID}/messages`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.META_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        messaging_product: 'whatsapp',
        recipient_type: 'individual',
        to: cleanPhone,
        type: 'text',
        text: { 
            preview_url: false, 
            body: message 
        }
      })
    });

    const data = await response.json();

    // Catch Meta API errors (e.g., expired token)
    if (!response.ok) {
        throw new Error(data.error?.message || 'Failed to send message via Meta');
    }

    return NextResponse.json({ success: true, data });

  } catch (error: any) {
    console.error("Transmission Error:", error.message);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}