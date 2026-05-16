import { NextResponse } from 'next/server';
import { supabase } from '../../../../lib/supabase';

export async function POST(req: Request) {
  // 1. THE LOUD DOORBELL
  console.log("🔔 [SHOPIFY WEBHOOK] KNOCK KNOCK! Request received from Shopify!");

  try {
    const order = await req.json();
    
    // 2. LOG THE RAW PAYLOAD
    console.log("📦 [SHOPIFY WEBHOOK] Raw order data:", JSON.stringify(order).substring(0, 200));
    
    const rawPhone = order.phone || order.customer?.phone || order.billing_address?.phone;
    
    if (!rawPhone) {
      console.log("⚠️ [SHOPIFY WEBHOOK] Ignored: Order has no phone number.");
      return NextResponse.json({ status: 'ignored - no phone' });
    }

    // ... rest of your existing code below this ...

    // Clean the phone number (remove spaces, dashes, etc.) to match WhatsApp format
    const cleanPhone = rawPhone.replace(/\D/g, ''); 
    const fullName = `${order.customer?.first_name || ''} ${order.customer?.last_name || ''}`.trim();
    const orderPreviewText = `📦 Order #${order.order_number} placed for ${order.total_price} ${order.currency}.`;

    // 1. Create or Update the Customer Card in the Dashboard
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert({ 
        phone_number: cleanPhone, 
        full_name: fullName || 'Shopify Customer',
        status: 'NEW_ORDER', // <-- This puts them directly into your new column!
        last_message: orderPreviewText,
        email: order.email || ''
      }, { onConflict: 'phone_number' })
      .select('id')
      .single();

    if (customerError) throw customerError;

    // 2. Add an internal system message so the agent sees the order details in the chat history
    await supabase
      .from('messages')
      .insert({
        customer_id: customer.id,
        content: `SYSTEM: ${orderPreviewText}`,
        is_outbound: false,
        is_internal: true, // Shows up as an internal memo so the customer doesn't see it
        status: 'received'
      });

    // 3. (Optional) Still save the raw order to your store_orders table if you want!

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error('Shopify Webhook Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}