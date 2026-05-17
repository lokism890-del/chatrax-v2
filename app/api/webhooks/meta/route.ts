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

    if (mode === "subscribe" && token === VERIFY_TOKEN) {
      console.log("🟢 Webhook Verified Successfully!");
      return new NextResponse(challenge, {
        status: 200,
        headers: { 'Content-Type': 'text/plain' },
      });
    }

    return new NextResponse("Forbidden", { status: 403 });
  } catch (err) {
    console.error("GET Error:", err);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// 2. RECEIVING LIVE CUSTOMER MESSAGES, RECEIPTS, & MEDIA
export async function POST(req: Request) {
  try {
    const body = await req.json();

    if (body.object !== 'whatsapp_business_account') {
      return NextResponse.json({ status: 'ignored' });
    }

    const entry = body.entry?.[0];
    const changes = entry?.changes?.[0]?.value;

    // ==========================================
    // UPGRADE B: READ & DELIVERED RECEIPTS
    // ==========================================
    if (changes?.statuses) {
      const statusObj = changes.statuses[0];
      const recipientPhone = statusObj.recipient_id;
      const deliveryStatus = statusObj.status; // 'sent', 'delivered', or 'read'

      if (deliveryStatus === 'delivered' || deliveryStatus === 'read') {
        // Find the customer associated with this phone number
        const { data: customer } = await supabase
          .from('customers')
          .select('id')
          .eq('phone_number', recipientPhone)
          .single();

        if (customer) {
          // Update all their unread outbound messages to the new status
          await supabase
            .from('messages')
            .update({ status: deliveryStatus })
            .eq('customer_id', customer.id)
            .eq('is_outbound', true)
            .neq('status', 'read'); // Don't downgrade a read message back to delivered
        }
      }
      return NextResponse.json({ status: 'receipt processed' }, { status: 200 });
    }

    // ==========================================
    // INCOMING MESSAGES (TEXT, INTERACTIVE, & MEDIA)
    // ==========================================
    if (changes?.messages) {
      const message = changes.messages[0];
      const contact = changes.contacts?.[0];
      
      const customerPhone = message.from; 
      const customerName = contact?.profile?.name || 'Unknown WhatsApp User';
      const msgType = message.type;

      let messageText = '';

      // 1. Text Parsing
      if (msgType === 'text') {
        messageText = message.text?.body || '';
      } 
      // 2. Interactive Button/List Parsing
      else if (msgType === 'interactive') {
        const interactiveType = message.interactive?.type;
        if (interactiveType === 'button_reply') {
          messageText = `👆 Selected: ${message.interactive.button_reply.title}`;
        } else if (interactiveType === 'list_reply') {
          messageText = `📋 Selected: ${message.interactive.list_reply.title}`;
        } else {
          messageText = `📎 [Interactive Received]`;
        }
      } 
      // 3. Media ID Parsing (Tagged for the frontend proxy)
      else if (msgType === 'image') {
        messageText = `MEDIA::image::${message.image.id}`;
      } else if (msgType === 'audio') {
        messageText = `MEDIA::audio::${message.audio.id}`;
      } else if (msgType === 'video') {
        messageText = `MEDIA::video::${message.video.id}`;
      } else if (msgType === 'document') {
        messageText = `📄 [Document Received]`;
      } else {
        messageText = `📎 [${msgType.toUpperCase()} Received]`;
      }

      if (!messageText) return NextResponse.json({ status: 'empty message' });

      // Core Routing: Find or Create Customer
      let isNewCustomer = false;
      let { data: existingCustomer } = await supabase
        .from('customers')
        .select('*')
        .eq('phone_number', customerPhone)
        .single();

      if (!existingCustomer) {
        isNewCustomer = true;
        const { data: newCustomer, error: createError } = await supabase
          .from('customers')
          .insert({
            phone_number: customerPhone,
            full_name: customerName,
            status: 'NEW_ORDER', // Route fresh leads to New Order
            last_message: messageText.includes("MEDIA::") ? "[Media Attachment]" : messageText
          })
          .select()
          .single();
          
        if (createError) throw createError;
        existingCustomer = newCustomer;
      } else {
        await supabase
          .from('customers')
          .update({ 
            last_message: messageText.includes("MEDIA::") ? "[Media Attachment]" : messageText,
            status: existingCustomer.status === 'RESOLVED' ? 'ACTIVE' : existingCustomer.status 
          })
          .eq('id', existingCustomer.id);
      }

      // Save the inbound message bubble to Supabase
      await supabase.from('messages').insert({
        customer_id: existingCustomer.id,
        content: messageText,
        is_outbound: false,
        is_internal: false,
        status: 'delivered'
      });

      // ==========================================
      // UPGRADE C: THE AUTO-RESPONDER
      // ==========================================
      if (isNewCustomer) {
        const META_TOKEN = process.env.META_ACCESS_TOKEN;
        const PHONE_ID = process.env.META_PHONE_ID;
        const autoReply = `Hi ${customerName}! 👋 Welcome to Support. We have received your message and an agent will be with you shortly.`;

        if (META_TOKEN && PHONE_ID) {
          // Fire the Meta API to send the text
          const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${META_TOKEN}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              messaging_product: 'whatsapp',
              recipient_type: 'individual',
              to: customerPhone,
              type: 'text',
              text: { preview_url: false, body: autoReply }
            }),
          });

          // Save the automated reply to the ChatRax UI
          if (response.ok) {
            await supabase.from('messages').insert({
              customer_id: existingCustomer.id,
              content: autoReply,
              is_outbound: true,
              is_internal: false,
              status: 'sent'
            });
          }
        }
      }
    }

    return NextResponse.json({ status: 'success' }, { status: 200 });
  } catch (error) {
    console.error('Meta Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}