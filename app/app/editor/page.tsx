'use client';

// ============================================
// RIFF - Main Editor Application
// ============================================

import { useEffect, useState, useCallback, Suspense, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PanelLeftClose, PanelLeft, X, Loader2, Plus, FileSymlink, Upload, ChevronDown, File, FolderOpen } from 'lucide-react';
import { RiffIcon } from '@/components/RiffIcon';
import { SnowTrigger } from '@/components/SnowfallEffect';
import { useSearchParams } from 'next/navigation';
import { useStore } from '@/lib/store';
import { parseSlideMarkdown, isLegacyDeck } from '@/lib/parser';
import { ImageSlot, ImageManifest, DeckMetadataV3 } from '@/lib/types';
import { DeckManager } from '@/components/DeckManager';
import { SlideEditor } from '@/components/SlideEditor';
import { SlidePreview } from '@/components/SlidePreview';
import { DocumentUploader } from '@/components/DocumentUploader';
import { RevampDeckDialog } from '@/components/RevampDeckDialog';
import { UserMenu } from '@/components/auth/UserMenu';
import { PublishPopover, PublishStatus } from '@/components/sharing/PublishPopover';
import { ExportDropdown } from '@/components/ExportDropdown';
import { CreditsDisplay } from '@/components/CreditsDisplay';
import { PurchaseCreditsModal } from '@/components/PurchaseCreditsModal';
import { CreditsLedgerModal } from '@/components/CreditsLedgerModal';
import { useCreditsContext } from '@/hooks/useCredits';
import { useOnboarding } from '@/hooks/useOnboarding';
import {
  OnboardingDialog,
  WelcomeIllustration,
  MarkdownIllustration,
  SlashCommandsIllustration,
  ImageGenIllustration,
  ImageStylesIllustration,
  ImageRestyleIllustration,
  ImageLibraryIllustration,
  ImageCreditsIllustration,
  PublishIntroIllustration,
  PublishExportIllustration,
  PublishWebIllustration,
  PublishEmbedIllustration,
  PublishSocialIllustration,
  CreditsPhilosophyIllustration,
  CreditsNeverExpireIllustration,
  CreditsWhatCostsIllustration,
  CreditsTransparencyIllustration,
  CreditsTrustIllustration,
  CreatingIntroIllustration,
  CreatingFromContentIllustration,
  CreatingFromScratchIllustration,
  CreatingImportRiffIllustration,
  ThemeIllustration,
  RevampIllustration,
  TipThankYouIllustration,
} from '@/components/onboarding';

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
    parsedDeck,
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
  const [publishStatus, setPublishStatus] = useState<PublishStatus | null>(null);
  const [newDeckName, setNewDeckName] = useState('');
  const [loadingMessage, setLoadingMessage] = useState<string | null>(null);
  const [showRevampDialog, setShowRevampDialog] = useState(false);
  const [showTipThankYou, setShowTipThankYou] = useState(false);

  // Credits context for ledger and purchase modals
  const {
    balance: creditsBalance,
    transactions,
    isLoading: creditsLoading,
    refetch: refetchCredits,
    showPurchaseModal,
    setShowPurchaseModal,
    showLedgerModal,
    setShowLedgerModal,
  } = useCreditsContext();

  // Onboarding
  const { activeStep, dismissActiveStep, skipAll, activeTour, nextTourStep, exitTour, recordFeatureUse } = useOnboarding();

  const [isRevamping, setIsRevamping] = useState(false);
  const [isImportingRiff, setIsImportingRiff] = useState(false);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [sceneContext, setSceneContext] = useState<string | undefined>(undefined);

  // Refs
  const riffInputRef = useRef<HTMLInputElement>(null);
  const moreMenuRef = useRef<HTMLDivElement>(null);

  // Close more menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (moreMenuRef.current && !moreMenuRef.current.contains(e.target as Node)) {
        setShowMoreMenu(false);
      }
    };
    if (showMoreMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showMoreMenu]);

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

      // Merge images from v3 metadata into parsed deck
      // Metadata images take precedence over any embedded frontmatter
      if (data.metadata?.images) {
        parsed.imageManifest = {
          ...parsed.imageManifest,
          ...data.metadata.images,
        };
      }

      // Extract scene context from metadata for AI-generated images
      if (data.metadata?.imageContext) {
        setSceneContext(data.metadata.imageContext);
      } else {
        setSceneContext(undefined);
      }

      setParsedDeck(parsed);

      // Set publish status from API response
      if (data.publishStatus) {
        setPublishStatus(data.publishStatus);
      } else {
        setPublishStatus(null);
      }

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
    // Check for tip success and show thank you modal
    const tipStatus = searchParams.get('tip');
    if (tipStatus === 'success') {
      setShowTipThankYou(true);
      // Clean up URL
      window.history.replaceState({}, '', '/editor');
    }

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

      // Mark as having unpublished changes if already published
      if (publishStatus?.isPublished) {
        setPublishStatus({
          ...publishStatus,
          hasUnpublishedChanges: true,
        });
      }
    } catch (err) {
      setError('Failed to save deck');
      console.error('Save error:', err);
    } finally {
      setIsSaving(false);
    }
  };

  // Import .riff file
  const importRiff = async (file: File) => {
    setIsImportingRiff(true);
    setLoadingMessage('Importing deck...');
    setLoading(true);

    try {
      const content = await file.text();
      const riffData = JSON.parse(content);

      const response = await fetch('/api/decks/import', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: content,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import');
      }

      const data = await response.json();

      // Refresh decks list
      const decksResponse = await fetch('/api/decks');
      if (decksResponse.ok) {
        const decksData = await decksResponse.json();
        setDecks(decksData.decks);
      }

      // Load the imported deck
      if (data.deck?.id) {
        await loadDeck(data.deck.id);
      }
    } catch (err) {
      if (err instanceof SyntaxError) {
        setError('Invalid .riff file');
      } else {
        setError(err instanceof Error ? err.message : 'Failed to import deck');
      }
      console.error('Import error:', err);
    } finally {
      setIsImportingRiff(false);
      setLoadingMessage(null);
      setLoading(false);
    }
  };

  // Handle .riff file selection
  const handleRiffFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      importRiff(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
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

      if (!response.ok) {
        console.error('Theme generation failed:', data);
        setError(data.error || 'Failed to generate theme');
        return;
      }

      if (data.css) {
        console.log('Theme generated successfully, CSS length:', data.css.length);
        console.log('Generated CSS:', data.css);
        setThemeCSS(data.css);
        setThemePrompt(prompt);
        setTheme({
          id: 'custom',
          name: 'Custom Theme',
          prompt,
          css: data.css,
          fonts: { display: '', body: '', mono: '' },
        });
      } else {
        console.error('No CSS in response:', data);
        setError('Theme generation returned no CSS');
      }
    } catch (err) {
      setError('Failed to generate theme');
      console.error('Theme generation error:', err);
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

  // Handle image change from ImagePlaceholder - update metadata JSON (v3)
  const handleImageChange = useCallback(async (description: string, slot: ImageSlot, url: string) => {
    if (!currentDeckId) return;

    try {
      // Update image in metadata JSON via API
      const response = await fetch(`/api/decks/${encodeURIComponent(currentDeckId)}/images`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          slot,
          url,
          setActive: true,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update image');
      }

      const data = await response.json();

      // Update the parsedDeck's imageManifest in-place
      if (parsedDeck) {
        const updatedManifest = {
          ...parsedDeck.imageManifest,
          [description]: data.image,
        };
        setParsedDeck({
          ...parsedDeck,
          imageManifest: updatedManifest,
        });
      }
    } catch (err) {
      console.error('Failed to update image:', err);
      setError('Failed to save image');
    }
  }, [currentDeckId, parsedDeck, setParsedDeck, setError]);

  // Handle active slot change - update metadata JSON (v3)
  const handleActiveSlotChange = useCallback(async (description: string, slot: ImageSlot) => {
    if (!currentDeckId) return;

    try {
      // Update active slot in metadata JSON via API
      const response = await fetch(`/api/decks/${encodeURIComponent(currentDeckId)}/images`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          activeSlot: slot,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update active slot');
      }

      const data = await response.json();

      // Update the parsedDeck's imageManifest in-place
      if (parsedDeck) {
        const updatedManifest = {
          ...parsedDeck.imageManifest,
          [description]: data.image,
        };
        setParsedDeck({
          ...parsedDeck,
          imageManifest: updatedManifest,
        });
      }
    } catch (err) {
      console.error('Failed to update active slot:', err);
      setError('Failed to save image preference');
    }
  }, [currentDeckId, parsedDeck, setParsedDeck, setError]);

  // Handle scene context change - persist to metadata via theme endpoint
  const handleSceneContextChange = useCallback(async (context: string) => {
    if (!currentDeckId) return;

    setSceneContext(context);

    try {
      // Save to metadata via theme API (same metadata file)
      await fetch(`/api/theme/${encodeURIComponent(currentDeckId)}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageContext: context }),
      });
    } catch (err) {
      console.error('Failed to save scene context:', err);
    }
  }, [currentDeckId]);

  // Handle deck revamp with AI
  const handleRevamp = useCallback(async (instructions: string) => {
    if (!currentDeckId || !currentDeckContent) return;

    setIsRevamping(true);
    try {
      const response = await fetch('/api/revamp-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          deckId: currentDeckId,
          currentContent: currentDeckContent,
          instructions,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to revamp deck');
      }

      // Update content with revamped version
      updateDeckContent(data.content);
      const parsed = parseSlideMarkdown(data.content);
      setParsedDeck(parsed);

      // Auto-save the revamped content
      await fetch(`/api/decks/${encodeURIComponent(currentDeckId)}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: data.content }),
      });

      // Mark as having unpublished changes if already published
      if (publishStatus?.isPublished) {
        setPublishStatus({
          ...publishStatus,
          hasUnpublishedChanges: true,
        });
      }

      setShowRevampDialog(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to revamp deck');
    } finally {
      setIsRevamping(false);
    }
  }, [currentDeckId, currentDeckContent, updateDeckContent, setParsedDeck, publishStatus]);

  return (
    <div className="min-h-screen bg-background text-text-primary">
      {/* Custom theme CSS */}
      {themeCSS && <style dangerouslySetInnerHTML={{ __html: themeCSS }} />}

      {/* Header */}
      <header className="sticky top-0 z-30 bg-background/98 backdrop-blur-xl">
        <div className="flex items-center justify-between h-12 px-4">
          {/* Left: Logo, Deck selector & New dropdown */}
          <div className="flex items-center gap-2">
            {/* Logo */}
            <div className="flex items-center gap-1 mr-1">
              <a href="/" className="flex items-center gap-2 hover:opacity-70 transition-opacity">
                <RiffIcon size={20} primaryColor="rgba(255, 255, 255, 0.85)" secondaryColor="rgba(255, 255, 255, 0.4)" />
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-sm font-semibold tracking-tight text-white/90">
                  Riff
                </span>
              </a>
              <SnowTrigger className="ml-0.5 mb-2" />
            </div>

            <DeckManager
              decks={decks}
              currentDeckId={currentDeckId}
              onSelect={loadDeck}
              onDelete={deleteDeck}
              onRename={renameDeck}
              isLoading={isLoading}
            />

            {/* New dropdown - single button that opens menu */}
            <div className="relative" ref={moreMenuRef}>
              <button
                onClick={() => {
                  if (!showMoreMenu) recordFeatureUse('creating-click');
                  setShowMoreMenu(!showMoreMenu);
                }}
                className={`
                  flex items-center gap-1.5 px-2.5 py-1.5 text-sm rounded-md transition-all
                  ${showMoreMenu
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white/90 hover:bg-white/[0.06]'
                  }
                `}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
                <ChevronDown className={`w-3 h-3 opacity-50 transition-transform ${showMoreMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Dropdown menu */}
              <AnimatePresence>
                {showMoreMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 4 }}
                    transition={{ duration: 0.12, ease: 'easeOut' }}
                    className="absolute top-full left-0 mt-1.5 w-52 bg-[#1c1c1c] rounded-xl shadow-2xl shadow-black/50 py-1.5 z-50 overflow-hidden"
                  >
                    <button
                      onClick={() => {
                        setShowNewDeckModal(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <File className="w-4 h-4 opacity-60" />
                      <span>Blank deck</span>
                    </button>
                    <button
                      onClick={() => {
                        setShowUploader(true);
                        setShowMoreMenu(false);
                      }}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors"
                    >
                      <FileSymlink className="w-4 h-4 opacity-60" />
                      <span>From document</span>
                    </button>
                    <div className="my-1.5 mx-3 h-px bg-white/[0.06]" />
                    <button
                      onClick={() => {
                        riffInputRef.current?.click();
                        setShowMoreMenu(false);
                      }}
                      disabled={isImportingRiff}
                      className="w-full flex items-center gap-3 px-3.5 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/[0.06] transition-colors disabled:opacity-40"
                    >
                      {isImportingRiff ? (
                        <Loader2 className="w-4 h-4 opacity-60 animate-spin" />
                      ) : (
                        <FolderOpen className="w-4 h-4 opacity-60" />
                      )}
                      <span>Open .riff file</span>
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Right: Deck actions & user */}
          <div className="flex items-center gap-0.5">
            {/* Deck actions */}
            {currentDeckId && currentDeck && (
              <>
                {/* Export dropdown */}
                <ExportDropdown
                  deckId={currentDeckId}
                  deckName={currentDeck.name}
                />

                {/* Publish */}
                <PublishPopover
                  deckId={currentDeckId}
                  deckName={currentDeck.name}
                  publishStatus={publishStatus}
                  onPublishStatusChange={setPublishStatus}
                />

                <div className="w-px h-5 bg-white/[0.08] mx-2" />
              </>
            )}

            {/* User section */}
            <CreditsDisplay onPurchaseClick={() => setShowLedgerModal(true)} />
            <UserMenu />

            {/* Editor toggle - far right */}
            {currentDeckId && (
              <button
                onClick={toggleEditor}
                className={`p-2 ml-1 rounded-lg transition-colors ${
                  isEditorOpen
                    ? 'text-white/70 bg-white/[0.06]'
                    : 'text-white/40 hover:text-white/80 hover:bg-white/[0.06]'
                }`}
                title={isEditorOpen ? 'Hide editor' : 'Show editor'}
              >
                {isEditorOpen ? (
                  <PanelLeftClose className="w-4 h-4" />
                ) : (
                  <PanelLeft className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex h-[calc(100vh-49px)]">
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
                  onRevamp={() => {
                    recordFeatureUse('revamp-click');
                    setShowRevampDialog(true);
                  }}
                  isSaving={isSaving}
                  isLegacy={isLegacyDeck(currentDeckContent)}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Preview panel */}
        <div className="flex-1 h-full overflow-hidden bg-background-secondary relative">
          <div className="h-full p-4">
            {currentDeckId ? (
              <SlidePreview
                deckId={currentDeckId}
                onSave={saveDeck}
                onGenerateTheme={generateTheme}
                onResetTheme={resetTheme}
                isGeneratingTheme={isGeneratingTheme}
                onImageChange={handleImageChange}
                onActiveSlotChange={handleActiveSlotChange}
                sceneContext={sceneContext}
                onSceneContextChange={handleSceneContextChange}
              />
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

      {/* Credits Ledger Modal */}
      <CreditsLedgerModal
        isOpen={showLedgerModal}
        onClose={() => setShowLedgerModal(false)}
        onAddCredits={() => {
          setShowLedgerModal(false);
          setShowPurchaseModal(true);
        }}
        balance={creditsBalance}
        transactions={transactions}
        isLoading={creditsLoading}
      />

      {/* Purchase Credits Modal */}
      <PurchaseCreditsModal
        isOpen={showPurchaseModal}
        onClose={() => {
          setShowPurchaseModal(false);
          refetchCredits(); // Refresh after purchase
        }}
      />

      {/* Revamp Deck Dialog */}
      <RevampDeckDialog
        isOpen={showRevampDialog}
        onClose={() => setShowRevampDialog(false)}
        onRevamp={handleRevamp}
        slideCount={parsedDeck?.slides.length || 0}
        isRevamping={isRevamping}
        isLegacy={isLegacyDeck(currentDeckContent)}
      />

      {/* Hidden file input for .riff import */}
      <input
        ref={riffInputRef}
        type="file"
        accept=".riff,application/json"
        onChange={handleRiffFileChange}
        className="hidden"
      />

      {/* Tip Thank You Modal */}
      <OnboardingDialog
        isOpen={showTipThankYou}
        onDismiss={() => setShowTipThankYou(false)}
        title="Thank you!"
        description="Your support means the world to us. Every tip helps us keep building Riff and staying true to our philosophy — no subscriptions, no lock-in, just honest tools."
        illustration={<TipThankYouIllustration />}
        primaryLabel="Back to creating"
      />

      {/* Onboarding Dialog (handles both standalone dialogs and tour steps) */}
      {activeStep && (activeStep.type === 'dialog' || activeStep.type === 'tour-step') && (
        <OnboardingDialog
          isOpen={true}
          onDismiss={activeTour ? nextTourStep : dismissActiveStep}
          onClose={activeTour ? exitTour : dismissActiveStep}
          onSecondaryAction={skipAll}
          title={activeStep.title}
          description={activeStep.description}
          primaryLabel={
            activeTour
              ? activeTour.currentIndex === activeTour.steps.length - 1
                ? 'Done'
                : 'Next'
              : activeStep.primaryAction.label
          }
          secondaryLabel={activeStep.secondaryAction?.label}
          illustration={
            // Welcome tour
            activeStep.id === 'welcome-editor' ? <WelcomeIllustration /> :
            activeStep.id === 'markdown-intro' ? <MarkdownIllustration /> :
            activeStep.id === 'slash-commands' ? <SlashCommandsIllustration /> :
            // Image tour
            activeStep.id === 'image-intro-generate' ? <ImageGenIllustration /> :
            activeStep.id === 'image-intro-styles' ? <ImageStylesIllustration /> :
            activeStep.id === 'image-intro-restyle' ? <ImageRestyleIllustration /> :
            activeStep.id === 'image-intro-library' ? <ImageLibraryIllustration /> :
            activeStep.id === 'image-intro-credits' ? <ImageCreditsIllustration /> :
            // Publishing tour
            activeStep.id === 'publish-intro' ? <PublishIntroIllustration /> :
            activeStep.id === 'publish-export' ? <PublishExportIllustration /> :
            activeStep.id === 'publish-web' ? <PublishWebIllustration /> :
            activeStep.id === 'publish-embed' ? <PublishEmbedIllustration /> :
            activeStep.id === 'publish-social' ? <PublishSocialIllustration /> :
            // Credits tour
            activeStep.id === 'credits-intro-philosophy' ? <CreditsPhilosophyIllustration /> :
            activeStep.id === 'credits-intro-never-expire' ? <CreditsNeverExpireIllustration /> :
            activeStep.id === 'credits-intro-what-costs' ? <CreditsWhatCostsIllustration /> :
            activeStep.id === 'credits-intro-transparency' ? <CreditsTransparencyIllustration /> :
            activeStep.id === 'credits-intro-trust' ? <CreditsTrustIllustration /> :
            // Creating tour
            activeStep.id === 'creating-intro' ? <CreatingIntroIllustration /> :
            activeStep.id === 'creating-from-content' ? <CreatingFromContentIllustration /> :
            activeStep.id === 'creating-from-scratch' ? <CreatingFromScratchIllustration /> :
            activeStep.id === 'creating-import-riff' ? <CreatingImportRiffIllustration /> :
            // Standalone dialogs
            activeStep.id === 'theme-customization' ? <ThemeIllustration /> :
            activeStep.id === 'revamp-intro' ? <RevampIllustration /> :
            undefined
          }
          tourProgress={
            activeTour
              ? { current: activeTour.currentIndex, total: activeTour.steps.length }
              : undefined
          }
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
