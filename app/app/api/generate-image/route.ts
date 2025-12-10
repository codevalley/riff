// ============================================
// API: /api/generate-image
// Generate images using Google Gemini Imagen
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getImageFromCache, saveImageToCache, deleteImageFromCache } from '@/lib/blob';

export async function POST(request: NextRequest) {
  try {
    const { description, style, forceRegenerate } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Image description is required' },
        { status: 400 }
      );
    }

    // Check cache first (unless force regenerating)
    if (!forceRegenerate) {
      const cachedUrl = await getImageFromCache(description);
      if (cachedUrl) {
        return NextResponse.json({
          url: cachedUrl,
          cached: true,
          description,
        });
      }
    } else {
      // Delete existing cache if force regenerating
      await deleteImageFromCache(description);
    }

    // Build the prompt for image generation
    const styleModifier = style || 'professional, high-quality, presentation-style';
    const fullPrompt = `${description}. Style: ${styleModifier}. Create a clean, visually striking image suitable for a presentation slide. Aspect ratio 16:9.`;

    // Call Gemini Imagen API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Using Gemini's imagen model for image generation
    // Note: The exact endpoint may vary based on the API version
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          instances: [
            {
              prompt: fullPrompt,
            },
          ],
          parameters: {
            sampleCount: 1,
            aspectRatio: '16:9',
            safetyFilterLevel: 'block_few',
          },
        }),
      }
    );

    if (!response.ok) {
      // Fallback: Try using Gemini 2.0 Flash for image generation
      const geminiResponse = await fetch(
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
                    text: `Generate an image: ${fullPrompt}`,
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

      if (!geminiResponse.ok) {
        const errorText = await geminiResponse.text();
        console.error('Gemini API error:', errorText);
        return NextResponse.json(
          { error: 'Failed to generate image', details: errorText },
          { status: 500 }
        );
      }

      const geminiData = await geminiResponse.json();

      // Extract image from response
      const imagePart = geminiData.candidates?.[0]?.content?.parts?.find(
        (part: any) => part.inlineData?.mimeType?.startsWith('image/')
      );

      if (!imagePart?.inlineData?.data) {
        // Return a placeholder response if image generation isn't available
        return NextResponse.json({
          url: null,
          cached: false,
          description,
          placeholder: true,
          message: 'Image generation not available. Please configure Imagen API.',
        });
      }

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const cachedUrl = await saveImageToCache(description, imageBuffer);

      return NextResponse.json({
        url: cachedUrl,
        cached: false,
        description,
      });
    }

    const data = await response.json();

    // Extract image from Imagen response
    const imageData = data.predictions?.[0]?.bytesBase64Encoded;

    if (!imageData) {
      return NextResponse.json(
        { error: 'No image generated' },
        { status: 500 }
      );
    }

    // Convert base64 to buffer and save to cache
    const imageBuffer = Buffer.from(imageData, 'base64');
    const cachedUrl = await saveImageToCache(description, imageBuffer);

    return NextResponse.json({
      url: cachedUrl,
      cached: false,
      description,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: String(error) },
      { status: 500 }
    );
  }
}
