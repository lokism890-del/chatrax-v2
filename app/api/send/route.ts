import { NextResponse } from 'next/server';
import twilio from 'twilio';

// Initialize the Twilio client using your environment variables
const client = twilio(
  process.env.TWILIO_ACCOUNT_SID, 
  process.env.TWILIO_AUTH_TOKEN
);

// CRITICAL FIX: No "default" keyword here!
export async function POST(request: Request) {
  try {
    const { to, message } = await request.json();

    // Twilio requires WhatsApp numbers to have 'whatsapp:' in front of them
    const formattedTo = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;
    
    // Ensure you have your Twilio number in your .env.local file!
    const formattedFrom = `whatsapp:${process.env.TWILIO_PHONE_NUMBER}`; 

    // Tell Twilio to send the message
    const twilioResponse = await client.messages.create({
      body: message,
      from: formattedFrom,
      to: formattedTo,
    });

    return NextResponse.json({ success: true, sid: twilioResponse.sid });
    
  } catch (error: any) {
    console.error('Twilio Sending Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}