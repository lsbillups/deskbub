import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import Replicate from 'replicate';

const TRELLIS_VERSION = '1dee190699ab9bf370eda8c40dddaa170f49b3b6e0ca46931cceeedf6df3a3bc';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    const { imageUrls, imageUrl } = await request.json();
    // Support both single imageUrl and multiple imageUrls
    const images = imageUrls || (imageUrl ? [imageUrl] : null);
    if (!images || images.length === 0) {
      return NextResponse.json({ error: 'No image URLs provided.' }, { status: 400 });
    }

    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json({ error: 'AI not configured.' }, { status: 500 });
    }

    const replicate = new Replicate({ auth: process.env.REPLICATE_API_TOKEN });

    // Create 3D model prediction
    const prediction = await replicate.predictions.create({
      version: TRELLIS_VERSION,
      input: {
        images: images,
        generate_model: true,
        generate_color: true,
        texture_size: 1024,
        mesh_simplify: 0.9,
        ss_sampling_steps: 12,
        slat_sampling_steps: 12,
      },
    });

    // Poll until complete (can take 30-120 seconds)
    let result = prediction;
    const maxAttempts = 60;
    for (let i = 0; i < maxAttempts; i++) {
      if (result.status === 'succeeded') break;
      if (result.status === 'failed' || result.status === 'canceled') {
        const errMsg = (result as any).error || 'unknown error';
        return NextResponse.json(
          { error: `3D generation ${result.status}: ${errMsg}` },
          { status: 500 }
        );
      }
      await new Promise((r) => setTimeout(r, 3000));
      result = await replicate.predictions.get(prediction.id);
    }

    if (result.status !== 'succeeded') {
      return NextResponse.json(
        { error: '3D generation timed out.' },
        { status: 500 }
      );
    }

    const output = (result as any).output;
    const modelUrl = output?.model_file || output?.glb || null;

    if (!modelUrl) {
      console.error('No model_file in output:', JSON.stringify(output).slice(0, 300));
      return NextResponse.json(
        { error: '3D model output not found.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, modelUrl });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('3D gen error:', msg);
    return NextResponse.json(
      { error: `3D generation failed: ${msg}` },
      { status: 500 }
    );
  }
}
