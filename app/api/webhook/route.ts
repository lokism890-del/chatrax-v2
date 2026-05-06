import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize Groq instead of Gemini
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER?.startsWith('whatsapp:') 
  ? process.env.TWILIO_PHONE_NUMBER 
  : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

// Groq Fallback function using Llama 3
async function generateWithGroq(prompt: string): Promise<string> {
  const modelCandidates = ["llama3-8b-8192", "llama3-70b-8192", "mixtral-8x7b-32768"];
  let lastError: any;

  for (const modelName of modelCandidates) {
    try {
      const completion = await groq.chat.completions.create({
        messages: [{ role: "user", content: prompt }],
        model: modelName,
        temperature: 0.2, // Low temperature for factual, consistent business answers
        max_tokens: 150,
      });
      return completion.choices[0]?.message?.content?.trim() || "SKIP";
    } catch (error: any) {
      lastError = error;
      console.warn(`Groq model ${modelName} failed, trying next...`);
    }
  }
  throw lastError || new Error("All Groq models failed");
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

    // 2. CHECK & SYNC CUSTOMER (Dashboard updates instantly)
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (!customer) {
      const { data: newCust } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: 'NEW',
        last_message: body,
        workspace_id: workspace.id,
      }).select().single();
      customer = newCust;
    } else {
      await supabase.from('customers')
        .update({ 
          last_message: body, 
          status: 'NEW' 
        })
        .eq('id', customer.id);
    }

    // 3. Save to Messages table
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });

    // 4. SMART FILTER & GROQ AI LOGIC
    let aiResponse = "SKIP";
    const bodyLower = body.toLowerCase();
    const keywords = ['price', 'how much', 'cost', 'pkr', 'delivery', 'time', 'days', 'return', 'exchange'];
    const isRelevant = keywords.some(word => bodyLower.includes(word));

    if (isRelevant) {
      const prompt = `
        You are a professional assistant. 
        Pricing: 2500 PKR. Delivery: 3-5 days. Returns: 7 days.
        Customer says: "${body}"
        Reply with a 1-sentence answer if it's about price/delivery/returns. Otherwise reply "SKIP".
      `;

      try {
        aiResponse = await generateWithGroq(prompt);
      } catch (e) {
        console.error("Groq generation failed:", e);
      }
    } else {
      console.log("Message skipped by Smart Filter to save processing time.");
    }

    // 5. Send & Log AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({
        from: TWILIO_FROM,
        to: rawFrom,
        body: aiResponse
      });

      await supabase.from('customers')
        .update({ last_message: `AI: ${aiResponse}` })
        .eq('id', customer.id);

      await supabase.from('messages').insert({
        customer_id: customer.id,
        content: aiResponse,
        is_outbound: true
      });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}