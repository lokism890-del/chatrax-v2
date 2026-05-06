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

export async function POST(request: Request) {
  try {
    const text = await request.text();
    const params = new URLSearchParams(text);
    const rawFrom = params.get('From') || ''; 
    const body = params.get('Body') || '';
    const phoneNumber = rawFrom.replace('whatsapp:', '');

    // 1. Get the Workspace & Customer (Your existing logic)
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).single();
    
    let { data: customer } = await supabase.from('customers').select('*').eq('phone_number', phoneNumber).single();
    if (!customer) {
      const { data: newCust } = await supabase.from('customers').insert({
        phone_number: phoneNumber,
        status: 'NEW',
        last_message: body,
        workspace_id: workspace?.id
      }).select().single();
      customer = newCust;
    }

    // 2. Save the incoming message
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: body,
      is_outbound: false
    });
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL || "gemini-1.5-flash",
    });
    
    // Knowledge Base Prompt
    const prompt = `
      You are an AI assistant for Velvo PK, an e-commerce brand. 
      Context: 
      - Pricing: All products are 2500 PKR. 
      - Delivery: 3-5 working days across Pakistan.
      - Return Policy: 7 days easy return.
      Customer says: "${body}"
      If the customer asks about pricing, delivery, or returns, give a short, friendly 1-sentence answer. 
      If the question is unrelated, reply with: "SKIP".
    `;

    const result = await model.generateContent(prompt);
    const aiResponse = result.response.text().trim();

    if (aiResponse !== "SKIP") {
      // Send the AI response via Twilio
      await twilioClient.messages.create({
        from: process.env.TWILIO_PHONE_NUMBER,
        to: rawFrom,
        body: aiResponse
      });

      // Save the AI's outbound message to your database
      await supabase.from('messages').insert({
        customer_id: customer.id,
        content: aiResponse,
        is_outbound: true
      });
    }

    return new NextResponse('<Response></Response>', { status: 200, headers: { 'Content-Type': 'text/xml' } });

  } catch (error) {
    console.error('Webhook error:', error);
    return new NextResponse('Error', { status: 500 });
  }
}