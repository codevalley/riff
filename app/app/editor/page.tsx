'use client';

// ============================================
// RIFF - Main Editor Application
// ============================================

import { useEffect, useState, useCallback, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, X, Loader2, Plus, FileSymlink, LayoutGrid } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown } from '@/lib/parser';
import { DeckManager } from '@/components/DeckManager';
import { SlideEditor } from '@/components/SlideEditor';
import { SlidePreview } from '@/components/SlidePreview';
import { ThemeCustomizer } from '@/components/ThemeCustomizer';
import { ImageStyleSelector } from '@/components/ImageStyleSelector';
import { FormatHelpDialog } from '@/components/FormatHelpDialog';
import { DocumentUploader } from '@/components/DocumentUploader';
import { UserMenu } from '@/components/auth/UserMenu';

// Wrapper component to handle Suspense for useSearchParams
function EditorContent() {
  const searchParams = useSearchParams();
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
  const [initialDeckLoaded, setInitialDeckLoaded] = useState(false);
  const [showNewDeckModal, setShowNewDeckModal] = useState(false);
  const [showUploader, setShowUploader] = useState(false);
  const [newDeckName, setNewDeckName] = useState('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);

  // Update page title based on current deck
  const currentDeck = decks.find((d) => d.id === currentDeckId);
  useEffect(() => {
    if (currentDeck?.name) {
      document.title = `${currentDeck.name} | Riff`;
    } else {
      document.title = 'Editor | Riff';
    }
  }, [currentDeck?.name]);

  const loadDeck = useCallback(async (id: string) => {
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
  }, [setLoading, setError, setCurrentDeck, setParsedDeck, setThemePrompt, setTheme]);

  // Convert pending document (stored in sessionStorage before auth redirect)
  const convertPendingDocument = useCallback(async () => {
    const pendingData = sessionStorage.getItem('riff-pending-document');
    if (!pendingData) return false;

    try {
      const { content, name, options } = JSON.parse(pendingData);
      sessionStorage.removeItem('riff-pending-document');

      setLoading(true);
      setLoadingMessage('Converting your document to slides...');
      const response = await fetch('/api/convert-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: content,
          documentName: name.replace(/\.(txt|md|markdown)$/i, ''),
          options,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to convert document');
      }

      const data = await response.json();
      if (data.deck) {
        // Refresh deck list and load the new deck
        const listResponse = await fetch('/api/decks');
        const listData = await listResponse.json();
        setDecks(listData.decks || []);
        await loadDeck(data.deck.id);
        return true;
      }
    } catch (err) {
      console.error('Failed to convert pending document:', err);
      setError('Failed to convert document. Please try again.');
    } finally {
      setLoading(false);
      setLoadingMessage(null);
    }
    return false;
  }, [loadDeck, setDecks, setLoading, setError]);

  // Load decks on mount
  useEffect(() => {
    const loadDecks = async () => {
      setLoading(true);
      setLoadingMessage('Loading your decks...');
      try {
        // Check for pending document conversion first (from pre-auth upload)
        const hadPending = await convertPendingDocument();
        if (hadPending) {
          setInitialDeckLoaded(true);
          setLoadingMessage(null);
          return;
        }

        // Check for deck query parameter - try to load directly
        // (handles case where deck was just created and not in cached list)
        const deckParam = searchParams.get('deck');
        if (deckParam) {
          try {
            await loadDeck(deckParam);
            // Refresh deck list to include the new deck
            const listResponse = await fetch('/api/decks');
            const listData = await listResponse.json();
            setDecks(listData.decks || []);
            setInitialDeckLoaded(true);
            // Clean up URL
            window.history.replaceState({}, '', '/editor');
            return;
          } catch {
            // Deck not found, continue to load list normally
            console.warn('Deck from URL not found, loading default');
          }
        }

        // Load deck list
        const response = await fetch('/api/decks');
        const data = await response.json();
        setDecks(data.decks || []);

        // Load first deck if available
        if (data.decks?.length > 0 && !currentDeckId) {
          await loadDeck(data.decks[0].id);
        }
        setInitialDeckLoaded(true);
      } catch (err) {
        setError('Failed to load decks');
        console.error(err);
        setInitialDeckLoaded(true);
      } finally {
        setLoading(false);
        setLoadingMessage(null);
      }
    };

    loadDecks();
  }, []);

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

  const renameDeck = async (id: string, newName: string) => {
    try {
      const response = await fetch(`/api/decks/${encodeURIComponent(id)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newName }),
      });

      if (!response.ok) throw new Error('Failed to rename');

      // Update deck in local state
      setDecks(decks.map((d) => (d.id === id ? { ...d, name: newName } : d)));
    } catch (err) {
      setError('Failed to rename deck');
      console.error('Rename error:', err);
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

  const handleCreateDeck = () => {
    if (newDeckName.trim()) {
      createDeck(newDeckName.trim());
      setNewDeckName('');
      setShowNewDeckModal(false);
    }
  };

  // Handle successful document upload from DocumentUploader
  const handleUploadSuccess = useCallback(async (deckId: string) => {
    // Refresh deck list and load the new deck
    try {
      const listResponse = await fetch('/api/decks');
      const listData = await listResponse.json();
      setDecks(listData.decks || []);
      await loadDeck(deckId);
    } catch (err) {
      setError('Failed to load deck');
      console.error(err);
    }
  }, [loadDeck, setDecks, setError]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Custom theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/80 backdrop-blur-sm border-b border-border">
        <div className="flex items-center justify-between h-14 px-4">
          {/* Left: Logo & Deck selector */}
          <div className="flex items-center gap-4">
            {/* Logo */}
            <a href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
              <LayoutGrid className="w-5 h-5 text-text-secondary" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-lg font-semibold tracking-tight">
                Riff
              </span>
            </a>

            <div className="h-4 w-px bg-border" />

            <DeckManager
              decks={decks}
              currentDeckId={currentDeckId}
              onSelect={loadDeck}
              onDelete={deleteDeck}
              onRename={renameDeck}
              isLoading={isLoading}
            />

            <div className="h-4 w-px bg-border" />

            {/* New Deck Button */}
            <button
              onClick={() => setShowNewDeckModal(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>New Deck</span>
            </button>

            {/* Import Button */}
            <button
              onClick={() => setShowUploader(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
            >
              <FileSymlink className="w-4 h-4" />
              <span>Create from document</span>
            </button>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <FormatHelpDialog />

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

            <div className="h-4 w-px bg-border" />

            <UserMenu />
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
        <div className="flex-1 h-full overflow-hidden bg-background-secondary relative">
          <div className="h-full p-4">
            {currentDeckId ? (
              <SlidePreview deckId={currentDeckId} onSave={saveDeck} />
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

          {/* Loading overlay */}
          <AnimatePresence>
            {(isLoading && loadingMessage) && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-background-secondary/90 backdrop-blur-sm flex flex-col items-center justify-center z-10"
              >
                <Loader2 className="w-8 h-8 text-text-tertiary animate-spin mb-4" />
                <p className="text-sm text-text-secondary">{loadingMessage}</p>
              </motion.div>
            )}
          </AnimatePresence>
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

      {/* New Deck Modal */}
      <AnimatePresence>
        {showNewDeckModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowNewDeckModal(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="relative w-full max-w-sm bg-surface border border-border rounded-xl shadow-2xl p-6"
            >
              <h3 className="text-lg font-medium mb-4">New Deck</h3>
              <input
                type="text"
                value={newDeckName}
                onChange={(e) => setNewDeckName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreateDeck()}
                placeholder="Deck name..."
                className="w-full px-3 py-2.5 bg-background border border-border rounded-lg text-text-primary text-sm placeholder:text-text-quaternary focus:border-border-focus outline-none mb-4"
                autoFocus
              />
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowNewDeckModal(false);
                    setNewDeckName('');
                  }}
                  className="px-4 py-2 text-sm text-text-secondary hover:text-text-primary transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateDeck}
                  disabled={!newDeckName.trim()}
                  className="px-4 py-2 bg-text-primary text-background rounded-lg text-sm font-medium hover:bg-text-secondary disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  Create
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Document Uploader Modal */}
      {showUploader && (
        <DocumentUploader
          onClose={() => setShowUploader(false)}
          onSuccess={handleUploadSuccess}
        />
      )}
    </div>
  );
}

// Loading fallback for Suspense
function EditorLoading() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-text-tertiary animate-spin" />
    </div>
  );
}

// Main export wrapped in Suspense
export default function EditorPage() {
  return (
    <Suspense fallback={<EditorLoading />}>
      <EditorContent />
    </Suspense>
  );
}
