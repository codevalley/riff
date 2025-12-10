'use client';

// ============================================
// VIBE SLIDES - Main Application
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, X } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';
import { DeckManager } from '@/components/DeckManager';
import { SlideEditor } from '@/components/SlideEditor';
import { SlidePreview } from '@/components/SlidePreview';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { ImageStyleSelector } from '@/components/ImageStyleSelector';

export default function Home() {
  const {
    decks,
    setDecks,
    currentDeckId,
    currentDeckContent,
    setCurrentDeck,
    updateDeckContent,
    setParsedDeck,
    isEditorOpen,
    toggleEditor,
    isLoading,
    setLoading,
    error,
    setError,
    themePrompt,
    setThemePrompt,
    setTheme,
    setImageStyle,
  } = useStore();

  // Hydrate imageStyle from localStorage on mount
  useEffect(() => {
    const savedStyle = localStorage.getItem('vibe-slides-image-style');
    if (savedStyle) {
      setImageStyle(savedStyle as any);
    }
  }, [setImageStyle]);

  const [isSaving, setIsSaving] = useState(false);
  const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);
  const [themeCSS, setThemeCSS] = useState<string>('');

  // Load decks on mount
  useEffect(() => {
    const loadDecks = async () => {
      setLoading(true);
      try {
        const response = await fetch('/api/decks');
        const data = await response.json();
        setDecks(data.decks || []);

        if (data.decks?.length > 0 && !currentDeckId) {
          await loadDeck(data.decks[0].id);
        }
      } catch (err) {
        setError('Failed to load decks');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadDecks();
  }, []);

  const loadDeck = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      // Load deck content
      const response = await fetch(`/api/decks/${encodeURIComponent(id)}`);
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deck not found');
      }

      const data = await response.json();
      setCurrentDeck(data.deck.id, data.content);
      const parsed = parseSlideMarkdown(data.content);
      setParsedDeck(parsed);

      // Load theme if available
      try {
        const themeResponse = await fetch(`/api/theme/${encodeURIComponent(id)}`);
        if (themeResponse.ok) {
          const themeData = await themeResponse.json();
          if (themeData.css) {
            setThemeCSS(themeData.css);
            setThemePrompt(themeData.prompt || '');
            setTheme({
              id: 'custom',
              name: 'Custom Theme',
              prompt: themeData.prompt || '',
              css: themeData.css,
              fonts: { display: '', body: '', mono: '' },
            });
          }
        } else {
          // No theme saved - reset to defaults
          setThemeCSS('');
          setThemePrompt('');
          setTheme(null as any);
        }
      } catch {
        // Theme loading failed silently - use defaults
        setThemeCSS('');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
      console.error('Load deck error:', err);
    } finally {
      setLoading(false);
    }
  };

  const createDeck = async (name: string) => {
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.deck) {
        const listResponse = await fetch('/api/decks');
        const listData = await listResponse.json();
        setDecks(listData.decks || []);
        await loadDeck(data.deck.id);
      }
    } catch (err) {
      setError('Failed to create deck');
      console.error(err);
    }
  };

  const deleteDeck = async (id: string) => {
    try {
      const response = await fetch(`/api/decks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete');

      const newDecks = decks.filter((d) => d.id !== id);
      setDecks(newDecks);

      if (id === currentDeckId) {
        if (newDecks.length > 0) {
          await loadDeck(newDecks[0].id);
        } else {
          setCurrentDeck('', '');
          setParsedDeck(null);
        }
      }
    } catch (err) {
      setError('Failed to delete deck');
      console.error('Delete error:', err);
    }
  };

  const saveDeck = async () => {
    if (!currentDeckId) return;

    setIsSaving(true);
    try {
      const response = await fetch(`/api/decks/${encodeURIComponent(currentDeckId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentDeckContent }),
      });

      if (!response.ok) throw new Error('Failed to save');
    } catch (err) {
      setError('Failed to save deck');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const generateTheme = async (prompt: string, customSystemPrompt?: string) => {
    setIsGeneratingTheme(true);
    try {
      const response = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt,
          deckId: currentDeckId,
          customSystemPrompt,
        }),
      });

      const data = await response.json();
      if (data.css) {
        setThemeCSS(data.css);
        setThemePrompt(prompt);
        setTheme({
          id: 'custom',
          name: 'Custom Theme',
          prompt,
          css: data.css,
          fonts: { display: '', body: '', mono: '' },
        });
      }
    } catch (err) {
      setError('Failed to generate theme');
      console.error(err);
    } finally {
      setIsGeneratingTheme(false);
    }
  };

  const resetTheme = async () => {
    // Clear theme from state
    setThemeCSS('');
    setThemePrompt('');
    setTheme(null);

    // Delete theme from storage if deck is selected
    if (currentDeckId) {
      try {
        await fetch(`/api/theme/${encodeURIComponent(currentDeckId)}`, {
          method: 'DELETE',
        });
      } catch (err) {
        console.error('Failed to delete theme:', err);
      }
    }
  };

  const handleContentChange = useCallback(
    (content: string) => {
      updateDeckContent(content);
    },
    [updateDeckContent]
  );

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Custom theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Logo & Deck selector */}
          <div className="flex items-center gap-6">
            {/* Logo */}
            <div className="flex items-center gap-2.5">
              <svg
                className="w-6 h-6 text-text-primary"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
              >
                <path d="M4 4h16v16H4z" />
                <path d="M4 9h16" />
                <path d="M9 4v16" />
              </svg>
              <span className="text-sm font-medium tracking-tight">
                Vibe Slides
              </span>
            </div>

            <div className="h-4 w-px bg-border" />

            <DeckManager
              decks={decks}
              currentDeckId={currentDeckId}
              onSelect={loadDeck}
              onCreate={createDeck}
              onDelete={deleteDeck}
              isLoading={isLoading}
            />
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <ImageStyleSelector />

            <ThemeCustomizer
              currentPrompt={themePrompt}
              onGenerate={generateTheme}
              onReset={resetTheme}
              isGenerating={isGeneratingTheme}
            />

            <button
              onClick={toggleEditor}
              className="p-2 hover:bg-surface rounded-md text-text-secondary hover:text-text-primary transition-colors"
              title={isEditorOpen ? 'Hide editor' : 'Show editor'}
            >
              {isEditorOpen ? (
                <PanelLeftClose className="w-4 h-4" />
              ) : (
                <PanelLeft className="w-4 h-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex h-[calc(100vh-57px)]">
        {/* Editor panel */}
        <AnimatePresence mode="wait">
          {isEditorOpen && (
            <motion.div
              initial={{ width: 0, opacity: 0 }}
              animate={{ width: '40%', opacity: 1 }}
              exit={{ width: 0, opacity: 0 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full border-r border-border overflow-hidden"
            >
              <div className="h-full p-4">
                <SlideEditor
                  content={currentDeckContent}
                  onChange={handleContentChange}
                  onSave={saveDeck}
                  isSaving={isSaving}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview panel */}
        <div className="flex-1 h-full overflow-hidden bg-background-secondary">
          <div className="h-full p-4">
            {currentDeckId ? (
              <SlidePreview deckId={currentDeckId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-tertiary">
                <svg
                  className="w-12 h-12 mb-4 opacity-30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" />
                  <path d="M3 9h18" />
                </svg>
                <p className="text-sm font-medium">No deck selected</p>
                <p className="text-xs mt-1 text-text-quaternary">
                  Create a new deck or select an existing one
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Error toast */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-4 right-4 flex items-center gap-3 px-4 py-3 bg-surface border border-error/20 rounded-lg"
          >
            <span className="text-sm text-error">{error}</span>
            <button
              onClick={() => setError(null)}
              className="p-1 hover:bg-surface-hover rounded text-text-tertiary hover:text-text-primary transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
