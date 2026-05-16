import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../../lib/supabase'; // Adjust path to your Supabase client

export async function POST(req: Request) {
  try {
    // 1. Get the raw body as text for HMAC verification
    const rawBody = await req.text();
    const hmacHeader = req.headers.get('x-shopify-hmac-sha256');
    const shopDomain = req.headers.get('x-shopify-shop-domain');

    if (!hmacHeader) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 2. Verify the Webhook (Using your Shopify Webhook Secret from .env.local)
    const secret = process.env.SHOPIFY_WEBHOOK_SECRET; 
    
    if (!secret) {
      console.error("Missing SHOPIFY_WEBHOOK_SECRET");
      return new NextResponse('Server Configuration Error', { status: 500 });
    }

    const generatedHash = crypto
      .createHmac('sha256', secret)
      .update(rawBody, 'utf8')
      .digest('base64');

    if (generatedHash !== hmacHeader) {
      console.error("HMAC verification failed");
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // 3. Parse the verified payload
    const order = JSON.parse(rawBody);

    // Shopify phone numbers can be tricky. Fallback to billing/shipping address phone if needed.
    const phone = order.phone || order.billing_address?.phone || order.customer?.phone;

    if (!phone) {
      // If there's no phone number, we can't link it to a WhatsApp CRM easily
      return new NextResponse('Order received but no phone number attached', { status: 200 });
    }

    // 4. Insert into Supabase
    const { error } = await supabase
      .from('store_orders')
      .upsert({
        shopify_order_id: order.id.toString(),
        customer_phone: phone,
        customer_name: order.customer?.first_name + ' ' + order.customer?.last_name,
        total_price: order.total_price,
        financial_status: order.financial_status,
        fulfillment_status: order.fulfillment_status,
        line_items: order.line_items,
        store_name: shopDomain,
      }, { onConflict: 'shopify_order_id' });

    if (error) throw error;

    return new NextResponse('Webhook processed successfully', { status: 200 });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return new NextResponse(`Error: ${error.message}`, { status: 500 });
  }
}