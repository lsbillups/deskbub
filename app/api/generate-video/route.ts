import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Replicate from 'replicate';

// ByteDance Seedance 1.0 Lite — affordable ($0.09/video)
const SEEDANCE_VERSION = '2ca0dadb1f64bb54f2d3da881d9a58e7ed0f5c9fe7db5c821293cdfed786cb32';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const { imageUrl, petType } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided.' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'AI not configured.' }, { status: 500 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    const prediction = await replicate.predictions.create({
      version: SEEDANCE_VERSION,
      input: {
        image: imageUrl,
        prompt: 'Solid bright green (#00FF00) background. ' + (petType === 'cat'
          ? 'A cute cat gently licking its paw, soft breathing, subtle ear twitches. Calm, natural behavior. The cat stays centered and in frame.'
          : petType === 'dog'
            ? 'A cute dog panting happily with tongue out, gentle head tilt, soft breathing, subtle ear movements. The dog stays centered and in frame.'
            : 'A cute pet looking around curiously, gentle head tilt, soft breathing, subtle movements. The pet stays centered and in frame.'),
        negative_prompt: 'distorted, blurry, deformed, fast movement, jumping, running, leaving frame, text, watermark, morphing, unrealistic, dark background, white background, room, floor',
        duration: 5,
        aspect_ratio: '1:1',
        fps: 24,
      },
    });

    // Poll (can take 30-90 seconds)
    let result = prediction;
    for (let i = 0; i < 60; i++) {
      if (result.status === 'succeeded') break;
      if (result.status === 'failed' || result.status === 'canceled') {
        return NextResponse.json({ error: `Video ${result.status}: ${(result as any).error || 'unknown'}` }, { status: 500 });
      }
      await new Promise((r) => setTimeout(r, 3000));
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json({ error: 'Video generation timed out.' }, { status: 500 });
    }

    const output = (result as any).output;
    let videoUrl: string | null = null;
    if (typeof output === 'string') videoUrl = output;
    else if (output?.video) videoUrl = output.video;
    else if (Array.isArray(output) && output[0]) videoUrl = output[0];

    if (!videoUrl) {
      return NextResponse.json({ error: 'No video in output.' }, { status: 500 });
    }

    return NextResponse.json({ success: true, videoUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Video gen error:', msg);
    return NextResponse.json({ error: `Video generation failed: ${msg}` }, { status: 500 });
  }
}
