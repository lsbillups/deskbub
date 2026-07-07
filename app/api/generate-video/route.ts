import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided.' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        { error: 'AI is not configured yet.' },
        { status: 500 }
      );
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Create prediction directly for better control
    const prediction = await replicate.predictions.create({
      model: 'wan-video/wan-2.2-5b-fast',
      input: {
        image: imageUrl,
        prompt:
          'The pet animal breathes gently, makes subtle natural head movements, and blinks occasionally. Keep the subject perfectly centered with minimal motion. Realistic, gentle, cute.',
        negative_prompt: 'distorted, blurry, fast movement, unnatural, deformed, text, watermark',
        num_frames: 81,
        fps: 16,
        width: 480,
        height: 480,
      },
    });

    // Poll until complete (up to 120 seconds)
    let result = prediction;
    const maxAttempts = 40;
    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'succeeded') break;
      if (result.status === 'failed' || result.status === 'canceled') {
        const errMsg = (result as any).error || 'unknown error';
        return NextResponse.json(
          { error: `Video generation ${result.status}: ${errMsg}` },
          { status: 500 }
        );
      }
      // Wait 3 seconds between polls
      await new Promise((r) => setTimeout(r, 3000));
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'Video generation timed out. Please try again.' },
        { status: 500 }
      );
    }

    // Extract video URL
    const output = (result as any).output;
    let videoUrl: string | null = null;

    if (typeof output === 'string') {
      videoUrl = output;
    } else if (output && output.url) {
      videoUrl = output.url;
    } else if (Array.isArray(output) && typeof output[0] === 'string') {
      videoUrl = output[0];
    }

    if (!videoUrl) {
      console.error('Unknown output format:', JSON.stringify(output).slice(0, 200));
      return NextResponse.json(
        { error: 'Video output format unexpected.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, videoUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Video gen error:', msg);
    return NextResponse.json(
      { error: `Video generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
