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

    console.log(`[Incoming] ${phoneNumber}: ${body}`);

    // 1. Get Workspace
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).single();
    if (!workspace) throw new Error("No workspace found");

    // 2. THE MASTER SYNC (UPSERT)
    // This creates or updates the customer AND sets the last_message in one shot.
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .upsert(
        {
          phone_number: phoneNumber,
          last_message: body,
          status: 'NEW',
          workspace_id: workspace.id,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'phone_number' }
      )
      .select()
      .single();

    if (customerError) throw customerError;

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
    } catch (e) {}

    // 5. Send & Log AI Response
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      await twilioClient.messages.create({
        from: TWILIO_FROM,
        to: rawFrom,
        body: aiResponse
      });

      // Update dashboard to show AI's reply as the 'last_message'
      await supabase.from('customers')
        .update({ last_message: `AI: ${aiResponse}`, updated_at: new Date().toISOString() })
        .eq('id', customer.id);

      await supabase.from('messages').insert({
        customer_id: customer.id,
        content: aiResponse,
        is_outbound: true
      });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Detailed Webhook Error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}