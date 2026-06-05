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

    const hfApiUrl = process.env.HF_API_URL;
    if (!hfApiUrl) {
      console.error('HF_API_URL environment variable is not defined');
      return NextResponse.json(
        { error: 'Internal Server Error: Backend configuration is missing' },
        { status: 500 }
      );
    }

    // Call the Hugging Face API
    const response = await fetch(hfApiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ chat, thread_id }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`HF API error: ${response.status} - ${errorText}`);
      return NextResponse.json(
        { error: `Backend API error: Status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error in chat API route:', error);
    return NextResponse.json(
      { error: error?.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
