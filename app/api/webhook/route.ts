import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import twilio from 'twilio';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER?.startsWith('whatsapp:') 
  ? process.env.TWILIO_PHONE_NUMBER 
  : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

async function generateWithFallback(prompt: string): Promise<string> {
  const modelCandidates = ["gemini-1.5-flash-latest", "gemini-2.0-flash", "gemini-1.5-pro-latest"];
  let lastError: any;
  for (const modelName of modelCandidates) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text().trim();
    } catch (error: any) {
      lastError = error;
      if (error?.status === 429) throw error;
    }
  }
  throw lastError || new Error("AI Failed");
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

    // 2. CHECK & SYNC CUSTOMER
    let { data: customer } = await supabase
      .from('customers')
      .select('*')
      .eq('phone_number', phoneNumber)
      .single();

    if (!customer) {
      // Create brand new customer
      const { data: newCust } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: 'NEW',
        last_message: body,
        workspace_id: workspace.id,
      }).select().single();
      customer = newCust;
    } else {
      // UPDATE existing customer to sync dashboard card
      await supabase.from('customers')
        .update({ 
          last_message: body, 
          status: 'NEW' 
        })
        .eq('id', customer.id);
    }

    // 3. Save to Messages table (for Chat History)
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });

    // 4. AI Logic
    const prompt = `
      You are a professional assistant. 
      Pricing: 2500 PKR. Delivery: 3-5 days. Returns: 7 days.
      Customer says: "${body}"
      Reply with a 1-sentence answer if it's about price/delivery/returns. Otherwise reply "SKIP".
    `;

    let aiResponse = "SKIP";
    try {
      aiResponse = await generateWithFallback(prompt);
    } catch (e) {
      console.error("AI Quota hit, skipping auto-reply");
    }

    // 5. Send & Log AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({
        from: TWILIO_FROM,
        to: rawFrom,
        body: aiResponse
      });

      // Update dashboard again to show AI's response as the last message
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