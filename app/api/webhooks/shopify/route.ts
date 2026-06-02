import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Initialize Supabase with Service Role Key to bypass RLS during webhooks
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(req: Request) {
  try {
    // Shopify sends the event type in the headers
    const topic = req.headers.get('x-shopify-topic');
    const shopDomain = req.headers.get('x-shopify-shop-domain');
    
    const body = await req.json();

    // ─── NEW ORDER AUTOMATION ───
    if (topic === 'orders/create') {
      // Extract phone number from shipping address or customer profile
      const rawPhone = body.shipping_address?.phone || body.customer?.phone;
      const firstName = body.customer?.first_name || body.shipping_address?.first_name || 'Customer';
      const orderNumber = body.order_number;
      const totalPrice = body.total_price;
      const currency = body.currency;

      if (!rawPhone) {
         return new NextResponse('Skipped: No phone number provided in order', { status: 200 });
      }

      // Clean the phone number (remove +, dashes, spaces)
      const cleanPhone = rawPhone.replace(/\D/g, '');

      // 1. Find or create the customer in Supabase
      let { data: customer } = await supabase
        .from('customers')
        .select('id')
        .eq('phone_number', cleanPhone)
        .single();
      
      const botMessage = `Hi ${firstName}! 🎉 Thank you for your order #${orderNumber} totaling ${currency} ${totalPrice}. We are preparing it for shipment and will notify you once it's on the way!`;

      if (!customer) {
        // Create new customer lead
        const { data: newCustomer, error } = await supabase.from('customers').insert({
          phone_number: cleanPhone,
          full_name: `${body.customer?.first_name || ''} ${body.customer?.last_name || ''}`.trim(),
          status: 'NEW_ORDER',
          last_message: botMessage
        }).select('id').single();
        
        if (error || !newCustomer) throw new Error("Failed to create customer from Shopify data");
        customer = newCustomer;
      } else {
        // Update existing customer with the latest order name and message
        const latestName = `${body.customer?.first_name || ''} ${body.customer?.last_name || ''}`.trim();
        
        await supabase.from('customers').update({ 
          full_name: latestName !== '' ? latestName : undefined, // Overwrites name if provided
          last_message: botMessage, 
          status: 'ACTIVE' 
        }).eq('id', customer.id);
     }

      // 2. Log the automated message to Supabase (Triggers UI update instantly)
      await supabase.from('messages').insert({
        customer_id: customer!.id,
        content: `🤖 [Automated]: ${botMessage}`,
        is_outbound: true,
        is_internal: false,
        status: 'sent'
      });

      // 3. Trigger the Meta API in the background with a 2-minute delay
      const protocol = req.headers.get('x-forwarded-proto') || 'http';
      const host = req.headers.get('host');
      const apiUrl = `${protocol}://${host}/api/send`;

      // 120000 milliseconds = exactly 2 minutes
      setTimeout(async () => {
        try {
          await fetch(apiUrl, { 
            method: 'POST', 
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
              to: cleanPhone, 
              message: botMessage 
            }) 
          });
          console.log(`Delayed welcome message sent to ${cleanPhone}`);
        } catch (err) {
          console.error("Delayed message failed:", err);
        }
      }, 120000); 

      // Instantly return 200 OK so Shopify knows the webhook was received successfully
      return new NextResponse('Order Processed & Logged in CRM', { status: 200 });
    }

    // Acknowledge other webhook topics if you add them later
    return new NextResponse('Webhook Received', { status: 200 });
    
  } catch (error) {
    console.error('Shopify Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}