import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function concatWavBase64(b64List: string[]): string {
  if (b64List.length === 0) return '';
  if (b64List.length === 1) return b64List[0];

  const buffers = b64List.map(b => Buffer.from(b, 'base64'));
  // Strip 44-byte RIFF header from all and join PCM payloads
  const pcmChunks = buffers.map(b => b.subarray(44));
  const totalPcm = Buffer.concat(pcmChunks);

  const header = Buffer.from(buffers[0].subarray(0, 44));
  // Total file size - 8 bytes
  header.writeUInt32LE(36 + totalPcm.length, 4);
  // PCM data size
  header.writeUInt32LE(totalPcm.length, 40);

  return Buffer.concat([header, totalPcm]).toString('base64');
}

function splitTextIntoChunks(text: string, maxChunkLength = 400): string[] {
  const clean = text.trim();
  if (clean.length <= maxChunkLength) return [clean];

  const chunks: string[] = [];
  // Split on sentence punctuation (. ? ! \n ; :)
  const sentences = clean.split(/(?<=[.?!;:\n])\s+/);
  let currentChunk = '';

  for (const sentence of sentences) {
    if (!sentence.trim()) continue;
    if ((currentChunk + ' ' + sentence).trim().length <= maxChunkLength) {
      currentChunk = currentChunk ? `${currentChunk} ${sentence}` : sentence;
    } else {
      if (currentChunk) chunks.push(currentChunk);
      if (sentence.length <= maxChunkLength) {
        currentChunk = sentence;
      } else {
        // Sentence itself is long: split by words
        const words = sentence.split(/\s+/);
        let wordChunk = '';
        for (const word of words) {
          if ((wordChunk + ' ' + word).trim().length <= maxChunkLength) {
            wordChunk = wordChunk ? `${wordChunk} ${word}` : word;
          } else {
            if (wordChunk) chunks.push(wordChunk);
            wordChunk = word;
          }
        }
        currentChunk = wordChunk;
      }
    }
  }

  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  return chunks.length > 0 ? chunks : [clean.slice(0, maxChunkLength)];
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.SARVAM_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: 'Sarvam API key not configured.' }, { status: 500 });
  }

  try {
    const body = await req.json();
    const { text, language_code, speaker: customSpeaker } = body;

    if (!text || !text.trim()) {
      return NextResponse.json({ error: 'text is required.' }, { status: 400 });
    }

    const chunks = splitTextIntoChunks(text);
    // Sarvam API accepts maximum 3 items per inputs array
    const batches: string[][] = [];
    for (let i = 0; i < chunks.length; i += 3) {
      batches.push(chunks.slice(i, i + 3));
    }

    // Default to 'ishita' voice on Sarvam AI
    const speaker = customSpeaker || 'ishita';
    const audioResults: string[] = [];

    for (const batch of batches) {
      const sarvamRes = await fetch('https://api.sarvam.ai/text-to-speech', {
        method: 'POST',
        headers: {
          'api-subscription-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: batch,
          target_language_code: language_code || 'hi-IN',
          speaker: speaker,
          pitch: 0,
          pace: 1.0,
          loudness: 1.0,
          speech_sample_rate: 22050,
          enable_preprocessing: true,
          model: 'bulbul:v3',
        }),
      });

      const data = await sarvamRes.json();
      if (!sarvamRes.ok) {
        console.error('Sarvam TTS error:', data);
        return NextResponse.json({ error: data?.message || 'Sarvam TTS failed.' }, { status: sarvamRes.status });
      }

      const audio = data?.audios?.[0];
      if (audio) {
        audioResults.push(audio);
      }
    }

    const finalAudio = concatWavBase64(audioResults);
    return NextResponse.json({ audio: finalAudio });
  } catch (err: any) {
    console.error('Sarvam TTS route error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
