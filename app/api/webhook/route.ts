import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import Groq from 'groq-sdk';

// We must use the SERVICE_ROLE key here to bypass RLS securely on the server
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! 
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. META VERIFICATION (Required by Facebook to connect)
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');

  if (mode === 'subscribe' && token === process.env.META_VERIFY_TOKEN) {
    return new NextResponse(challenge, { status: 200 });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// 2. RECEIVING MESSAGES
export async function POST(req: Request) {
  try {
    const body = await req.json();

    // Check if this is a valid WhatsApp message event
    if (body.object !== 'whatsapp_business_account' || !body.entry?.[0]?.changes?.[0]?.value?.messages) {
      return NextResponse.json({ status: 'ignored' });
    }

    const messageData = body.entry[0].changes[0].value.messages[0];
    const contactData = body.entry[0].changes[0].value.contacts[0];
    const phoneNumber = `+${messageData.from}`;
    const messageContent = messageData.text?.body || "Media message";

    // Grab the default Chatrax HQ Workspace ID we made earlier
    const { data: workspace } = await supabase.from('workspaces').select('id').limit(1).single();
    const workspaceId = workspace?.id;

    // A. FIND OR CREATE CUSTOMER
    let { data: customer } = await supabase.from('customers').select('*').eq('phone_number', phoneNumber).single();

    if (!customer) {
      const { data: newCustomer, error } = await supabase.from('customers').insert({
        workspace_id: workspaceId,
        phone_number: phoneNumber,
        full_name: contactData?.profile?.name || "Unknown",
        status: 'NEW',
        last_message: messageContent
      }).select().single();
      
      if (error) throw error;
      customer = newCustomer;
    } else {
      // If customer exists, update their last message and push them to NEW if they were resolved
      await supabase.from('customers').update({ 
        last_message: messageContent,
        status: customer.status === 'RESOLVED' ? 'NEW' : customer.status
      }).eq('id', customer.id);
    }

    // B. SAVE THE MESSAGE
    await supabase.from('messages').insert({
      customer_id: customer.id,
      content: messageContent,
      is_outbound: false,
      status: 'delivered'
    });

    // C. THE AI BRAIN (Background processing)
    generateAiIntelligence(customer.id, messageContent).catch(console.error);

    return NextResponse.json({ status: 'success' });
  } catch (error) {
    console.error("Webhook Error:", error);
    return new NextResponse('Internal Error', { status: 500 });
  }
}

// 3. AI PROCESSING FUNCTION
async function generateAiIntelligence(customerId: string, latestMessage: string) {
  const prompt = `
    Analyze this incoming customer message: "${latestMessage}"
    1. Provide a 1-sentence summary (ai_summary).
    2. Determine the intent_tag (e.g., REFUND_REQUEST, PRICING_INQUIRY, COMPLAINT, GENERAL_SUPPORT).
    3. Score the sentiment from 0 (happy) to 100 (furious).
    Return ONLY pure JSON matching this exact structure: {"ai_summary": "string", "intent_tag": "string", "sentiment_score": number}
  `;

  const completion = await groq.chat.completions.create({
    messages: [{ role: "user", content: prompt }],
    model: "llama3-8b-8192",
    temperature: 0.2,
  });

  const responseText = completion.choices[0]?.message?.content || "{}";
  const aiData = JSON.parse(responseText.replace(/```json|```/g, '').trim());

  await supabase.from('customers').update({
    ai_summary: aiData.ai_summary,
    intent_tag: aiData.intent_tag,
    sentiment_score: aiData.sentiment_score
  }).eq('id', customerId);
}