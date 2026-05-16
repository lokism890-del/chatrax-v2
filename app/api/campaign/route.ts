import { NextResponse } from 'next/server';
import { supabase } from '../../../lib/supabase'; // Adjust this path if your lib folder is somewhere else!

export async function POST(req: Request) {
  try {
    const { campaignName, audience, templateId } = await req.json();

    const META_TOKEN = process.env.META_ACCESS_TOKEN;
    const PHONE_ID = process.env.META_PHONE_ID;

    if (!META_TOKEN || !PHONE_ID) {
      return NextResponse.json({ error: 'Missing Meta credentials' }, { status: 500 });
    }

    const { data: template, error: tmplError } = await supabase
      .from('quick_replies')
      .select('*')
      .eq('id', templateId)
      .single();

    if (tmplError || !template) {
      return NextResponse.json({ error: 'Template not found' }, { status: 404 });
    }

    let query = supabase.from('customers').select('*');
    if (audience !== 'ALL') {
      query = query.eq('status', audience);
    }
    const { data: customers, error: custError } = await query;

    if (custError || !customers || customers.length === 0) {
      return NextResponse.json({ error: 'No customers found for this audience' }, { status: 404 });
    }

    let successCount = 0;
    let failCount = 0;

    for (const customer of customers) {
      try {
        const response = await fetch(`https://graph.facebook.com/v18.0/${PHONE_ID}/messages`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${META_TOKEN}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            recipient_type: 'individual',
            to: customer.phone_number,
            type: 'text',
            text: { preview_url: false, body: template.content }
          }),
        });

        if (response.ok) {
          successCount++;
          await supabase.from('messages').insert({
            customer_id: customer.id,
            content: `[CAMPAIGN: ${campaignName}] \n\n${template.content}`,
            is_outbound: true,
            is_internal: false,
            status: 'sent'
          });
        } else {
          failCount++;
        }
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (err) {
        failCount++;
      }
    }

    return NextResponse.json({ success: true, broadcasted: successCount, failed: failCount });
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}