import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from "@google/generative-ai";
import twilio from 'twilio';

// Initialize Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// Initialize AI and Twilio
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

/**
 * Normalizes the Twilio phone number to ensure the 'whatsapp:' prefix is present.
 */
const TWILIO_FROM = process.env.TWILIO_PHONE_NUMBER?.startsWith('whatsapp:') 
  ? process.env.TWILIO_PHONE_NUMBER 
  : `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`;

/**
 * Handles AI generation with fallbacks to avoid 404 or version errors.
 */
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
      // If we hit a 429 (Quota), we stop trying other models to avoid further delays
      if (error?.status === 429) throw error;
      console.warn(`Gemini model ${modelName} unavailable, trying fallback...`);
    }
  }
  throw lastError || new Error("All AI models failed to respond.");
}

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const rawFrom = params.get('From') || ''; 
    const body = params.get('Body') || '';
    const phoneNumber = rawFrom.replace('whatsapp:', '');

    // 1. Database Logic: Workspace and Customer Sync
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).single();
    
    let { data: customer } = await supabase.from('customers').select('*').eq('phone_number', phoneNumber).single();

    if (!customer) {
      // Create new customer
      const { data: newCust } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: 'NEW',
        last_message: body,
        workspace_id: workspace?.id
      }).select().single();
      customer = newCust;
    } else {
      // UPDATE: This ensures the dashboard card updates its preview text immediately
      await supabase.from('customers')
        .update({ 
          last_message: body, 
          status: 'NEW', // Re-opens the lead if it was previously resolved
          updated_at: new Date().toISOString() 
        })
        .eq('id', customer.id);
    }

    // 2. Log the incoming message for the chat history
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });

    // 3. AI Autoreply Configuration (Generic Branding)
    const prompt = `
      You are a professional customer support assistant for a premium e-commerce store.
      
      **Store Knowledge:**
      - Pricing: All items are 2500 PKR.
      - Delivery: 3-5 working days across Pakistan.
      - Returns: 7-day easy return and exchange policy.
      
      **Customer Query:** "${body}"
      
      **Instructions:**
      - If the user asks about price, delivery, or returns, give a polite 1-sentence answer.
      - For anything else (greetings, unrelated questions), reply with only the word "SKIP".
    `;

    let aiResponse = "SKIP";
    try {
      // Attempt generation using our fallback system
      aiResponse = await generateWithFallback(prompt);
    } catch (aiError: any) {
      // Log AI errors (like 429 Quota limits) but keep the webhook alive
      console.error('AI Autoreply skipped due to error:', aiError.message);
    }

    // 4. Send the Autoreply if valid
    if (aiResponse !== "SKIP" && !aiResponse.includes("SKIP")) {
      // Send message via Twilio WhatsApp
      await twilioClient.messages.create({
        from: TWILIO_FROM,
        to: rawFrom,
        body: aiResponse
      });

      // Save the AI's reply so it appears in the dashboard chat
      await supabase.from('messages').insert({
        customer_id: customer.id,
        content: aiResponse,
        is_outbound: true
      });
    }

    // Always return a 200 OK to Twilio
    return new NextResponse('<Response></Response>', { 
      status: 200, 
      headers: { 'Content-Type': 'text/xml' } 
    });

  } catch (error) {
    console.error('Critical Webhook Error:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}