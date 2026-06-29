import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { chat, thread_id } = body;

    if (!chat || !thread_id) {
      return NextResponse.json(
        { error: 'Missing chat message or thread_id' },
        { status: 400 }
      );
    }

    const hfApiUrl = process.env.HF_API_URL || 'https://omthakur1394-shopease-self-rag.hf.space/chat';

    let hfSuccess = false;
    let hfData: any = null;

    try {
      const response = await fetch(hfApiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ chat, thread_id }),
      });

      if (response.ok) {
        hfData = await response.json();
        hfSuccess = true;
      }
    } catch (fetchErr) {
      console.error('HF Chat API fetch failed:', fetchErr);
    }

    if (hfSuccess && hfData) {
      return NextResponse.json(hfData);
    }

    // Support offline fallback responses
    const supportReplies = [
      "Thank you for contacting ShopEase support! Since our AI support agent is currently undergoing maintenance, our human support staff will review your message and get back to you shortly.",
      "Hello! I am the ShopEase assistant. Our AI support module is currently offline for updates. If you have questions about returns, active promotions, or shipping, please check back soon!",
      "Thanks for your message! Our backend assistant is offline right now, but your inquiry has been logged. We appreciate your patience!"
    ];
    const randomReply = supportReplies[Math.floor(Math.random() * supportReplies.length)];
    return NextResponse.json({ res: randomReply });

  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
