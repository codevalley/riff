// ============================================
// RIFF - oEmbed Endpoint
// Implements oEmbed spec for rich embeds
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface OEmbedResponse {
  type: 'rich';
  version: '1.0';
  title: string;
  provider_name: string;
  provider_url: string;
  html: string;
  width: number;
  height: number;
  thumbnail_url?: string;
  thumbnail_width?: number;
  thumbnail_height?: number;
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const url = searchParams.get('url');
  const format = searchParams.get('format') || 'json';
  const maxwidth = parseInt(searchParams.get('maxwidth') || '640', 10);
  const maxheight = parseInt(searchParams.get('maxheight') || '360', 10);

  // Validate format
  if (format !== 'json') {
    return NextResponse.json(
      { error: 'Only JSON format is supported' },
      { status: 501 }
    );
  }

  // Validate URL
  if (!url) {
    return NextResponse.json(
      { error: 'Missing required parameter: url' },
      { status: 400 }
    );
  }

  // Parse token from URL
  // Supports: /p/{token}, riff.im/p/{token}, www.riff.im/p/{token}
  const tokenMatch = url.match(/\/p\/([a-zA-Z0-9_-]+)/);
  if (!tokenMatch) {
    return NextResponse.json(
      { error: 'Invalid URL format. Expected: https://riff.im/p/{token}' },
      { status: 400 }
    );
  }

  const token = tokenMatch[1];

  try {
    // Fetch deck
    const deck = await prisma.deck.findUnique({
      where: { shareToken: token },
      select: {
        name: true,
        publishedAt: true,
      },
    });

    if (!deck || !deck.publishedAt) {
      return NextResponse.json(
        { error: 'Presentation not found or not published' },
        { status: 404 }
      );
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';

    // Calculate dimensions maintaining 16:9 aspect ratio
    let width = Math.min(maxwidth, 960);
    let height = Math.round(width * 9 / 16);

    if (height > maxheight) {
      height = maxheight;
      width = Math.round(height * 16 / 9);
    }

    const embedUrl = `${baseUrl}/embed/${token}`;
    const thumbnailUrl = `${baseUrl}/p/${token}/opengraph-image`;

    const response: OEmbedResponse = {
      type: 'rich',
      version: '1.0',
      title: deck.name,
      provider_name: 'Riff',
      provider_url: 'https://www.riff.im',
      html: `<iframe src="${embedUrl}" width="${width}" height="${height}" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe>`,
      width,
      height,
      thumbnail_url: thumbnailUrl,
      thumbnail_width: 1200,
      thumbnail_height: 630,
    };

    return NextResponse.json(response, {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
      },
    });
  } catch (error) {
    console.error('oEmbed error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
