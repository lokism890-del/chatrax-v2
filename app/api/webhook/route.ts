export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER?.startsWith('whatsapp:') 
  ? process.env.TWILIO_PHONE_NUMBER 
  : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

const noCacheHeaders = {
  'Content-Type': 'text/xml',
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  'Pragma': 'no-cache',
  'Expires': '0',
};

async function generateWithGroq(prompt: string): Promise<string> {
  const modelCandidates = ["llama-3.1-8b-instant", "llama-3.3-70b-versatile"];
  let lastError: any;
  for (const modelName of modelCandidates) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: 0.2, 
        max_tokens: 150,
      });
      return completion.choices[0]?.message?.content?.trim() || "SKIP";
    } catch (error: any) {
      lastError = error;
    }
  }
  throw lastError || new Error("All Groq models failed.");
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const body = params.get('Body') || '';
    const rawFrom = params.get('From') || ''; 
    const phoneNumber = rawFrom.replace('whatsapp:', '');

    // 1. Get Workspace
    const { data: workspace, error: wsError } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
    const workspaceId = workspace ? workspace.id : null; 

    // 2. Fetch Customer
    let { data: customer, error: fetchCustError } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();
      
    if (fetchCustError) console.error("Customer Fetch Error:", fetchCustError);

    let currentStatus = customer?.status || 'NEW';

    // 3. Sync Customer state
    if (!customer) {
      const { data: newCust, error: insertError } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: currentStatus,
        last_message: body,
        workspace_id: workspaceId,
      }).select().single();
      
      if (insertError) {
        await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: `⚠️ DB ERROR (Customer Insert): ${insertError.message}` });
        return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
      }
      customer = newCust;
    } else {
      const { error: updateError } = await supabase.from('customers')
        .update({ last_message: body, status: currentStatus })
        .eq('id', customer.id);
        
      if (updateError) {
        await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: `⚠️ DB ERROR (Customer Update): ${updateError.message}` });
        return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
      }
    }

    // 4. THE CULPRIT: Save incoming message to Messages table with aggressive error checking
    const { error: messageInsertError } = await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });

    // IF THIS FAILS, IT WILL TEXT YOU THE ERROR
    if (messageInsertError) {
      await twilioClient.messages.create({ 
        from: TWILIO_FROM, 
        to: rawFrom, 
        body: `⚠️ DB ERROR (Message Save): ${messageInsertError.message}` 
      });
      return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
    }

    // 5. AI Logic
    let aiResponse = "SKIP";
    const bodyLower = body.toLowerCase();
    const keywords = ['price', 'how much', 'cost', 'pkr', 'delivery', 'time', 'days', 'return', 'exchange', 'discount'];
    
    if (keywords.some(word => bodyLower.includes(word))) {
      const prompt = `Pricing: 2500 PKR. Delivery: 3-5 days. Returns: 7 days. Customer says: "${body}" Reply with 1 sentence or SKIP.`;
      try { aiResponse = await generateWithGroq(prompt); } catch (e) { }
    }

    // 6. Send AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: aiResponse });
      await supabase.from('customers').update({ last_message: `AI: ${aiResponse}` }).eq('id', customer.id);
      await supabase.from('messages').insert({ customer_id: customer.id, content: aiResponse, is_outbound: true });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });

  } catch (error: any) {
    console.error('❌ Critical Webhook Error:', error);
    // Even critical code crashes will now text you
    try {
      const text = await request.text();
      const params = new URLSearchParams(text);
      const rawFrom = params.get('From') || '';
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: `🚨 FATAL CODE CRASH: ${error.message}` });
    } catch(e) {}
    
    return new NextResponse('Error', { status: 500, headers: noCacheHeaders });
  }
}