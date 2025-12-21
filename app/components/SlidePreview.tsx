'use client';

// ============================================
// VIBE SLIDES - Slide Preview Component
// Minimal, Vercel-inspired design with Add/Revamp
// ============================================

import React, { useEffect, useState, useCallback, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  Play,
  Plus,
  Wand2,
  Loader2,
  X,
  Check,
  Sparkles,
  Trash2,
  Images,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { SlideRenderer } from './SlideRenderer';
import { ThemeCustomizer } from './ThemeCustomizer';
import { AddSlideDialog } from './AddSlideDialog';
import { RevampSlideDialog } from './RevampSlideDialog';
import { SweepGenerateDialog } from './SweepGenerateDialog';
import {
  countReveals,
  parseSlideMarkdown,
  stripFrontmatter,
} from '@/lib/parser';
import { ImageSlot, IMAGE_STYLE_PRESETS } from '@/lib/types';
import { useOnboarding } from '@/hooks/useOnboarding';

interface SlidePreviewProps {
  deckId: string;
  onSave?: () => Promise<void>;
  onGenerateTheme?: (prompt: string, systemPrompt?: string) => Promise<void>;
  onResetTheme?: () => void;
  isGeneratingTheme?: boolean;
  onImageChange?: (description: string, slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (description: string, slot: ImageSlot) => void;
  sceneContext?: string;
  onSceneContextChange?: (context: string) => void;
}

// ============================================
// Helper functions for markdown manipulation
// v3: Simplified - no frontmatter handling needed
// Frontmatter is now stored in separate metadata JSON
// ============================================

/**
 * Split deck content into slides array
 * Strips any legacy frontmatter (for migration) but doesn't preserve it
 */
function splitDeckContent(content: string): string[] {
  // Strip any embedded frontmatter (migration from v2)
  const body = stripFrontmatter(content);

  // Split on --- separator
  let slides = body.split(/\n---\n/).filter(s => s.trim());

  // Handle case where first slide might start with ---
  if (body.trimStart().startsWith('---')) {
    const trimmedBody = body.trimStart().replace(/^---\n?/, '');
    slides = trimmedBody.split(/\n---\n/).filter(s => s.trim());
  }

  return slides;
}

/**
 * Join slides back into deck content
 * v3: Just joins slides, no frontmatter (stored separately)
 */
function joinDeckContent(slides: string[]): string {
  return slides.map(s => s.trim()).join('\n\n---\n\n');
}

function getSlideMarkdown(content: string, slideIndex: number): string {
  const slides = splitDeckContent(content);
  return slides[slideIndex] || '';
}

function replaceSlideMarkdown(content: string, slideIndex: number, newSlide: string): string {
  const slides = splitDeckContent(content);
  if (slideIndex >= 0 && slideIndex < slides.length) {
    slides[slideIndex] = newSlide.trim();
  }
  return joinDeckContent(slides);
}

function insertSlideAfter(content: string, afterIndex: number, newSlide: string): string {
  const slides = splitDeckContent(content);
  slides.splice(afterIndex + 1, 0, newSlide.trim());
  return joinDeckContent(slides);
}

function removeSlideAt(content: string, slideIndex: number): string {
  const slides = splitDeckContent(content);
  if (slideIndex >= 0 && slideIndex < slides.length) {
    slides.splice(slideIndex, 1);
  }
  return joinDeckContent(slides);
}

// ============================================
// Main Component
// ============================================

export function SlidePreview({
  deckId,
  onSave,
  onGenerateTheme,
  onResetTheme,
  isGeneratingTheme = false,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  onSceneContextChange,
}: SlidePreviewProps) {
  const {
    parsedDeck,
    presentation,
    themePrompt,
    currentTheme,
    currentDeckContent,
    updateDeckContent,
    setParsedDeck,
    nextSlide,
    prevSlide,
    goToSlide,
    toggleSpeakerNotes,
    imageStyle,
    setImageStyle,
  } = useStore();

  // Onboarding
  const { recordFeatureUse } = useOnboarding();

  // Navigator ref for auto-scrolling
  const navigatorRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Add Slide state
  const [showAddSlideDialog, setShowAddSlideDialog] = useState(false);
  const [isAddingSlide, setIsAddingSlide] = useState(false);
  const [addSlidePosition, setAddSlidePosition] = useState(0);

  // Added slide review state (for keep/revamp/discard flow)
  const [addedSlideReview, setAddedSlideReview] = useState<{
    slideIndex: number;
    slideContent: string;
  } | null>(null);

  // Revamp Slide state
  const [showRevampDialog, setShowRevampDialog] = useState(false);
  const [revampSlideIndex, setRevampSlideIndex] = useState(0);
  const [isRevamping, setIsRevamping] = useState(false);

  // Revamp comparison state
  const [revampComparison, setRevampComparison] = useState<{
    slideIndex: number;
    oldContent: string;
    newContent: string;
    showNew: boolean;
  } | null>(null);

  // Hover state for thumbnails
  const [hoveredThumbnail, setHoveredThumbnail] = useState<number | null>(null);

  // Editable slide counter state
  const [isEditingSlideNumber, setIsEditingSlideNumber] = useState(false);
  const [slideNumberInput, setSlideNumberInput] = useState('');
  const slideInputRef = useRef<HTMLInputElement>(null);

  // Sweep generate state
  const [showSweepDialog, setShowSweepDialog] = useState(false);
  const [userCredits, setUserCredits] = useState(0);

  const currentSlide = parsedDeck?.slides[presentation.currentSlide];
  const totalSlides = parsedDeck?.slides.length || 0;
  const currentReveals = currentSlide ? countReveals(currentSlide) : 1;

  // Auto-scroll navigator when slide changes
  useEffect(() => {
    const slideElement = slideRefs.current.get(presentation.currentSlide);
    if (slideElement && navigatorRef.current) {
      const container = navigatorRef.current;
      const slideRect = slideElement.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      const isOutOfView =
        slideRect.left < containerRect.left ||
        slideRect.right > containerRect.right;

      if (isOutOfView) {
        slideElement.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [presentation.currentSlide]);

  // Trigger image tour when slide with images is displayed
  useEffect(() => {
    if (currentSlide?.imageDescriptions && currentSlide.imageDescriptions.length > 0) {
      recordFeatureUse('image-placeholder-click');
    }
  }, [currentSlide?.imageDescriptions, recordFeatureUse]);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLInputElement
      ) {
        return;
      }

      switch (e.key) {
        case 'ArrowRight':
        case ' ':
        case 'Enter':
          e.preventDefault();
          nextSlide();
          break;
        case 'ArrowLeft':
        case 'Backspace':
          e.preventDefault();
          prevSlide();
          break;
        case 'n':
          if (e.metaKey || e.ctrlKey) {
            e.preventDefault();
            toggleSpeakerNotes();
          }
          break;
        case 'Escape':
          if (revampComparison) {
            setRevampComparison(null);
          }
          if (addedSlideReview) {
            // Keep the slide on Escape
            setAddedSlideReview(null);
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [nextSlide, prevSlide, toggleSpeakerNotes, revampComparison, addedSlideReview]);

  // ============================================
  // Add Slide handlers
  // ============================================

  const handleOpenAddSlide = useCallback((position: number) => {
    setAddSlidePosition(position);
    setShowAddSlideDialog(true);
  }, []);

  const handleAddSlide = useCallback(async (description: string) => {
    if (!currentDeckContent) return;

    setIsAddingSlide(true);
    setShowAddSlideDialog(false);

    // Navigate to show loading on the insertion point
    goToSlide(addSlidePosition);

    try {
      const beforeSlide = getSlideMarkdown(currentDeckContent, addSlidePosition);
      const afterSlide = getSlideMarkdown(currentDeckContent, addSlidePosition + 1);

      const response = await fetch('/api/add-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          insertAfterSlide: addSlidePosition,
          userDescription: description,
          deckContext: {
            title: parsedDeck?.metadata?.title || 'Untitled',
            slideCount: totalSlides,
          },
          surroundingSlides: {
            before: beforeSlide || undefined,
            after: afterSlide || undefined,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate slide');
      }

      const newContent = insertSlideAfter(currentDeckContent, addSlidePosition, data.slideContent);
      updateDeckContent(newContent);

      const parsed = parseSlideMarkdown(newContent);
      setParsedDeck(parsed);

      // Navigate to the new slide
      const newSlideIndex = addSlidePosition + 1;
      goToSlide(newSlideIndex);

      // Auto-save
      await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newContent }),
      });

      // Enter review mode for the new slide
      setAddedSlideReview({
        slideIndex: newSlideIndex,
        slideContent: data.slideContent,
      });
    } catch (err) {
      console.error('Error adding slide:', err);
    } finally {
      setIsAddingSlide(false);
    }
  }, [currentDeckContent, addSlidePosition, deckId, parsedDeck?.metadata?.title, totalSlides, updateDeckContent, setParsedDeck, goToSlide]);

  // Keep the added slide (just close review)
  const handleKeepAddedSlide = useCallback(() => {
    setAddedSlideReview(null);
  }, []);

  // Discard the added slide
  const handleDiscardAddedSlide = useCallback(async () => {
    if (!addedSlideReview || !currentDeckContent) return;

    const newContent = removeSlideAt(currentDeckContent, addedSlideReview.slideIndex);
    updateDeckContent(newContent);

    const parsed = parseSlideMarkdown(newContent);
    setParsedDeck(parsed);

    // Navigate to previous slide
    goToSlide(Math.max(0, addedSlideReview.slideIndex - 1));

    // Auto-save
    await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });

    setAddedSlideReview(null);
  }, [addedSlideReview, currentDeckContent, deckId, updateDeckContent, setParsedDeck, goToSlide]);

  // Revamp the added slide
  const handleRevampAddedSlide = useCallback(() => {
    if (!addedSlideReview) return;

    // Keep the slide and open revamp dialog
    setRevampSlideIndex(addedSlideReview.slideIndex);
    setAddedSlideReview(null);
    setShowRevampDialog(true);
  }, [addedSlideReview]);

  // ============================================
  // Revamp Slide handlers
  // ============================================

  const handleOpenRevamp = useCallback((slideIndex: number) => {
    setRevampSlideIndex(slideIndex);
    setShowRevampDialog(true);
  }, []);

  const handleRevampSlide = useCallback(async (instructions: string) => {
    if (!currentDeckContent) return;

    setIsRevamping(true);
    setShowRevampDialog(false);

    goToSlide(revampSlideIndex);

    try {
      const currentSlideMarkdown = getSlideMarkdown(currentDeckContent, revampSlideIndex);

      const response = await fetch('/api/revamp-slide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId,
          slideIndex: revampSlideIndex,
          currentSlide: currentSlideMarkdown,
          userInstructions: instructions,
          deckContext: {
            title: parsedDeck?.metadata?.title || 'Untitled',
            theme: themePrompt,
            slideCount: totalSlides,
          },
        }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to revamp slide');
      }

      setRevampComparison({
        slideIndex: revampSlideIndex,
        oldContent: currentSlideMarkdown,
        newContent: data.slideContent,
        showNew: true,
      });
    } catch (err) {
      console.error('Error revamping slide:', err);
    } finally {
      setIsRevamping(false);
    }
  }, [currentDeckContent, revampSlideIndex, deckId, parsedDeck?.metadata?.title, themePrompt, totalSlides, goToSlide]);

  const handleApplyRevamp = useCallback(async () => {
    if (!revampComparison || !currentDeckContent) return;

    const newContent = replaceSlideMarkdown(
      currentDeckContent,
      revampComparison.slideIndex,
      revampComparison.newContent
    );
    updateDeckContent(newContent);

    const parsed = parseSlideMarkdown(newContent);
    setParsedDeck(parsed);

    await fetch(`/api/decks/${encodeURIComponent(deckId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: newContent }),
    });

    setRevampComparison(null);
  }, [revampComparison, currentDeckContent, deckId, updateDeckContent, setParsedDeck]);

  const handleDiscardRevamp = useCallback(() => {
    setRevampComparison(null);
  }, []);

  // ============================================
  // Sweep image generation handlers
  // ============================================

  // Extract all images from the deck
  const extractDeckImages = useCallback(() => {
    if (!parsedDeck) return [];

    const images: Array<{
      description: string;
      slideIndex: number;
      hasExistingImage: boolean;
      existingUrl?: string;
    }> = [];

    parsedDeck.slides.forEach((slide, slideIndex) => {
      // Use imageDescriptions from parsed slide
      if (slide.imageDescriptions) {
        slide.imageDescriptions.forEach((description) => {
          // Check if image has a real URL in any slot
          const manifestEntry = parsedDeck.imageManifest?.[description];
          const activeSlot = manifestEntry?.active || 'generated';
          const existingUrl = manifestEntry?.[activeSlot];
          const hasExisting = !!(
            manifestEntry?.generated ||
            manifestEntry?.uploaded ||
            manifestEntry?.restyled
          );
          images.push({
            description,
            slideIndex,
            hasExistingImage: hasExisting,
            existingUrl,
          });
        });
      }
    });

    return images;
  }, [parsedDeck]);

  // Extract deck images with URLs for "From Library" picker in ImagePlaceholder
  const deckImagesForLibrary = useMemo(() => {
    if (!parsedDeck?.imageManifest) return [];

    const images: Array<{
      description: string;
      url: string;
      slideIndex?: number;
    }> = [];

    // Build a map of which slide each image description belongs to
    const descriptionToSlide = new Map<string, number>();
    parsedDeck.slides.forEach((slide, slideIndex) => {
      slide.imageDescriptions?.forEach((desc) => {
        descriptionToSlide.set(desc, slideIndex);
      });
    });

    // Extract images from manifest that have URLs
    Object.entries(parsedDeck.imageManifest).forEach(([description, entry]) => {
      const activeSlot = entry.active || 'generated';
      const url = entry[activeSlot];
      if (url) {
        images.push({
          description,
          url,
          slideIndex: descriptionToSlide.get(description),
        });
      }
    });

    return images;
  }, [parsedDeck]);

  // Fetch user credits when opening sweep dialog
  const handleOpenSweepDialog = useCallback(async () => {
    // Trigger image tour on first sweep dialog open
    recordFeatureUse('image-placeholder-click');

    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.balance || 0);
      }
    } catch (err) {
      console.error('Failed to fetch credits:', err);
    }
    setShowSweepDialog(true);
  }, [recordFeatureUse]);

  // Generate a single image (used by sweep dialog for real progress)
  const handleGenerateSingleImage = useCallback(async (
    description: string,
    modifiedPrompt?: string,
    slideIndex?: number
  ): Promise<{ url: string | null; error?: string }> => {
    try {
      // Use modifiedPrompt if provided, otherwise use original description
      const promptToUse = modifiedPrompt?.trim() || description;

      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: promptToUse,
          styleId: imageStyle,
          sceneContext,
          forceRegenerate: true, // Always regenerate for sweep
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        return { url: null, error: data.error || 'Generation failed' };
      }

      // Update image manifest with the ORIGINAL description as the key
      // (since that's how images are referenced in slides)
      // IMPORTANT: Must await to ensure metadata.images is updated before returning
      if (data.url && onImageChange) {
        try {
          await onImageChange(description, 'generated', data.url);
        } catch (err) {
          console.error('Failed to save image to manifest:', err);
          // Don't fail the generation - image is in cache, just not in manifest
        }
      }

      return { url: data.url };
    } catch (err) {
      return { url: null, error: String(err) };
    }
  }, [imageStyle, sceneContext, onImageChange]);

  // Refresh user credits
  const handleRefreshCredits = useCallback(async () => {
    try {
      const response = await fetch('/api/credits');
      if (response.ok) {
        const data = await response.json();
        setUserCredits(data.balance || 0);
      }
    } catch (err) {
      console.error('Failed to refresh credits:', err);
    }
  }, []);

  // Handle image style change
  const handleStyleChange = useCallback((styleId: typeof imageStyle) => {
    setImageStyle(styleId);
  }, [setImageStyle]);

  // ============================================
  // Editable slide counter handlers
  // ============================================

  const handleSlideNumberClick = useCallback(() => {
    setSlideNumberInput(String(presentation.currentSlide + 1));
    setIsEditingSlideNumber(true);
  }, [presentation.currentSlide]);

  // Focus input when editing starts
  useEffect(() => {
    if (isEditingSlideNumber && slideInputRef.current) {
      slideInputRef.current.focus();
      slideInputRef.current.select();
    }
  }, [isEditingSlideNumber]);

  const handleSlideNumberSubmit = useCallback(() => {
    const num = parseInt(slideNumberInput, 10);
    if (!isNaN(num) && num >= 1 && num <= totalSlides) {
      goToSlide(num - 1);
    }
    setIsEditingSlideNumber(false);
  }, [slideNumberInput, totalSlides, goToSlide]);

  const handleSlideNumberKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSlideNumberSubmit();
    } else if (e.key === 'Escape') {
      setIsEditingSlideNumber(false);
    }
  }, [handleSlideNumberSubmit]);

  // ============================================
  // Navigator scroll handlers
  // ============================================

  const scrollNavigator = useCallback((direction: 'left' | 'right') => {
    if (navigatorRef.current) {
      const scrollAmount = 200; // pixels to scroll
      navigatorRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth',
      });
    }
  }, []);

  // ============================================
  // Get slide to render (with comparison support)
  // ============================================

  const getDisplaySlide = useCallback(() => {
    if (!currentSlide) return null;

    if (
      revampComparison &&
      revampComparison.slideIndex === presentation.currentSlide
    ) {
      const contentToShow = revampComparison.showNew
        ? revampComparison.newContent
        : revampComparison.oldContent;

      const tempParsed = parseSlideMarkdown(`---\ntitle: temp\n---\n${contentToShow}`);
      return tempParsed.slides[0] || currentSlide;
    }

    return currentSlide;
  }, [currentSlide, revampComparison, presentation.currentSlide]);

  const displaySlide = getDisplaySlide();

  if (!parsedDeck || !displaySlide) {
    return (
      <div className="flex items-center justify-center h-full bg-background rounded-lg border border-border">
        <p className="text-text-quaternary text-sm">No slides to preview</p>
      </div>
    );
  }

  const isComparingCurrentSlide = revampComparison && revampComparison.slideIndex === presentation.currentSlide;
  const isRevampingCurrentSlide = isRevamping && revampSlideIndex === presentation.currentSlide;
  const isAddingCurrentSlide = isAddingSlide && addSlidePosition === presentation.currentSlide;
  const isReviewingAddedSlide = addedSlideReview && addedSlideReview.slideIndex === presentation.currentSlide;

  return (
    <div className="flex flex-col h-full bg-background rounded-lg overflow-hidden border border-border">
      {/* Inject theme CSS if available */}
      {currentTheme?.css && <style dangerouslySetInnerHTML={{ __html: currentTheme.css }} />}

      {/* Slide view */}
      <div className="flex-1 relative overflow-hidden group">
        {/* Loading overlay for adding slide */}
        <AnimatePresence>
          {isAddingCurrentSlide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a]/95 border border-white/[0.08] rounded-2xl shadow-2xl"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center"
                >
                  <Sparkles className="w-6 h-6 text-amber-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Creating new slide...</p>
                  <p className="text-xs text-white/50 mt-1">Analyzing context and generating content</p>
                </div>
                <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '50%' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay for revamp */}
        <AnimatePresence>
          {isRevampingCurrentSlide && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/40 backdrop-blur-sm flex items-center justify-center"
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="flex flex-col items-center gap-4 p-6 bg-[#0a0a0a]/95 border border-white/[0.08] rounded-2xl shadow-2xl"
              >
                <motion.div
                  animate={{
                    scale: [1, 1.08, 1],
                    opacity: [0.9, 1, 0.9],
                  }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 flex items-center justify-center"
                >
                  <Wand2 className="w-6 h-6 text-amber-400" />
                </motion.div>
                <div className="text-center">
                  <p className="text-sm font-medium text-white">Revamping slide...</p>
                  <p className="text-xs text-white/50 mt-1">Applying your transformations</p>
                </div>
                <div className="w-32 h-1 rounded-full bg-white/10 overflow-hidden">
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-500/60 via-amber-400 to-amber-500/60 rounded-full"
                    initial={{ x: '-100%' }}
                    animate={{ x: '200%' }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                    style={{ width: '50%' }}
                  />
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Added slide review overlay - Keep/Revamp/Discard */}
        <AnimatePresence>
          {isReviewingAddedSlide && (
            <>
              {/* Top badge */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-[#0a0a0a]/95 border border-amber-500/30 rounded-xl shadow-2xl backdrop-blur-md"
              >
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span className="text-sm font-medium text-amber-300">New slide created</span>
              </motion.div>

              {/* Bottom action bar */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-[#0a0a0a]/95 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-md"
              >
                <button
                  onClick={handleDiscardAddedSlide}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                >
                  <Trash2 className="w-4 h-4" />
                  Discard
                </button>
                <button
                  onClick={handleRevampAddedSlide}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.05] rounded-lg transition-all duration-200"
                >
                  <Wand2 className="w-4 h-4" />
                  Revamp
                </button>
                <button
                  onClick={handleKeepAddedSlide}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20"
                >
                  <Check className="w-4 h-4" />
                  Keep
                </button>
              </motion.div>
            </>
          )}
        </AnimatePresence>

        {/* Comparison toggle overlay (for revamp) */}
        <AnimatePresence>
          {isComparingCurrentSlide && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-[#0a0a0a]/95 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-md"
            >
              <button
                onClick={() => setRevampComparison(prev => prev ? { ...prev, showNew: false } : null)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${!revampComparison?.showNew
                    ? 'bg-white/10 text-white'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                  }
                `}
              >
                Original
              </button>
              <button
                onClick={() => setRevampComparison(prev => prev ? { ...prev, showNew: true } : null)}
                className={`
                  px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200
                  ${revampComparison?.showNew
                    ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black'
                    : 'text-white/50 hover:text-white/80 hover:bg-white/[0.05]'
                  }
                `}
              >
                Revamped
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Comparison action bar (for revamp) */}
        <AnimatePresence>
          {isComparingCurrentSlide && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 p-2 bg-[#0a0a0a]/95 border border-white/[0.08] rounded-xl shadow-2xl backdrop-blur-md"
            >
              <button
                onClick={handleDiscardRevamp}
                className="flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/90 hover:bg-white/[0.05] rounded-lg transition-all duration-200"
              >
                <X className="w-4 h-4" />
                Discard
              </button>
              <button
                onClick={handleApplyRevamp}
                className="flex items-center gap-2 px-4 py-2 text-sm bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black font-medium rounded-lg transition-all duration-200 shadow-lg shadow-amber-500/20"
              >
                <Check className="w-4 h-4" />
                Apply Changes
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <SlideRenderer
          slide={displaySlide}
          revealStep={presentation.currentReveal}
          isPresenting={false}
          imageManifest={parsedDeck.imageManifest}
          onImageChange={onImageChange}
          onActiveSlotChange={onActiveSlotChange}
          sceneContext={sceneContext}
          deckImages={deckImagesForLibrary}
        />

        {/* Navigation overlays */}
        <button
          onClick={prevSlide}
          className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-surface/90 hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
          disabled={presentation.currentSlide === 0 && presentation.currentReveal === 0}
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          onClick={nextSlide}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-surface/90 hover:bg-surface-hover border border-border rounded-md text-text-secondary hover:text-text-primary transition-all opacity-0 group-hover:opacity-100"
          disabled={presentation.currentSlide === totalSlides - 1 && presentation.currentReveal >= currentReveals - 1}
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Speaker notes */}
      {presentation.showSpeakerNotes && currentSlide?.speakerNotes && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="border-t border-border bg-surface"
        >
          <div className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <MessageSquare className="w-3.5 h-3.5 text-text-tertiary" />
              <span className="text-xs text-text-tertiary uppercase tracking-wider">
                Notes
              </span>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed whitespace-pre-wrap">
              {currentSlide.speakerNotes}
            </p>
          </div>
        </motion.div>
      )}

      {/* Controls bar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-t border-border">
        {/* Slide counter - editable */}
        <div className="flex items-center gap-3">
          {isEditingSlideNumber ? (
            <div className="flex items-center text-sm font-mono">
              <input
                ref={slideInputRef}
                type="text"
                value={slideNumberInput}
                onChange={(e) => setSlideNumberInput(e.target.value.replace(/\D/g, ''))}
                onBlur={handleSlideNumberSubmit}
                onKeyDown={handleSlideNumberKeyDown}
                className="w-8 px-1 py-0.5 bg-surface-hover rounded text-center text-text-primary outline-none border-0 ring-0 focus:ring-0 focus:outline-none"
                maxLength={4}
              />
              <span className="text-text-quaternary"> / {totalSlides}</span>
            </div>
          ) : (
            <button
              onClick={handleSlideNumberClick}
              className="text-sm font-mono text-text-secondary hover:text-text-primary hover:bg-surface px-1.5 py-0.5 -mx-1.5 rounded transition-colors"
              title="Click to jump to slide"
            >
              {presentation.currentSlide + 1}
              <span className="text-text-quaternary"> / {totalSlides}</span>
            </button>
          )}
          {currentReveals > 1 && (
            <span className="text-xs text-text-quaternary">
              step {presentation.currentReveal + 1}/{currentReveals}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          {onGenerateTheme && (
            <ThemeCustomizer
              currentPrompt={themePrompt}
              onGenerate={onGenerateTheme}
              onReset={onResetTheme || (() => {})}
              isGenerating={isGeneratingTheme}
            />
          )}

          <button
            onClick={handleOpenSweepDialog}
            className="
              flex items-center gap-1.5 px-2.5 py-1.5
              hover:bg-surface
              border border-border hover:border-border-hover
              rounded-md text-text-secondary hover:text-text-primary
              transition-all duration-fast text-xs
            "
            title="Generate all images"
          >
            <Images className="w-4 h-4" />
            <span>Images</span>
          </button>

          <div className="w-px h-5 bg-border" />

          <button
            onClick={toggleSpeakerNotes}
            className={`
              p-1.5 rounded-md transition-colors
              ${
                presentation.showSpeakerNotes
                  ? 'bg-surface text-text-primary'
                  : 'hover:bg-surface text-text-tertiary hover:text-text-secondary'
              }
            `}
            title="Toggle notes (Cmd+N)"
          >
            <MessageSquare className="w-4 h-4" />
          </button>

          <button
            onClick={async () => {
              if (onSave) {
                await onSave();
              }
              window.open(`/present/${encodeURIComponent(deckId)}`, '_blank');
            }}
            className="
              flex items-center gap-1.5 px-3 py-1.5
              bg-text-primary hover:bg-text-secondary
              rounded-md text-background text-sm
              transition-colors
            "
          >
            <Play className="w-3.5 h-3.5" />
            Present
          </button>
        </div>
      </div>

      {/* Mini slide navigator with add/revamp */}
      <div className="flex items-center gap-2 px-2 py-3 border-t border-border">
        {/* Left scroll arrow */}
        <button
          onClick={() => scrollNavigator('left')}
          className="flex-shrink-0 p-1.5 rounded-md text-text-quaternary hover:text-text-secondary hover:bg-surface transition-colors"
          title="Scroll left"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        {/* Scrollable navigator */}
        <div
          ref={navigatorRef}
          className="flex-1 overflow-x-auto scrollbar-hide"
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <div className="flex gap-2 items-center">
          {parsedDeck.slides.map((slide, index) => {
            const isCurrent = index === presentation.currentSlide;
            const isHovered = hoveredThumbnail === index;
            const isNewlyAdded = addedSlideReview?.slideIndex === index;

            return (
              <div
                key={slide.id}
                className="flex items-center gap-2"
                ref={(el) => {
                  if (el) slideRefs.current.set(index, el);
                }}
              >
                {/* Slide thumbnail with revamp button */}
                <div
                  className="relative flex-shrink-0 group/thumb"
                  onMouseEnter={() => setHoveredThumbnail(index)}
                  onMouseLeave={() => setHoveredThumbnail(null)}
                >
                  <button
                    onClick={() => goToSlide(index)}
                    className={`
                      relative w-16 h-10 rounded-lg overflow-hidden
                      border-2 transition-all duration-200
                      ${isCurrent
                        ? isNewlyAdded
                          ? 'border-amber-400 shadow-[0_0_0_2px_rgba(251,191,36,0.3)]'
                          : 'border-amber-500 shadow-[0_0_0_2px_rgba(245,158,11,0.2)]'
                        : 'border-white/[0.08] hover:border-white/20'
                      }
                    `}
                  >
                    {/* Slide number badge */}
                    <div className={`
                      w-full h-full flex items-center justify-center
                      transition-all duration-200
                      ${isCurrent
                        ? isNewlyAdded
                          ? 'bg-amber-400/20'
                          : 'bg-amber-500/10'
                        : 'bg-white/[0.02] hover:bg-white/[0.05]'
                      }
                    `}>
                      {isNewlyAdded ? (
                        <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      ) : (
                        <span className={`
                          text-xs font-mono font-medium
                          ${isCurrent ? 'text-amber-400' : 'text-white/40'}
                        `}>
                          {index + 1}
                        </span>
                      )}
                    </div>

                    {/* Current slide indicator bar */}
                    {isCurrent && (
                      <motion.div
                        layoutId="currentSlideIndicator"
                        className={`absolute bottom-0 left-0 right-0 h-0.5 ${
                          isNewlyAdded
                            ? 'bg-gradient-to-r from-amber-400 to-amber-300'
                            : 'bg-gradient-to-r from-amber-500 to-amber-400'
                        }`}
                        transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                      />
                    )}
                  </button>

                  {/* Revamp button - expands on hover */}
                  <AnimatePresence>
                    {isHovered && !isRevamping && !revampComparison && !addedSlideReview && (
                      <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 5 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 5 }}
                        transition={{ duration: 0.15 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenRevamp(index);
                        }}
                        className="
                          absolute -top-2 left-1/2 -translate-x-1/2
                          flex items-center gap-1.5 px-2.5 py-1
                          bg-gradient-to-r from-amber-500 to-amber-600
                          hover:from-amber-400 hover:to-amber-500
                          rounded-full text-black text-[10px] font-medium
                          shadow-lg shadow-amber-500/30
                          transition-all duration-200
                          whitespace-nowrap
                        "
                      >
                        <Wand2 className="w-3 h-3" />
                        <span>Revamp</span>
                      </motion.button>
                    )}
                  </AnimatePresence>

                  {/* Loading indicator for revamping slide */}
                  {isRevamping && revampSlideIndex === index && (
                    <div className="absolute inset-0 bg-black/60 rounded-lg flex items-center justify-center backdrop-blur-[1px]">
                      <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                    </div>
                  )}
                </div>

                {/* Add slide button after current slide */}
                {isCurrent && !addedSlideReview && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => handleOpenAddSlide(index)}
                    disabled={isAddingSlide}
                    className="
                      flex-shrink-0 w-8 h-10 rounded-lg
                      border-2 border-dashed border-white/[0.15]
                      hover:border-amber-500/50 hover:bg-amber-500/10
                      flex items-center justify-center
                      text-white/30 hover:text-amber-400
                      transition-all duration-200
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                    title="Add new slide"
                  >
                    {isAddingSlide ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4" />
                    )}
                  </motion.button>
                )}
              </div>
            );
          })}
          </div>
        </div>

        {/* Right scroll arrow */}
        <button
          onClick={() => scrollNavigator('right')}
          className="flex-shrink-0 p-1.5 rounded-md text-text-quaternary hover:text-text-secondary hover:bg-surface transition-colors"
          title="Scroll right"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Dialogs */}
      <AddSlideDialog
        isOpen={showAddSlideDialog}
        onClose={() => setShowAddSlideDialog(false)}
        onAdd={handleAddSlide}
        insertPosition={addSlidePosition}
        isAdding={isAddingSlide}
      />

      <RevampSlideDialog
        isOpen={showRevampDialog}
        onClose={() => setShowRevampDialog(false)}
        onRevamp={handleRevampSlide}
        slideIndex={revampSlideIndex}
        isRevamping={isRevamping}
      />

      <SweepGenerateDialog
        isOpen={showSweepDialog}
        onClose={() => setShowSweepDialog(false)}
        images={extractDeckImages()}
        sceneContext={sceneContext}
        onSceneContextChange={onSceneContextChange}
        currentStyleId={imageStyle}
        onStyleChange={handleStyleChange}
        onGenerateSingle={handleGenerateSingleImage}
        userCredits={userCredits}
        onRefreshCredits={handleRefreshCredits}
      />
    </div>
  );
}
