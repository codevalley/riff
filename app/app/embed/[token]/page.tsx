// ============================================
// RIFF - Embeddable Presentation View
// Optimized for iframe embedding
// ============================================

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseSlideMarkdown } from '@/lib/parser';
import { EmbedClient } from '@/components/EmbedClient';
import { ImageUrlHydrator } from '@/components/ImageUrlHydrator';
import { ViewTracker } from '@/components/ViewTracker';

// Disable caching - always fetch fresh published content
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { token: string };
  searchParams: { slide?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const token = params.token;

  const deck = await prisma.deck.findFirst({
    where: {
      OR: [
        { shareSlug: token },
        { shareToken: token },
      ],
    },
    select: { name: true, publishedAt: true },
  });

  if (!deck || !deck.publishedAt) {
    return {
      title: 'Presentation Not Found',
      robots: 'noindex, nofollow',
    };
  }

  return {
    title: `${deck.name} - Riff`,
    robots: 'noindex, nofollow', // Embeds shouldn't be indexed
  };
}

export default async function EmbedPresentationPage({ params, searchParams }: PageProps) {
  const token = params.token;
  const initialSlide = searchParams.slide ? parseInt(searchParams.slide, 10) : 0;

  // Fetch published deck by slug or token (no auth required)
  const deck = await prisma.deck.findFirst({
    where: {
      OR: [
        { shareSlug: token },
        { shareToken: token },
      ],
    },
    select: {
      id: true,
      name: true,
      publishedContent: true,
      publishedTheme: true,
      publishedAt: true,
    },
  });

  // Check if deck exists and is published
  if (!deck || !deck.publishedContent || !deck.publishedAt) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center p-8">
          <h1 className="text-xl font-semibold text-slate-200 mb-2">Presentation not found</h1>
          <p className="text-sm text-slate-400">
            This presentation doesn't exist or hasn't been published.
          </p>
        </div>
      </div>
    );
  }

  // Parse the published content
  const parsedDeck = parseSlideMarkdown(deck.publishedContent);

  // Parse theme if available (v3: nested under theme.theme)
  let themeCSS: string | undefined;
  let imageUrls: Record<string, string> = {};

  if (deck.publishedTheme) {
    try {
      const metadata = JSON.parse(deck.publishedTheme);
      // v3 structure: { v: 3, theme: { css: "..." }, images: {...} }
      themeCSS = metadata.theme?.css;
      // Also hydrate image manifest for the parsed deck
      if (metadata.images) {
        parsedDeck.imageManifest = metadata.images;
      }
      imageUrls = metadata.imageUrls || {};
    } catch {
      // Invalid theme JSON, ignore
    }
  }

  return (
    <>
      <ViewTracker token={token} />
      <ImageUrlHydrator imageUrls={imageUrls} />
      <EmbedClient
        deck={parsedDeck}
        initialSlide={initialSlide}
        themeCSS={themeCSS}
      />
    </>
  );
}
