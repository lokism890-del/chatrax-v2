import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

// 1. META SECURITY VERIFICATION (Handshaking)
export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get("hub.mode");
    const token = searchParams.get("hub.verify_token");
    const challenge = searchParams.get("hub.challenge");

    const VERIFY_TOKEN = process.env.META_VERIFY_TOKEN;

    console.log("🔍 [META WEBHOOK GET] Received validation request.");
    console.log("Mode:", mode, "Token Provided:", token);

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("🟢 Webhook Verified Successfully!");
      // Meta requires the raw challenge string back directly without any JSON quotes
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    console.error("❌ Token mismatch or missing subscribe mode.");
    return new NextResponse("Forbidden", { status: 403 });
  } catch (err) {
    console.error("GET Error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// 2. RECEIVING LIVE CUSTOMER MESSAGES
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    if (changes?.messages) {
      const message = changes.messages[0];
      const contact = changes.contacts?.[0];
      
      const customerPhone = message.from; 
      const customerName = contact?.profile?.name || 'Unknown WhatsApp User';
      const messageText = message.text?.body;

      if (!messageText) return NextResponse.json({ status: 'not a text message' });

      let { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', customerPhone)
        .single();

      if (!existingCustomer) {
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            phone_number: customerPhone,
            full_name: customerName,
            status: 'ACTIVE',
            last_message: messageText
          })
          .select()
          .single();
          
        if (createError) throw createError;
        existingCustomer = newCustomer;
      } else {
        await supabase
          .from('customers')
          .update({ 
            last_message: messageText,
            status: existingCustomer.status === 'RESOLVED' ? 'ACTIVE' : existingCustomer.status 
          })
          .eq('id', existingCustomer.id);
      }

      await supabase.from('messages').insert({
        customer_id: existingCustomer.id,
        content: messageText,
        is_outbound: false,
        is_internal: false,
        status: 'delivered'
      });
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Meta Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}