// ============================================
// RIFF - Public Shared Presentation Page
// No authentication required
// ============================================

import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { prisma } from '@/lib/prisma';
import { parseSlideMarkdown } from '@/lib/parser';
import { PresenterClient } from '@/app/present/[id]/client';
import { RiffBadge } from '@/components/RiffBadge';
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

  // Fetch deck name for metadata
  const deck = await prisma.deck.findUnique({
    where: { shareToken: token },
    select: { name: true, publishedAt: true },
  });

  if (!deck || !deck.publishedAt) {
    return {
      title: 'Presentation Not Found - Riff',
    };
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
  const url = `${baseUrl}/p/${token}`;

  return {
    title: `${deck.name} - Riff`,
    description: `View "${deck.name}" - a presentation shared on Riff`,
    openGraph: {
      type: 'article',
      url,
      title: deck.name,
      description: `View "${deck.name}" - a presentation shared on Riff`,
      siteName: 'Riff',
    },
    twitter: {
      card: 'summary_large_image',
      title: deck.name,
      description: `View "${deck.name}" on Riff`,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function SharedPresentationPage({ params, searchParams }: PageProps) {
  const token = params.token;
  const initialSlide = searchParams.slide ? parseInt(searchParams.slide, 10) : 0;

  // Fetch published deck by share token (no auth required)
  const deck = await prisma.deck.findUnique({
    where: { shareToken: token },
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
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Presentation not found</h1>
          <p className="text-slate-400">
            This presentation doesn't exist or hasn't been published yet.
          </p>
        </div>
      </div>
    );
  }

  // Parse the published content
  const parsedDeck = parseSlideMarkdown(deck.publishedContent);

  // Parse theme and images from published metadata (v3 format)
  let themeCSS: string | undefined;

  if (deck.publishedTheme) {
    try {
      const metadata = JSON.parse(deck.publishedTheme);
      // v3: theme is nested under metadata.theme
      themeCSS = metadata.theme?.css;
      // v3: merge images into parsed deck (same as present mode)
      if (metadata.images) {
        parsedDeck.imageManifest = metadata.images;
      }
    } catch {
      // Invalid metadata JSON, ignore
    }
  }

  return (
    <>
      <ViewTracker token={token} />
      <PresenterClient
        deck={parsedDeck}
        deckId={deck.id}
        initialSlide={initialSlide}
        themeCSS={themeCSS}
        isSharedView={true}
      />
      <RiffBadge />
    </>
  );
}
