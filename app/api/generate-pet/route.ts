import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { auth } from '@clerk/nextjs/server';
import Replicate from 'replicate';

export async function POST(request: NextRequest) {
  try {
    // 1. Auth check
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Please sign in first.' }, { status: 401 });
    }

    // 2. Parse request
    const { imageUrl } = await request.json();
    if (!imageUrl) {
      return NextResponse.json({ error: 'No image URL provided.' }, { status: 400 });
    }

    // 3. Call Replicate AI for background removal
    if (!process.env.REPLICATE_API_TOKEN) {
      return NextResponse.json(
        {
          error:
            'AI processing is not configured yet. Please add your REPLICATE_API_TOKEN in .env.local.',
        },
        { status: 500 }
      );
    }

    const replicate = new Replicate({
      auth: process.env.REPLICATE_API_TOKEN,
    });

    const output = await replicate.run(
      'cjwbw/rembg:fb8af171cfa1616dd8f5f78d0e604d8a3e2b4c27d8105b9e0e2e0e0e0e0e0e0e',
      {
        input: {
          image: imageUrl,
        },
      }
    );

    // Replicate returns the output as an array or string
    const processedImageUrl = Array.isArray(output) ? output[0] : output;

    if (!processedImageUrl || typeof processedImageUrl !== 'string') {
      return NextResponse.json(
        { error: 'AI processing failed. Please try again.' },
        { status: 500 }
      );
    }

    // 4. Save result to Supabase
    const supabase = await createClient();
    const { data, error: dbError } = await supabase
      .from('generated_pets')
      .insert({
        user_id: userId,
        original_url: imageUrl,
        processed_url: processedImageUrl,
      })
      .select()
      .single();

    if (dbError) {
      console.error('Supabase insert error:', dbError);
      // Still return the processed image even if DB save fails for now
      return NextResponse.json({
        success: true,
        processedUrl: processedImageUrl,
        warning: 'Image processed but could not be saved to your account.',
      });
    }

    // 5. Return success
    return NextResponse.json({
      success: true,
      processedUrl: processedImageUrl,
      id: data?.id,
    });
  } catch (error) {
    console.error('Generate pet error:', error);
    return NextResponse.json(
      { error: 'Something went wrong. Please try again later.' },
      { status: 500 }
    );
  }
}
