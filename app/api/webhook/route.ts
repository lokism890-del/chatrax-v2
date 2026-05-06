import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// We use the Service Role Key here because this is a secure backend route
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);
export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    
    const rawFrom = params.get('From') || ''; 
    const body = params.get('Body') || '';

    const phoneNumber = rawFrom.replace('whatsapp:', '');

    if (!phoneNumber) {
       return new NextResponse('Missing From number', { status: 400 });
    }

    // --- NEW: Fetch the default workspace ID ---
    const { data: workspace } = await supabase
      .from('workspaces')
      .select('id')
      .limit(1)
      .single();

    // 1. Check if this customer already exists
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    let customerId;

    if (customer) {
      // 2a. Update existing customer
      customerId = customer.id;
      await supabase
        .from('customers')
        .update({ 
          last_message: body, 
          status: 'NEW', 
          updated_at: new Date().toISOString()
        })
        .eq('id', customerId);
    } else {
      // 2b. Create a new customer card WITH the workspace_id
      const { data: newCustomer, error: createError } = await supabase
        .from('customers')
        .insert({
          phone_number: phoneNumber,
          status: 'NEW',
          last_message: body,
          is_important: false,
          workspace_id: workspace?.id // <-- THE FIX IS HERE
        })
        .select()
        .single();
        
      if (createError) throw createError;
      customerId = newCustomer.id;
    }

    // 3. Insert the actual chat message
    await supabase.from('messages').insert({
      customer_id: customerId,
      content: body,
      is_outbound: false,
      status: 'received'
    });

    return new NextResponse('<?xml version="1.0" encoding="UTF-8"?><Response></Response>', {
      status: 200,
      headers: { 'Content-Type': 'text/xml' },
    });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}