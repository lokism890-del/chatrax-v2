import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    // 1. Get the phone number from the URL the dashboard sent
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get('phone');

    if (!phone) {
      return NextResponse.json({ error: 'Phone number is required' }, { status: 400 });
    }

    // 2. THIS IS WHERE YOUR REAL SHOPIFY API CALL WILL GO
    // const shopifyResponse = await fetch(`https://YOUR_STORE.myshopify.com/admin/api/2024-01/customers/search.json?query=phone:${phone}`, { ...headers })

    // 3. For now, return safe JSON data so the dashboard doesn't crash
    return NextResponse.json({
      found: true,
      totalSpent: "14,500 PKR",
      recentOrders: [
        { 
          orderName: "#1024", 
          date: new Date().toLocaleDateString(), 
          fulfillmentStatus: "FULFILLED", 
          total: "8,500 PKR" 
        },
        { 
          orderName: "#1012", 
          date: "Last Week", 
          fulfillmentStatus: "UNFULFILLED", 
          total: "6,000 PKR" 
        }
      ]
    });

  } catch (error) {
    console.error("Shopify Fetch Error:", error);
    // If something breaks, return a safe JSON error, NOT an HTML page!
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}