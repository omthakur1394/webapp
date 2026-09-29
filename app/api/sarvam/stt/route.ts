import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Sarvam API key not configured.' }, { status: 500 });
  }

  try {
    const formData = await req.formData();
    // formData already contains: file (audio blob) + language_code

    // Forward to Sarvam STT
    const sarvamRes = await fetch('https://api.sarvam.ai/speech-to-text', {
      method: 'POST',
      headers: {
        'api-subscription-key': apiKey,
      },
      body: formData,
    });

    const data = await sarvamRes.json();

    if (!sarvamRes.ok) {
      console.error('Sarvam STT error:', data);
      return NextResponse.json({ error: data?.message || 'Sarvam STT failed.' }, { status: sarvamRes.status });
    }

    // Returns: { transcript: "..." }
    return NextResponse.json({ transcript: data.transcript || '' });
  } catch (err: any) {
    console.error('Sarvam STT route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
