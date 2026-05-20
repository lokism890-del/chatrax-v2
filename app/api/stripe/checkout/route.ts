import { NextResponse } from 'next/server';
import Stripe from 'stripe';

// app/api/stripe/checkout/route.ts

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2026-04-22.dahlia' as any, // This bypasses the type-checking error
  });

export async function POST(req: Request) {
  try {
    const { plan, email } = await req.json();

    // Map your pricing tiers to actual Stripe Price IDs later
    const priceId = plan === 'Enterprise' ? 'price_enterprise_123' : 'price_pro_123';

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      customer_email: email,
      line_items: [
        {
          price: priceId, // Replace with your actual Stripe Price ID
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_BASE_URL}/dashboard`,
    });

    return NextResponse.json({ url: session.url });
  } catch (error: any) {
    console.error("Stripe Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}