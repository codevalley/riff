// ============================================
// API: /api/generate-image
// Generate images using Google Gemini 3
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getImageFromCache, saveImageToCache, deleteImageFromCache } from '@/lib/blob';
import { IMAGE_STYLE_PRESETS, ImageStyleId } from '@/lib/types';
import { requireCredits, deductCredits, CREDIT_COSTS, isInsufficientCreditsError } from '@/lib/credits';

// Get the prompt template for a given style, with optional background color and scene context
function getPromptForStyle(
  description: string,
  styleId: ImageStyleId,
  backgroundColor?: string,
  sceneContext?: string
): string {
  const preset = IMAGE_STYLE_PRESETS.find((p) => p.id === styleId);

  // Build prompt prefix in order of priority:
  // 1. Scene context (location, characters, thematic elements) - highest priority
  // 2. Background color instruction
  // 3. Style-specific prompt

  let prefix = '';

  // Scene context first (sets the world/setting for the image)
  if (sceneContext && sceneContext.trim()) {
    prefix += `${sceneContext.trim()}. `;
  }

  // Add background color instruction
  if (backgroundColor) {
    prefix += `IMPORTANT: Use a solid ${backgroundColor} background color. The background MUST be ${backgroundColor}. `;
  }

  if (!preset) {
    // Fallback to default with scene context
    return `${prefix}Subject: ${description}. Style: professional, high-quality, presentation-style. Create a clean, visually striking image suitable for a presentation slide. Aspect ratio 16:9.`;
  }

  // Prepend prefix to the styled prompt
  // Note: We add "Subject: " before description to clearly separate context from subject
  const descriptionWithSubject = sceneContext ? `Subject: ${description}` : description;
  return prefix + preset.promptTemplate.replace('{description}', descriptionWithSubject);
}

// Extract image data from Gemini response
function extractImageFromResponse(data: any): string | null {
  // Gemini 3 / Gemini 2 format: candidates[].content.parts[].inlineData
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/')
  );
  return imagePart?.inlineData?.data || null;
}

export async function POST(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { description, styleId, forceRegenerate, backgroundColor, sceneContext } = await request.json();

    if (!description || typeof description !== 'string') {
      return NextResponse.json(
        { error: 'Image description is required' },
        { status: 400 }
      );
    }

    // Create a cache key that includes the style (not bg color - images persist across themes)
    // User must click "Regenerate" to get new background color
    const cacheKey = styleId && styleId !== 'none'
      ? `${styleId}:${description}`
      : description;

    // Check cache first (unless force regenerating)
    // Cached images don't cost credits
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

    // Credit check - only if we need to generate (not cached)
    const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.IMAGE_GENERATION);
    if (!creditCheck.allowed) {
      return NextResponse.json(creditCheck.error, { status: 402 });
    }

    // Build the prompt using style preset, including background color and scene context
    const fullPrompt = getPromptForStyle(description, styleId || 'none', backgroundColor, sceneContext);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Gemini API key not configured' },
        { status: 500 }
      );
    }

    // Try Gemini 3 first (best quality, 4K support, better text rendering)
    console.log('Attempting Gemini 3 image generation...');
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
                  text: fullPrompt,
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
      const imageData = extractImageFromResponse(data);

      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

        // Deduct credits after successful generation
        await deductCredits(
          session.user.id,
          CREDIT_COSTS.IMAGE_GENERATION,
          'AI image generation',
          { description, styleId, model: 'gemini-3-pro-image-preview' }
        );

        return NextResponse.json({
          url: cachedUrl,
          cached: false,
          description,
          styleId,
          model: 'gemini-3-pro-image-preview',
        });
      }
    }

    // Fallback 1: Try Imagen 3
    console.log('Gemini 3 failed, trying Imagen 3...');
    const imagenResponse = await fetch(
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

    if (imagenResponse.ok) {
      const data = await imagenResponse.json();
      const imageData = data.predictions?.[0]?.bytesBase64Encoded;

      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

        // Deduct credits after successful generation
        await deductCredits(
          session.user.id,
          CREDIT_COSTS.IMAGE_GENERATION,
          'AI image generation',
          { description, styleId, model: 'imagen-3.0-generate-001' }
        );

        return NextResponse.json({
          url: cachedUrl,
          cached: false,
          description,
          styleId,
          model: 'imagen-3.0-generate-001',
        });
      }
    }

    // Fallback 2: Try Gemini 2.0 Flash
    console.log('Imagen 3 failed, trying Gemini 2.0 Flash...');
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

    if (gemini2Response.ok) {
      const data = await gemini2Response.json();
      const imageData = extractImageFromResponse(data);

      if (imageData) {
        const imageBuffer = Buffer.from(imageData, 'base64');
        const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

        // Deduct credits after successful generation
        await deductCredits(
          session.user.id,
          CREDIT_COSTS.IMAGE_GENERATION,
          'AI image generation',
          { description, styleId, model: 'gemini-2.0-flash-exp' }
        );

        return NextResponse.json({
          url: cachedUrl,
          cached: false,
          description,
          styleId,
          model: 'gemini-2.0-flash-exp',
        });
      }
    }

    // All models failed
    const errorText = await gemini2Response.text();
    console.error('All image generation models failed. Last error:', errorText);

    return NextResponse.json({
      url: null,
      cached: false,
      description,
      styleId,
      placeholder: true,
      message: 'Image generation not available. All models failed.',
    });

  } catch (error) {
    console.error('Error generating image:', error);
    return NextResponse.json(
      { error: 'Failed to generate image', details: String(error) },
      { status: 500 }
    );
  }
}
