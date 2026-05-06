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
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).single();
    if (!workspace) throw new Error("No workspace found");

    // 2. FETCH CUSTOMER & LAST MESSAGE (FROM ANYONE)
    let { data: customer } = await supabase.from('customers').select('*').eq('phone_number', phoneNumber).single();
    
    let minutesSinceLastActivity = 0;
    if (customer) {
      const { data: lastMsg } = await supabase
        .from('messages')
        .select('created_at')
        .eq('customer_id', customer.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (lastMsg) {
        const lastTime = new Date(lastMsg.created_at).getTime();
        minutesSinceLastActivity = (new Date().getTime() - lastTime) / 60000;
      }
    }

    let currentStatus = customer?.status || 'NEW';

    // ==========================================
    // 3. SMART SESSION TIMEOUT (TEST MODE: 5 MIN)
    // ==========================================
    if (minutesSinceLastActivity > 5) {
      console.log(`5-minute Session timeout for ${phoneNumber}. Resetting bot to NEW state.`);
      currentStatus = 'NEW';
    }

    // Sync Customer state
    if (!customer) {
      const { data: newCust } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: currentStatus,
        last_message: body,
        workspace_id: workspace.id,
      }).select().single();
      customer = newCust;
    } else {
      await supabase.from('customers')
        .update({ last_message: body, status: currentStatus })
        .eq('id', customer.id);
    }

    // Save incoming message
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });

    const bodyLower = body.toLowerCase();

    // ==========================================
    // 4. INTENT-BASED HANDOFF
    // ==========================================
    const agentKeywords = ['agent', 'human', 'representative', 'operator', 'talk to someone', 'real person'];
    const wantsAgent = agentKeywords.some(word => bodyLower.includes(word));

    if (wantsAgent && currentStatus !== 'PENDING_AGENT') {
      const handoffScript = "Assigning you to a human agent. Please hold on, someone will join the chat shortly. 👨‍💻";
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: handoffScript });
      
      await supabase.from('customers')
        .update({ last_message: `System: Agent requested`, status: 'PENDING_AGENT' })
        .eq('id', customer.id);
        
      await supabase.from('messages').insert({ customer_id: customer.id, content: handoffScript, is_outbound: true });
      return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // ==========================================
    // 5. THE BOT MUTE LOCKOUT
    // ==========================================
    // Keeps bot silent while waiting for agent OR while agent is chatting
    if (currentStatus === 'PENDING_AGENT' || currentStatus === 'HANDOFF') {
      console.log(`Bot muted. Current status is ${currentStatus} for ${phoneNumber}.`);
      return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });
    }

    // 6. SMART FILTER & GROQ AI LOGIC
    let aiResponse = "SKIP";
    const keywords = ['price', 'how much', 'cost', 'pkr', 'delivery', 'time', 'days', 'return', 'exchange', 'discount'];
    if (keywords.some(word => bodyLower.includes(word))) {
      const prompt = `
        You are a professional assistant. 
        Pricing: 2500 PKR. Delivery: 3-5 days. Returns: 7 days.
        Customer says: "${body}"
        Reply with a short 1-sentence answer if it's about price/delivery/returns. Otherwise reply "SKIP".
      `;
      try { aiResponse = await generateWithGroq(prompt); } catch (e) { }
    }

    // 7. Send AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({ from: TWILIO_FROM, to: rawFrom, body: aiResponse });
      await supabase.from('customers').update({ last_message: `AI: ${aiResponse}` }).eq('id', customer.id);
      await supabase.from('messages').insert({ customer_id: customer.id, content: aiResponse, is_outbound: true });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}