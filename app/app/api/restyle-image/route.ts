// ============================================
// API: /api/restyle-image
// Apply style transformations to existing images
// Simplified: only uses customPrompt (no style presets)
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { put } from '@vercel/blob';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';
import crypto from 'crypto';

// Extract image data from Gemini response
function extractImageFromResponse(data: any): string | null {
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/')
  );
  return imagePart?.inlineData?.data || null;
}

// Fetch image and convert to base64
async function fetchImageAsBase64(url: string): Promise<{ data: string; mimeType: string }> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${response.statusText}`);
  }

  const contentType = response.headers.get('content-type') || 'image/png';
  const arrayBuffer = await response.arrayBuffer();
  const base64 = Buffer.from(arrayBuffer).toString('base64');

  return {
    data: base64,
    mimeType: contentType,
  };
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { imageUrl, customPrompt, backgroundColor, sceneContext } = await request.json();

    if (!imageUrl) {
      return NextResponse.json(
        { error: 'Image URL is required' },
        { status: 400 }
      );
    }

    if (!customPrompt) {
      return NextResponse.json(
        { error: 'Style description (customPrompt) is required' },
        { status: 400 }
      );
    }

    // Credit check
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.IMAGE_RESTYLE);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Fetch the original image
    console.log('Fetching original image...');
    const { data: imageBase64, mimeType } = await fetchImageAsBase64(imageUrl);

    // Build the transformation prompt
    let transformPrompt = `Transform this image to: ${customPrompt}`;

    // Add scene context if provided
    if (sceneContext && sceneContext.trim()) {
      transformPrompt = `${sceneContext.trim()}. ${transformPrompt}`;
    }

    // Add background color instruction if provided
    if (backgroundColor) {
      transformPrompt = `IMPORTANT: The output image MUST have a solid ${backgroundColor} background. ${transformPrompt}`;
    }

    // Add instruction to maintain the subject
    transformPrompt = `${transformPrompt}\n\nIMPORTANT: Maintain the core subject and composition of the original image while applying the new style. The output should be recognizable as the same scene/subject.`;

    console.log('Restyling with prompt:', transformPrompt);

    // Try Gemini 3 first for best quality
    console.log('Attempting Gemini 3 image transformation...');
    const gemini3Response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: transformPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['image'],
          },
        }),
      }
    );

    if (gemini3Response.ok) {
      const data = await gemini3Response.json();
      const newImageData = extractImageFromResponse(data);

      if (newImageData) {
        // Save to blob storage
        const hash = crypto.randomBytes(8).toString('hex');
        const filename = `restyled/${hash}.png`;
        const imageBuffer = Buffer.from(newImageData, 'base64');

        const blob = await put(filename, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        });

        // Deduct credits after successful restyle
        await deductCredits(
          session.user.id,
          CREDIT_COSTS.IMAGE_RESTYLE,
          'AI image restyle',
          { originalUrl: imageUrl, model: 'gemini-3-pro-image-preview' }
        );

        return NextResponse.json({
          url: blob.url,
          originalUrl: imageUrl,
          customPrompt,
          model: 'gemini-3-pro-image-preview',
        });
      }
    }

    // Fallback to Gemini 2.0 Flash
    console.log('Gemini 3 failed, trying Gemini 2.0 Flash...');
    const gemini2Response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  inlineData: {
                    mimeType,
                    data: imageBase64,
                  },
                },
                {
                  text: transformPrompt,
                },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['image', 'text'],
          },
        }),
      }
    );

    if (gemini2Response.ok) {
      const data = await gemini2Response.json();
      const newImageData = extractImageFromResponse(data);

      if (newImageData) {
        const hash = crypto.randomBytes(8).toString('hex');
        const filename = `restyled/${hash}.png`;
        const imageBuffer = Buffer.from(newImageData, 'base64');

        const blob = await put(filename, imageBuffer, {
          access: 'public',
          contentType: 'image/png',
        });

        // Deduct credits after successful restyle
        await deductCredits(
          session.user.id,
          CREDIT_COSTS.IMAGE_RESTYLE,
          'AI image restyle',
          { originalUrl: imageUrl, model: 'gemini-2.0-flash-exp' }
        );

        return NextResponse.json({
          url: blob.url,
          originalUrl: imageUrl,
          customPrompt,
          model: 'gemini-2.0-flash-exp',
        });
      }
    }

    // All models failed
    const errorText = await gemini2Response.text();
    console.error('All image transformation models failed. Last error:', errorText);

    return NextResponse.json(
      { error: 'Failed to restyle image. All models failed.', details: errorText },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error restyling image:', error);
    return NextResponse.json(
      { error: 'Failed to restyle image', details: String(error) },
      { status: 500 }
    );
  }
}
