// Disable Next.js caching completely so webhooks run every time
export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import twilio from 'twilio';

// Initialize Clients
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

// Groq AI Fallback Function
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

    // 1. Get Workspace safely
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).maybeSingle();
    const workspaceId = workspace ? workspace.id : null; 

    // 2. Fetch Customer & calculate timeout
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .maybeSingle();

    let minutesSinceLastActivity = 0;
    if (customer) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (lastMsg) {
        const lastTime = new Date(lastMsg.created_at).getTime();
        minutesSinceLastActivity = (new Date().getTime() - lastTime) / 60000;
      }
    }

    let currentStatus = customer?.status || 'NEW';

    // 3. Smart Session Timeout (5 MIN TEST)
    if (minutesSinceLastActivity > 5 && currentStatus !== 'NEW') {
      currentStatus = 'NEW';
    }

    // 4. Sync Customer state (Insert or Update)
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
      await supabase.from('customers')
        .update({ last_message: body, status: currentStatus })
        .eq('id', customer.id);
    }

    // =================================================================
    // 5. CRITICAL FIX: Save incoming message with status: 'received'
    // =================================================================
    const { error: messageInsertError } = await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false,
      status: 'received' // <--- This fixes the silent database failure!
    });

    if (messageInsertError) {
      await twilioClient.messages.create({ 
        from: TWILIO_FROM, 
        to: rawFrom, 
        body: `⚠️ DB ERROR (Message Save): ${messageInsertError.message}` 
      });
      return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
    }

    const bodyLower = body.toLowerCase();

    // 6. Intent-Based Handoff
    const agentKeywords = ['agent', 'human', 'representative', 'operator', 'talk to someone', 'real person'];
    const wantsAgent = agentKeywords.some(word => bodyLower.includes(word));

    if (wantsAgent && currentStatus !== 'PENDING_AGENT') {
      const handoffScript = "Assigning you to a human agent. Please hold on, someone will join the chat shortly. 👨‍💻";
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: handoffScript });
      
      await supabase.from('customers').update({ last_message: `System: Agent requested`, status: 'PENDING_AGENT' }).eq('id', customer.id);
      await supabase.from('messages').insert({ customer_id: customer.id, content: handoffScript, is_outbound: true, status: 'sent' });
      
      return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
    }

    // 7. Bot Mute Lockout
    if (currentStatus === 'PENDING_AGENT' || currentStatus === 'HANDOFF') {
      return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });
    }

    // =================================================================
    // 8. CRITICAL FIX: Upgraded AI Logic (Math + Error Texting)
    // =================================================================
    let aiResponse = "SKIP";
    // Added 'products' to keywords so it catches phrases like "2 products"
    const keywords = ['price', 'how much', 'cost', 'pkr', 'delivery', 'time', 'days', 'return', 'exchange', 'discount', 'products'];
    
    if (keywords.some(word => bodyLower.includes(word))) {
      const prompt = `
        You are a helpful e-commerce assistant.
        - 1 product = 2500 PKR.
        - If they ask for multiple products, do the math (e.g., 2 products = 5000 PKR).
        - Delivery: 3-5 days. Returns: 7 days.
        
        Customer says: "${body}"
        
        Reply with a friendly 1-sentence answer. If you cannot answer it based on the rules, reply with exactly the word "SKIP".
      `;
      try { 
        aiResponse = await generateWithGroq(prompt); 
      } catch (e: any) {
        // Texts you if the Groq AI key is invalid or down
        await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: `🤖 AI ERROR: ${e.message}` });
      }
    }

    // 9. Send AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: aiResponse });
      await supabase.from('customers').update({ last_message: `AI: ${aiResponse}` }).eq('id', customer.id);
      
      // Save AI reply with status: 'sent'
      await supabase.from('messages').insert({ 
        customer_id: customer.id, 
        content: aiResponse, 
        is_outbound: true, 
        status: 'sent' 
      });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: noCacheHeaders });

  } catch (error: any) {
    console.error('❌ Critical Webhook Error:', error);
    try {
      const text = await request.text();
      const rawFrom = new URLSearchParams(text).get('From') || '';
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: `🚨 FATAL CODE CRASH: ${error.message}` });
    } catch(e) {}
    
    return new NextResponse('Error', { status: 500, headers: noCacheHeaders });
  }
}