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
      'cjwbw/rembg:fb8af171cfa1616ddcf1242c093f9c46bcada5ad4cf6f2fbe8b81b330ec5c003',
      {
        input: {
          image: imageUrl,
        },
      }
    );

    // Replicate v1 may return a URL string directly
    let processedImageUrl: string | null = null;
    const outputAny = output as any;

    if (outputAny && outputAny.url && typeof outputAny.url === 'function') {
      // Replicate v1 FileOutput — .url() returns a URL object
      const u = outputAny.url();
      processedImageUrl = u instanceof URL ? u.href : String(u);
    } else if (typeof outputAny === 'string') {
      processedImageUrl = outputAny;
    } else if (Array.isArray(outputAny) && typeof outputAny[0] === 'string') {
      processedImageUrl = outputAny[0];
    } else if (outputAny && outputAny.image) {
      processedImageUrl = outputAny.image;
    } else if (outputAny && typeof outputAny.pipe === 'function') {
      // Node.js Readable stream
      const chunks: Buffer[] = [];
      for await (const chunk of outputAny) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      const supabase = await createClient();
      const uploadResult = await supabase.storage
        .from('pet-photos')
        .upload(`processed/${Date.now()}.png`, buffer, {
          contentType: 'image/png',
          upsert: false,
        });

      if (uploadResult.error) {
        console.error('Upload error:', uploadResult.error);
        throw new Error('Failed to save processed image.');
      }

      const { data: urlData } = supabase.storage
        .from('pet-photos')
        .getPublicUrl(uploadResult.data.path);
      processedImageUrl = urlData.publicUrl;
    }

    // Fallback: log the output to debug
    if (!processedImageUrl) {
      console.error('Unknown Replicate output type:', typeof outputAny, JSON.stringify(outputAny).slice(0, 200));
      return NextResponse.json(
        { error: 'AI processing returned unexpected format. Please try again.' },
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
