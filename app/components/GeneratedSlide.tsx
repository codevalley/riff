'use client';

// ============================================
// VIBE SLIDES - LLM-Generated Slide Component
// Minimal, Vercel-inspired design
// ============================================

import { useEffect, useRef, useCallback, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { Slide } from '@/lib/types';
import { hashDescription } from '@/lib/parser';
import { useStore } from '@/lib/store';

interface GeneratedSlideProps {
  slide: Slide;
  slideIndex: number;
  deckId: string;
  revealStep: number;
  themePrompt?: string;
  isPresenting?: boolean;
}

export function GeneratedSlide({
  slide,
  slideIndex,
  deckId,
  revealStep,
  themePrompt,
  isPresenting = false,
}: GeneratedSlideProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const generationAttempted = useRef<Set<string>>(new Set());

  const {
    slideHtmlCache,
    generatingSlides,
    cacheSlideHtml,
    setGeneratingSlide,
    customSlideSystemPrompt,
  } = useStore();

  // Convert slide to markdown for API submission
  const slideMarkdown = useMemo(() => {
    const lines: string[] = [];
    let lastReveal = 0;

    for (const element of slide.elements) {
      while (element.revealOrder > lastReveal) {
        lines.push('**pause**');
        lastReveal++;
      }

      switch (element.type) {
        case 'title':
          lines.push(`# ${element.content}`);
          break;
        case 'subtitle':
          lines.push(`## ${element.content}`);
          break;
        case 'text':
          lines.push(`### ${element.content}`);
          break;
        case 'image':
          lines.push(`[image: ${element.content}]`);
          break;
        case 'code':
          lines.push(`\`\`\`${element.metadata?.language || ''}`);
          lines.push(element.content);
          lines.push('```');
          break;
        case 'quote':
          lines.push(`> ${element.content}`);
          break;
      }
    }

    if (slide.speakerNotes) {
      lines.push('');
      lines.push(`> ${slide.speakerNotes}`);
    }

    return lines.join('\n');
  }, [slide]);

  // Generate cache key
  const cacheKey = useMemo(() => {
    const contentHash = hashDescription(slideMarkdown + (themePrompt || ''));
    return `${deckId}-${slideIndex}-${contentHash}`;
  }, [deckId, slideIndex, slideMarkdown, themePrompt]);

  // Get cached HTML
  const cachedHtml = slideHtmlCache[cacheKey];
  const isGenerating = generatingSlides.has(cacheKey);

  // Generate slide HTML
  const generateSlide = useCallback(async (forceRegenerate = false) => {
    // Skip if already cached and not forcing regeneration
    if (!forceRegenerate && cachedHtml) {
      return;
    }

    // Skip if already generating
    if (isGenerating) {
      return;
    }

    // Skip if we already attempted this generation (prevents duplicate calls)
    if (!forceRegenerate && generationAttempted.current.has(cacheKey)) {
      return;
    }

    generationAttempted.current.add(cacheKey);
    setGeneratingSlide(cacheKey, true);

    try {
      // First, try to get from blob cache
      if (!forceRegenerate) {
        const contentHash = hashDescription(slideMarkdown + (themePrompt || ''));
        const cacheResponse = await fetch(
          `/api/slide-cache?deckId=${encodeURIComponent(deckId)}&slideIndex=${slideIndex}&contentHash=${contentHash}`
        );

        if (cacheResponse.ok) {
          const cacheData = await cacheResponse.json();
          if (cacheData.html) {
            cacheSlideHtml(cacheKey, cacheData.html);
            setGeneratingSlide(cacheKey, false);
            return;
          }
        }
      }

      // Generate new HTML via API
      const response = await fetch('/api/generate-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slideContent: slideMarkdown,
          themePrompt,
          slideIndex,
          deckId,
          customSystemPrompt: customSlideSystemPrompt,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate slide');
      }

      const data = await response.json();

      // Store in memory cache
      cacheSlideHtml(cacheKey, data.html);

      // Save to blob cache in background
      const contentHash = hashDescription(slideMarkdown + (themePrompt || ''));
      fetch('/api/slide-cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          slideIndex,
          contentHash,
          html: data.html,
        }),
      }).catch(console.error);

    } catch (err) {
      console.error('Error generating slide:', err);
      // Remove from attempted so user can retry
      generationAttempted.current.delete(cacheKey);
    } finally {
      setGeneratingSlide(cacheKey, false);
    }
  }, [cacheKey, cachedHtml, isGenerating, slideMarkdown, themePrompt, deckId, slideIndex, cacheSlideHtml, setGeneratingSlide, customSlideSystemPrompt]);

  // Trigger generation when slide becomes visible and isn't cached
  useEffect(() => {
    if (!cachedHtml && !isGenerating) {
      generateSlide();
    }
  }, [cachedHtml, isGenerating, generateSlide]);

  // Handle reveal animations via class toggling
  useEffect(() => {
    if (!containerRef.current || !cachedHtml) return;

    const revealElements = containerRef.current.querySelectorAll('[class*="reveal-"]');
    revealElements.forEach((el) => {
      const classNames = el.className.split(' ');
      const revealClass = classNames.find((c) => c.match(/^reveal-\d+$/));

      if (revealClass) {
        const revealIndex = parseInt(revealClass.replace('reveal-', ''), 10);
        if (revealIndex <= revealStep) {
          el.classList.add('visible');
        } else {
          el.classList.remove('visible');
        }
      }
    });
  }, [revealStep, cachedHtml]);

  // Loading state
  if (isGenerating || (!cachedHtml && !generationAttempted.current.has(cacheKey))) {
    return (
      <div
        className={`
          relative w-full h-full
          flex flex-col items-center justify-center gap-4
          bg-background text-text-tertiary
          ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
        `}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <Loader2 className="w-8 h-8 animate-spin text-text-secondary" />
          <p className="text-sm text-text-secondary">Generating slide {slideIndex + 1}...</p>
        </motion.div>
      </div>
    );
  }

  // Error state (no cached HTML and generation was attempted)
  if (!cachedHtml) {
    return (
      <div
        className={`
          relative w-full h-full
          flex flex-col items-center justify-center gap-4
          bg-background text-text-tertiary
          ${isPresenting ? 'min-h-screen' : 'min-h-[400px] rounded-lg'}
        `}
      >
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex flex-col items-center gap-3"
        >
          <AlertCircle className="w-8 h-8 text-error" />
          <p className="text-sm text-error">Generation failed</p>
          <button
            onClick={() => {
              generationAttempted.current.delete(cacheKey);
              generateSlide(true);
            }}
            className="flex items-center gap-2 px-3 py-1.5 bg-surface hover:bg-surface-hover border border-border rounded-md text-sm text-text-secondary hover:text-text-primary transition-colors"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Retry
          </button>
        </motion.div>
      </div>
    );
  }

  // Render generated HTML
  return (
    <div
      ref={containerRef}
      className={`
        relative w-full h-full overflow-hidden
        ${isPresenting ? '' : 'rounded-lg'}
      `}
    >
      {/* Regenerate button (only in editor mode) */}
      {!isPresenting && (
        <button
          onClick={() => {
            generationAttempted.current.delete(cacheKey);
            generateSlide(true);
          }}
          className="absolute top-3 right-3 z-50 p-1.5 bg-surface/90 hover:bg-surface-hover border border-border rounded-md transition-all opacity-0 hover:opacity-100"
          title="Regenerate slide"
        >
          <RefreshCw className="w-3.5 h-3.5 text-text-tertiary" />
        </button>
      )}

      {/* Slide content via dangerouslySetInnerHTML */}
      <div
        className="w-full h-full"
        dangerouslySetInnerHTML={{ __html: cachedHtml }}
      />

      {/* Slide number indicator */}
      <div className="absolute bottom-3 right-3 text-white/20 text-xs font-mono z-50">
        {slideIndex + 1}
      </div>
    </div>
  );
}
