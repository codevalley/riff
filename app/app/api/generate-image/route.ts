// ============================================
// API: /api/generate-image
// Generate images using Google Gemini Imagen
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getImageFromCache, saveImageToCache, deleteImageFromCache } from '@/lib/blob';
import { IMAGE_STYLE_PRESETS, ImageStyleId } from '@/lib/types';

// Get the prompt template for a given style, with optional background color
function getPromptForStyle(description: string, styleId: ImageStyleId, backgroundColor?: string): string {
  const preset = IMAGE_STYLE_PRESETS.find((p) => p.id === styleId);

  // Add background color instruction if provided
  const bgInstruction = backgroundColor
    ? ` The image should have a ${backgroundColor} background that seamlessly blends with the slide.`
    : '';

  if (!preset) {
    // Fallback to default
    return `${description}. Style: professional, high-quality, presentation-style. Create a clean, visually striking image suitable for a presentation slide.${bgInstruction} Aspect ratio 16:9.`;
  }
  return preset.promptTemplate.replace('{description}', description) + bgInstruction;
}

export async function POST(request: NextRequest) {
  try {
    const { description, styleId, forceRegenerate, backgroundColor } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Image description is required' },
        { status: 400 }
      );
    }

    // Create a cache key that includes the style (bg color changes are allowed without invalidating cache)
    const cacheKey = styleId && styleId !== 'none'
      ? `${styleId}:${description}`
      : description;

    // Check cache first (unless force regenerating)
    if (!forceRegenerate) {
      const cachedUrl = await getImageFromCache(cacheKey);
      if (cachedUrl) {
        return NextResponse.json({
          url: cachedUrl,
          cached: true,
          description,
          styleId,
        });
      }
    } else {
      // Delete existing cache if force regenerating
      await deleteImageFromCache(cacheKey);
    }

    // Build the prompt using style preset, including background color
    const fullPrompt = getPromptForStyle(description, styleId || 'none', backgroundColor);

    // Call Gemini Imagen API
    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Using Gemini's imagen model for image generation
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
          styleId,
          placeholder: true,
          message: 'Image generation not available. Please configure Imagen API.',
        });
      }

      // Convert base64 to buffer and save
      const imageBuffer = Buffer.from(imagePart.inlineData.data, 'base64');
      const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

      return NextResponse.json({
        url: cachedUrl,
        cached: false,
        description,
        styleId,
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
    const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

    return NextResponse.json({
      url: cachedUrl,
      cached: false,
      description,
      styleId,
    });
  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: String(error) },
      { status: 500 }
    );
  }
}
