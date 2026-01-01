// ============================================
// RIFF - Public Shared Presentation Page
// No authentication required
// ============================================

import { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
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

  // Fetch deck name and metadata for OG tags (supports both slug and legacy token)
  const deck = await prisma.deck.findFirst({
    where: {
      OR: [
        { shareSlug: token },
        { shareToken: token },
      ],
    },
    select: { name: true, publishedAt: true, publishedTheme: true },
  });

  if (!deck || !deck.publishedAt) {
    return {
      title: 'Presentation Not Found - Riff',
    };
  }

  // Extract description from published metadata (fallback to generic)
  let description = 'A presentation made with Riff';
  if (deck.publishedTheme) {
    try {
      const metadata = JSON.parse(deck.publishedTheme);
      if (metadata.description) {
        description = metadata.description;
      }
    } catch {
      // Invalid JSON, use fallback
    }
  }

  const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
  const url = `${baseUrl}/p/${token}`;

  return {
    title: `${deck.name} - Riff`,
    description,
    openGraph: {
      type: 'article',
      url,
      title: deck.name,
      description,
      siteName: 'Riff',
    },
    twitter: {
      card: 'summary_large_image',
      title: deck.name,
      description,
    },
    alternates: {
      canonical: url,
    },
  };
}

export default async function SharedPresentationPage({ params, searchParams }: PageProps) {
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
      shareSlug: true,
      shareToken: true,
    },
  });

  // 308 permanent redirect from legacy token URL to SEO-friendly slug URL
  if (deck?.shareSlug && token === deck.shareToken) {
    permanentRedirect(`/p/${deck.shareSlug}`);
  }

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
