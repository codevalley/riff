// ============================================
// API: /api/sweep-generate
// Batch image generation with queue persistence
// Uses Server-Sent Events for real-time progress
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { getImageFromCache, saveImageToCache, deleteImageFromCache, getMetadata, saveMetadata } from '@/lib/blob';
import { IMAGE_STYLE_PRESETS, ImageStyleId, ImageGenerationQueue, ImageQueueItem, DeckMetadataV3 } from '@/lib/types';
import { requireCredits, deductCredits, CREDIT_COSTS, getBalance } from '@/lib/credits';
import { nanoid } from 'nanoid';

// Build prompt with scene context and style
function buildPrompt(
  description: string,
  styleId: ImageStyleId,
  sceneContext?: string
): string {
  const preset = IMAGE_STYLE_PRESETS.find((p) => p.id === styleId);

  let prefix = '';
  if (sceneContext && sceneContext.trim()) {
    prefix += `${sceneContext.trim()}. `;
  }

  if (!preset) {
    return `${prefix}Subject: ${description}. Style: professional, high-quality, presentation-style. Create a clean, visually striking image suitable for a presentation slide. Aspect ratio 16:9.`;
  }

  const descriptionWithSubject = sceneContext ? `Subject: ${description}` : description;
  return prefix + preset.promptTemplate.replace('{description}', descriptionWithSubject);
}

// Extract image data from Gemini response
function extractImageFromResponse(data: any): string | null {
  const imagePart = data.candidates?.[0]?.content?.parts?.find(
    (part: any) => part.inlineData?.mimeType?.startsWith('image/')
  );
  return imagePart?.inlineData?.data || null;
}

// Generate a single image using the cascade of models
async function generateSingleImage(
  prompt: string,
  apiKey: string
): Promise<{ imageData: string | null; model: string | null }> {
  // Try Gemini 3 first
  const gemini3Response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image-preview:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { responseModalities: ['image'] },
      }),
    }
  );

  if (gemini3Response.ok) {
    const data = await gemini3Response.json();
    const imageData = extractImageFromResponse(data);
    if (imageData) return { imageData, model: 'gemini-3-pro-image-preview' };
  }

  // Fallback to Imagen 3
  const imagenResponse = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/imagen-3.0-generate-001:predict?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        instances: [{ prompt }],
        parameters: { sampleCount: 1, aspectRatio: '16:9', safetyFilterLevel: 'block_few' },
      }),
    }
  );

  if (imagenResponse.ok) {
    const data = await imagenResponse.json();
    const imageData = data.predictions?.[0]?.bytesBase64Encoded;
    if (imageData) return { imageData, model: 'imagen-3.0-generate-001' };
  }

  // Fallback to Gemini 2.0 Flash
  const gemini2Response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `Generate an image: ${prompt}` }] }],
        generationConfig: { responseModalities: ['image', 'text'] },
      }),
    }
  );

  if (gemini2Response.ok) {
    const data = await gemini2Response.json();
    const imageData = extractImageFromResponse(data);
    if (imageData) return { imageData, model: 'gemini-2.0-flash-exp' };
  }

  return { imageData: null, model: null };
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { deckId, items, contextUsed, styleId } = await request.json() as {
      deckId: string;
      items: Array<{
        description: string;
        modifiedPrompt?: string;
        slideIndex: number;
      }>;
      contextUsed: string;
      styleId?: ImageStyleId;
    };

    if (!deckId || !items || items.length === 0) {
      return NextResponse.json(
        { error: 'deckId and items are required' },
        { status: 400 }
      );
    }

    // Calculate total credits needed
    const totalCredits = items.length * CREDIT_COSTS.IMAGE_GENERATION;

    // Check if user has enough credits
    const { balance: userCredits } = await getBalance(session.user.id);
    if (userCredits < totalCredits) {
      return NextResponse.json(
        { error: 'Insufficient credits', required: totalCredits, available: userCredits },
        { status: 402 }
      );
    }

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'Image generation API key not configured' },
        { status: 500 }
      );
    }

    // Create queue
    const queueId = nanoid(10);
    const queueItems: ImageQueueItem[] = items.map((item, idx) => ({
      id: `${queueId}-${idx}`,
      description: item.description,
      modifiedPrompt: item.modifiedPrompt,
      status: 'pending' as const,
      slideIndex: item.slideIndex,
    }));

    const queue: ImageGenerationQueue = {
      id: queueId,
      deckId,
      items: queueItems,
      contextUsed,
      status: 'running',
      progress: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // Save initial queue state to metadata
    const metadata = await getMetadata(session.user.id, deckId) || { v: 3 } as DeckMetadataV3;
    metadata.imageQueue = queue;
    await saveMetadata(session.user.id, deckId, metadata);

    // Process images sequentially
    const results: Array<{
      description: string;
      slideIndex: number;
      url: string | null;
      error?: string;
    }> = [];

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const queueItem = queue.items[i];

      // Update status to generating
      queueItem.status = 'generating';
      queue.progress = Math.round((i / items.length) * 100);
      queue.updatedAt = new Date().toISOString();
      metadata.imageQueue = queue;
      await saveMetadata(session.user.id, deckId, metadata);

      try {
        // Use modified prompt if available, otherwise use original description
        const promptText = item.modifiedPrompt || item.description;
        const fullPrompt = buildPrompt(promptText, styleId || 'none', contextUsed);

        // Create cache key
        const cacheKey = styleId && styleId !== 'none'
          ? `${styleId}:${item.description}`
          : item.description;

        // Generate image
        const { imageData, model } = await generateSingleImage(fullPrompt, apiKey);

        if (imageData) {
          // Save to cache
          const imageBuffer = Buffer.from(imageData, 'base64');
          const cachedUrl = await saveImageToCache(cacheKey, imageBuffer);

          // Deduct credits
          await deductCredits(
            session.user.id,
            CREDIT_COSTS.IMAGE_GENERATION,
            'Sweep image generation',
            { description: item.description, styleId, model }
          );

          queueItem.status = 'completed';
          queueItem.resultUrl = cachedUrl;

          results.push({
            description: item.description,
            slideIndex: item.slideIndex,
            url: cachedUrl,
          });
        } else {
          queueItem.status = 'failed';
          queueItem.error = 'All image generation models failed';

          results.push({
            description: item.description,
            slideIndex: item.slideIndex,
            url: null,
            error: 'Generation failed',
          });
        }
      } catch (err) {
        queueItem.status = 'failed';
        queueItem.error = String(err);

        results.push({
          description: item.description,
          slideIndex: item.slideIndex,
          url: null,
          error: String(err),
        });
      }

      // Update queue progress
      queue.progress = Math.round(((i + 1) / items.length) * 100);
      queue.updatedAt = new Date().toISOString();
      metadata.imageQueue = queue;
      await saveMetadata(session.user.id, deckId, metadata);
    }

    // Mark queue as completed
    queue.status = 'completed';
    queue.progress = 100;
    queue.updatedAt = new Date().toISOString();
    metadata.imageQueue = queue;
    await saveMetadata(session.user.id, deckId, metadata);

    const successCount = results.filter(r => r.url).length;
    const failCount = results.filter(r => !r.url).length;

    return NextResponse.json({
      queueId,
      results,
      summary: {
        total: items.length,
        success: successCount,
        failed: failCount,
      },
    });

  } catch (error) {
    console.error('Error in sweep generation:', error);
    return NextResponse.json(
      { error: 'Failed to process sweep generation', details: String(error) },
      { status: 500 }
    );
  }
}

// GET endpoint to check queue status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return NextResponse.json(
        { error: 'deckId is required' },
        { status: 400 }
      );
    }

    const metadata = await getMetadata(session.user.id, deckId);
    const queue = metadata?.imageQueue;

    if (!queue) {
      return NextResponse.json({ queue: null });
    }

    return NextResponse.json({ queue });

  } catch (error) {
    console.error('Error getting queue status:', error);
    return NextResponse.json(
      { error: 'Failed to get queue status', details: String(error) },
      { status: 500 }
    );
  }
}

// DELETE endpoint to cancel/clear queue
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const deckId = searchParams.get('deckId');

    if (!deckId) {
      return NextResponse.json(
        { error: 'deckId is required' },
        { status: 400 }
      );
    }

    const metadata = await getMetadata(session.user.id, deckId);
    if (metadata?.imageQueue) {
      delete metadata.imageQueue;
      await saveMetadata(session.user.id, deckId, metadata);
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error clearing queue:', error);
    return NextResponse.json(
      { error: 'Failed to clear queue', details: String(error) },
      { status: 500 }
    );
  }
}
