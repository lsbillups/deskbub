import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createAdminClient } from '@/lib/supabase/admin';
import Replicate from 'replicate';

// ByteDance Seedance 1.0 Lite — affordable ($0.09/video)
const SEEDANCE_VERSION = '2ca0dadb1f64bb54f2d3da881d9a58e7ed0f5c9fe7db5c821293cdfed786cb32';

function getActionPrompt(petType: string, action: number): string {
  const prompts: Record<string, string[]> = {
    dog: [
      'A cute dog panting happily with tongue out, gentle head tilt, soft breathing.',
      'A cute dog tilting its head curiously, ears perked up, gentle eye contact.',
      'A cute dog wagging its tail excitedly, happy expression, gentle bouncing.',
      'A cute dog lying down relaxed, soft breathing, eyes half closed, peaceful.',
      'A cute dog sitting and looking up at owner, loyal expression, gentle tail wag.',
    ],
    cat: [
      'A cute cat gently licking its paw, grooming, soft breathing, subtle ear twitches.',
      'A cute cat stretching its body, arching back, yoga-like, slow relaxed movement.',
      'A cute cat curling up into a ball, sleepy, tiny yawn, peaceful.',
      'A cute cat with tail swishing slowly, relaxed, gentle gaze.',
      'A cute cat pouncing playfully, batting paw at something, curious.',
    ],
    other: [
      'A cute pet casually walking and exploring, gentle steps, curious.',
      'A cute pet looking around curiously, alert eyes, gentle head movements.',
      'A cute pet sitting calmly, gentle breathing, relaxed posture.',
      'A cute pet tilting its head with cute expression, gentle blink.',
      'A cute pet nibbling delicately, eating gently, small bites.',
    ],
  };
  const list = prompts[petType] || prompts.other;
  return list[Math.min(action, list.length - 1)];
}

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    // Check remaining generations
    const adminSupabase = createAdminClient();
    const { data: sub } = await adminSupabase.from('subscriptions').select('generations_used,max_generations').eq('user_id', userId).single();
    const used = sub?.generations_used || 0;
    const max = sub?.max_generations || 0;
    if (used >= max) {
      return NextResponse.json({ error: 'No generations remaining. Share or upgrade to unlock more.' }, { status: 403 });
    }

    const body = await request.json();
    const { imageUrl, petType, action, actionLabel, clear_first } = body;
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
        prompt: getActionPrompt(petType, typeof action === 'number' ? action : 0) + ' The pet must be fully visible from head to paws, centered in the frame with space around it. Keep the pet small and cute like a desktop mascot. Chroma key green studio background filling the entire frame.',
        negative_prompt: 'close-up, zoomed in, cropped, partial body, only head, distorted, blurry, deformed, fast movement, jumping, running, leaving frame, text, watermark, morphing',
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

    // Step 2: Remove background from video (makes it transparent)
    const bgRemoval = await replicate.predictions.create({
      version: 'bria/video-remove-background',
      input: {
        video_url: videoUrl,
        background_color: 'Transparent',
        output_container_and_codec: 'webm_vp9',
        preserve_audio: false,
      },
    });

    let bgResult = bgRemoval;
    for (let i = 0; i < 40; i++) {
      if (bgResult.status === 'succeeded') break;
      if (bgResult.status === 'failed' || bgResult.status === 'canceled') {
        // Return original video if BG removal fails
        console.warn('BG removal failed, returning original video');
        return NextResponse.json({ success: true, videoUrl, warning: 'Background removal skipped' });
      }
      await new Promise((r) => setTimeout(r, 3000));
      bgResult = await replicate.predictions.get(bgRemoval.id);
    }

    const bgOutput = (bgResult as any).output;
    let transparentUrl = bgOutput?.video || bgOutput?.output || bgOutput;
    if (typeof transparentUrl === 'object' && transparentUrl.url) transparentUrl = transparentUrl.url;

    let finalUrl = transparentUrl || videoUrl;

    // Download video and upload to Supabase for permanent storage
    try {
      const videoResponse = await fetch(finalUrl);
      if (videoResponse.ok) {
        const videoBuffer = Buffer.from(await videoResponse.arrayBuffer());
        const supabaseClient = createAdminClient();
        const storagePath = `videos/${userId}/${Date.now()}.webm`;
        const { error: uploadErr } = await supabaseClient.storage
          .from('pet-photos')
          .upload(storagePath, videoBuffer, {
            contentType: 'video/webm',
            upsert: false,
          });
        if (!uploadErr) {
          const { data: urlData } = supabaseClient.storage
            .from('pet-photos')
            .getPublicUrl(storagePath);
          finalUrl = urlData.publicUrl;
        }
      }
    } catch (err) {
      console.error('Video download/upload error:', err);
    }

    // Increment generation counter
    try {
      const adminSupabase = createAdminClient();
      const { data: sub } = await adminSupabase.from('subscriptions').select('generations_used').eq('user_id', userId).single();
      if (sub) {
        await adminSupabase.from('subscriptions').update({ generations_used: (sub.generations_used || 0) + 1 }).eq('user_id', userId);
      }
    } catch {}

    return NextResponse.json({
      success: true,
      videoUrl: finalUrl,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('Video gen error:', msg);
    return NextResponse.json({ error: `Video generation failed: ${msg}` }, { status: 500 });
  }
}
