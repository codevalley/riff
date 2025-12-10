'use client';

// ============================================
// VIBE SLIDES - Main Application
// ============================================

import { useEffect, useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, PanelLeftClose, PanelLeft } from 'lucide-react';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';
import { DeckManager } from '@/components/DeckManager';
import { SlideEditor } from '@/components/SlideEditor';
import { SlidePreview } from '@/components/SlidePreview';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { Deck } from '@/lib/types';

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
    currentTheme,
    setTheme,
  } = useStore();

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

        // Auto-select first deck if available
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

  // Load a specific deck
  const loadDeck = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      console.log('Loading deck:', id);
      const response = await fetch(`/api/decks/${encodeURIComponent(id)}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Deck not found');
      }

      const data = await response.json();
      console.log('Loaded deck data:', data.deck?.id);

      // Use the ID from the response (normalized)
      setCurrentDeck(data.deck.id, data.content);

      // Parse the deck
      const parsed = parseSlideMarkdown(data.content);
      setParsedDeck(parsed);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load deck');
      console.error('Load deck error:', err);
    } finally {
      setLoading(false);
    }
  };

  // Create a new deck
  const createDeck = async (name: string) => {
    try {
      const response = await fetch('/api/decks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });

      const data = await response.json();
      if (data.deck) {
        // Refresh deck list to get the normalized ID
        const listResponse = await fetch('/api/decks');
        const listData = await listResponse.json();
        setDecks(listData.decks || []);

        // Load the newly created deck using the ID returned from the API
        await loadDeck(data.deck.id);
      }
    } catch (err) {
      setError('Failed to create deck');
      console.error(err);
    }
  };

  // Delete a deck
  const deleteDeck = async (id: string) => {
    try {
      console.log('Deleting deck:', id);
      const response = await fetch(`/api/decks/${encodeURIComponent(id)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete');
      }

      const newDecks = decks.filter((d) => d.id !== id);
      setDecks(newDecks);

      // If we deleted the current deck, switch to another
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

  // Save current deck
  const saveDeck = async () => {
    if (!currentDeckId) return;

    setIsSaving(true);
    try {
      console.log('Saving deck:', currentDeckId);
      const response = await fetch(`/api/decks/${encodeURIComponent(currentDeckId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: currentDeckContent }),
      });

      if (!response.ok) {
        throw new Error('Failed to save');
      }

      console.log('Deck saved successfully');
    } catch (err) {
      setError('Failed to save deck');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Generate theme from prompt
  const generateTheme = async (prompt: string) => {
    setIsGeneratingTheme(true);
    try {
      const response = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, deckId: currentDeckId }),
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

  // Handle content change
  const handleContentChange = useCallback(
    (content: string) => {
      updateDeckContent(content);
    },
    [updateDeckContent]
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* Inject custom theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-slate-950/80 backdrop-blur-md border-b border-slate-800/50">
        <div className="flex items-center justify-between px-4 py-3">
          {/* Logo & Deck selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
                Vibe Slides
              </span>
            </div>

            <div className="w-px h-8 bg-slate-700/50" />

            <DeckManager
              decks={decks}
              currentDeckId={currentDeckId}
              onSelect={loadDeck}
              onCreate={createDeck}
              onDelete={deleteDeck}
              isLoading={isLoading}
            />
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeCustomizer
              currentPrompt={themePrompt}
              onGenerate={generateTheme}
              isGenerating={isGeneratingTheme}
            />

            <button
              onClick={toggleEditor}
              className="p-2.5 hover:bg-slate-800 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
              title={isEditorOpen ? 'Hide editor' : 'Show editor'}
            >
              {isEditorOpen ? (
                <PanelLeftClose className="w-5 h-5" />
              ) : (
                <PanelLeft className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex h-[calc(100vh-65px)]">
        {/* Editor panel */}
        {isEditorOpen && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: '40%', opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="h-full border-r border-slate-800/50 overflow-hidden"
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

        {/* Preview panel */}
        <div className="flex-1 h-full overflow-hidden">
          <div className="h-full p-4">
            {currentDeckId ? (
              <SlidePreview deckId={currentDeckId} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500">
                <Sparkles className="w-16 h-16 mb-4 opacity-30" />
                <p className="text-xl font-medium">No deck selected</p>
                <p className="text-sm mt-2">Create a new deck or select an existing one</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Error toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 50 }}
          className="fixed bottom-4 right-4 px-4 py-3 bg-red-500/90 text-white rounded-xl shadow-lg"
        >
          <div className="flex items-center gap-3">
            <span>{error}</span>
            <button
              onClick={() => setError(null)}
              className="text-white/70 hover:text-white"
            >
              Dismiss
            </button>
          </div>
        </motion.div>
      )}
    </div>
  );
}
