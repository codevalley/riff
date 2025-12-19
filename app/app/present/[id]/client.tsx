'use client';

// ============================================
// VIBE SLIDES - Presenter Client Component
// ============================================

import { Presenter } from '@/components/Presenter';
import { ParsedDeck } from '@/lib/types';

interface PresenterClientProps {
  deck: ParsedDeck;
  deckId: string;
  initialSlide: number;
  themeCSS?: string;
  isSharedView?: boolean;
}

export function PresenterClient({
  deck,
  deckId,
  initialSlide,
  themeCSS,
  isSharedView = false,
}: PresenterClientProps) {
  return (
    <Presenter
      deck={deck}
      deckId={deckId}
      initialSlide={initialSlide}
      themeCSS={themeCSS}
      isSharedView={isSharedView}
    />
  );
}
