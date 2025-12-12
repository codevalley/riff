// ============================================
// API: /api/image-cache
// Check if an image exists in the blob cache
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { getImageFromCache } from '@/lib/blob';

// Prevent static rendering (uses request.url)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const description = searchParams.get('description');
    const styleId = searchParams.get('styleId');

    if (!description) {
      return NextResponse.json(
        { error: 'Description is required' },
        { status: 400 }
      );
    }

    // Build cache key same as generate-image route
    const cacheKey = styleId && styleId !== 'none'
      ? `${styleId}:${description}`
      : description;

    const cachedUrl = await getImageFromCache(cacheKey);

    if (cachedUrl) {
      return NextResponse.json({
        url: cachedUrl,
        cached: true,
        description,
        styleId,
      });
    }

    // No cached image found
    return NextResponse.json({
      url: null,
      cached: false,
      description,
      styleId,
    });
  } catch (error) {
    console.error('Error checking image cache:', error);
    return NextResponse.json(
      { error: 'Failed to check cache', details: String(error) },
      { status: 500 }
    );
  }
}
