import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Use the Service Role Key so the webhook can bypass RLS rules
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// This must match the token you type into the Meta Developer Dashboard
const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN || 'chatrax_secure_token_2026'; 

// 1. WEBHOOK VERIFICATION (Used by Meta to verify your URL)
export async function GET(req: Request) {
  const url = new URL(req.url);
  const mode = url.searchParams.get('hub.mode');
  const token = url.searchParams.get('hub.verify_token');
  const challenge = url.searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified successfully!');
    return new NextResponse(challenge, { status: 200 });
  }
  
  return new NextResponse('Forbidden', { status: 403 });
}

// 2. RECEIVE INCOMING MESSAGES
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Ensure this is a WhatsApp status/message event
    if (body.object !== 'whatsapp_business_account') {
      return new NextResponse('Not Found', { status: 404 });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    // Check if there is a message payload
    if (changes?.messages && changes.messages.length > 0) {
      const msg = changes.messages[0];
      const contact = changes.contacts?.[0];
      
      const phone = msg.from; // Customer's phone number
      const customerName = contact?.profile?.name || 'Unknown User';
      const text = msg.text?.body || '[Media/Interactive Message]';

      // 1. Find or Create Customer in Supabase
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', phone)
        .single();
      
      if (!customer) {
        // Create new customer lead
        const { data: newCustomer, error: insertError } = await supabase
          .from('customers')
          .insert({
            phone_number: phone,
            full_name: customerName,
            status: 'NEW_ORDER', // Default hot lead status
            last_message: text
          })
          .select('id')
          .single();
          
        // Explicit null check to satisfy TypeScript
        if (insertError || !newCustomer) throw insertError || new Error("Failed to create customer");
        
        customer = newCustomer;
      } else {
        // Update existing customer's last message and bring them back to active
        await supabase
          .from('customers')
          .update({ last_message: text, status: 'ACTIVE' })
          .eq('id', customer.id);
      }

      // 2. Insert Message into Database (This triggers your frontend UI instantly!)
      // Using customer!.id tells TypeScript we guarantee this variable is not null
      await supabase.from('messages').insert({
        customer_id: customer!.id, 
        content: text,
        is_outbound: false,
        is_internal: false,
        status: 'delivered'
      });
    }

    return new NextResponse('OK', { status: 200 });
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}