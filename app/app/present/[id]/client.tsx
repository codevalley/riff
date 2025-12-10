'use client';

// ============================================
// VIBE SLIDES - Presenter Client Component
// ============================================

import { Presenter } from '@/components/Presenter';
import { ParsedDeck } from '@/lib/types';

interface PresenterClientProps {
  deck: ParsedDeck;
  initialSlide: number;
  themeCSS?: string;
}

export function PresenterClient({ deck, initialSlide, themeCSS }: PresenterClientProps) {
  return (
    <Presenter
      deck={deck}
      initialSlide={initialSlide}
      themeCSS={themeCSS}
    />
  );
}
