import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const mediaId = searchParams.get("id");
    const META_TOKEN = process.env.META_ACCESS_TOKEN;

    if (!mediaId || !META_TOKEN) {
      return new NextResponse("Missing Media ID or Token", { status: 400 });
    }

    // 1. Fetch the exact Media URL from Meta using the ID
    const urlResponse = await fetch(`https://graph.facebook.com/v18.0/${mediaId}`, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });
    
    const urlData = await urlResponse.json();

    if (!urlData.url) {
      return new NextResponse("Media URL not found on Meta servers", { status: 404 });
    }

    // 2. Download the binary media stream using the token
    const mediaResponse = await fetch(urlData.url, {
      headers: { 'Authorization': `Bearer ${META_TOKEN}` }
    });

    const buffer = await mediaResponse.arrayBuffer();
    const contentType = mediaResponse.headers.get('content-type') || 'application/octet-stream';

    // 3. Pipe the playable file straight to the ChatRax UI
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000', // Cache it so it doesn't reload constantly
      },
    });
  } catch (error) {
    console.error("Media Fetch Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}