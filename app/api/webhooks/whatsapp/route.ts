import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase'; // Adjust this path if needed

// 1. META VERIFICATION (Runs once when you connect the app)
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const mode = searchParams.get('hub.mode');
    const token = searchParams.get('hub.verify_token');
    const challenge = searchParams.get('hub.challenge');
  
    const verifyToken = process.env.META_WEBHOOK_VERIFY_TOKEN;
  
    if (mode === 'subscribe' && token === verifyToken) {
      console.log('Meta Webhook Verified! Challenge sent:', challenge);
      
      // Explicitly tell Meta this is raw text, not HTML or JSON
      return new NextResponse(challenge, { 
        status: 200,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    } else {
      console.error('Meta Verification Failed. Tokens did not match.');
      return new NextResponse('Forbidden', { status: 403 });
    }
  }
// 2. RECEIVING MESSAGES (Runs every time someone texts you)
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          const value = change.value;
          
          // Check if this payload contains a new message
          if (value.messages && value.messages.length > 0) {
            const message = value.messages[0];
            const contact = value.contacts[0];

            const phone = message.from; // The customer's phone number
            const text = message.text?.body || 'Sent an attachment/unsupported message type';
            const name = contact.profile.name || 'Unknown User';

            // 1. Check if this customer already exists in Supabase
            let { data: customer } = await supabase
              .from('customers')
              .select('id')
              .eq('phone_number', phone)
              .single();

            if (!customer) {
              // Create a brand new lead card in the "NEW" column
              const { data: newCustomer, error } = await supabase
                .from('customers')
                .insert({ 
                  phone_number: phone, 
                  full_name: name, 
                  status: 'NEW', 
                  last_message: text 
                })
                .select('id')
                .single();
                
              if (error) console.error("Error creating customer:", error);
              customer = newCustomer;
            } else {
              // Existing customer: Update their last message and move them to the "NEW" column so you see it
              await supabase
                .from('customers')
                .update({ last_message: text, status: 'NEW' })
                .eq('id', customer.id);
            }

            // 2. Save the actual message to the chat history
            if (customer) {
              await supabase
                .from('messages')
                .insert({
                  customer_id: customer.id,
                  content: text,
                  is_outbound: false,
                  is_internal: false,
                  status: 'received'
                });
            }
          }
        }
      }
      return new NextResponse('EVENT_RECEIVED', { status: 200 });
    } else {
      return new NextResponse('Not Found', { status: 404 });
    }
  } catch (error) {
    console.error('WhatsApp Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}