// ============================================
// RIFF - Presenter Mode Page
// ============================================

import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { getDeckContent, getTheme, getMetadata } from '@/lib/blob';
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
    title: `${deckId} - Riff`,
    description: 'Presenting with Riff',
  };
}

export default async function PresentPage({ params, searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

  // Redirect to sign-in if not authenticated
  if (!session?.user?.id) {
    redirect(`/auth/signin?callbackUrl=/present/${params.id}`);
  }

  const deckId = decodeURIComponent(params.id);
  const initialSlide = searchParams.slide ? parseInt(searchParams.slide, 10) : 0;

  // Load deck from database with ownership check
  const deck = await prisma.deck.findFirst({
    where: {
      id: deckId,
      ownerId: session.user.id,
    },
  });

  if (!deck) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Deck not found</h1>
          <p className="text-slate-400">The deck could not be loaded or you don't have access.</p>
        </div>
      </div>
    );
  }

  // Get content from blob storage
  const content = await getDeckContent(deck.blobUrl);

  if (!content) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-200 mb-2">Content not found</h1>
          <p className="text-slate-400">The deck content could not be loaded.</p>
        </div>
      </div>
    );
  }

  // Parse the deck
  const parsedDeck = parseSlideMarkdown(content);

  // Load theme if available (user-scoped)
  const theme = await getTheme(session.user.id, deckId);

  // Load metadata for scene context
  const metadata = await getMetadata(session.user.id, deckId);
  const sceneContext = metadata?.imageContext;

  return (
    <PresenterClient
      deck={parsedDeck}
      deckId={deckId}
      initialSlide={initialSlide}
      themeCSS={theme?.css}
      sceneContext={sceneContext}
    />
  );
}
