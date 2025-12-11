// ============================================
// VIBE SLIDES - Presenter Mode Page
// ============================================

import { Metadata } from 'next';
import { getDeck, getTheme } from '@/lib/blob';
import { parseSlideMarkdown } from '@/lib/parser';
import { PresenterClient } from './client';

// Disable caching - always fetch fresh content
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface PageProps {
  params: { id: string };
  searchParams: { slide?: string };
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const deckId = decodeURIComponent(params.id);
  return {
    title: `${deckId} - Vibe Slides`,
    description: 'Presenting with Vibe Slides',
  };
}

export default async function PresentPage({ params, searchParams }: PageProps) {
  const deckId = decodeURIComponent(params.id);
  const initialSlide = searchParams.slide ? parseInt(searchParams.slide, 10) : 0;

  // Load deck content
  const deckData = await getDeck(deckId);

  if (!deckData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Deck not found</h1>
          <p className="text-slate-400">The deck "{deckId}" could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Parse the deck
  const parsedDeck = parseSlideMarkdown(deckData.content);

  // Load theme if available
  const theme = await getTheme(deckId);

  return (
    <PresenterClient
      deck={parsedDeck}
      deckId={deckId}
      initialSlide={initialSlide}
      themeCSS={theme?.css}
      themePrompt={theme?.prompt}
    />
  );
}
