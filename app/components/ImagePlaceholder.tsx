'use client';

// ============================================
// RIFF - Image Placeholder Component
// Unified action menu: "+ Add Image" / "Edit ▾"
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  Loader2,
  Upload,
  Wand2,
  X,
  Layers,
  ChevronDown,
  Trash2,
  Images,
  Plus,
  Pencil,
  Paintbrush,
  AlertCircle,
} from 'lucide-react';
import { createPortal } from 'react-dom';
import { useStore } from '@/lib/store';
import { DancingPixels } from './DancingPixels';
import { IMAGE_STYLE_PRESETS, ImageManifestEntry, ImageSlot } from '@/lib/types';
import { CREDIT_COSTS } from '@/lib/credits-config';
import { useCreditsContext } from '@/hooks/useCredits';

// Library image for "From Library" picker
interface LibraryImage {
  description: string;
  url: string;
  slideIndex?: number;
}

interface ImagePlaceholderProps {
  description: string;
  imageUrl?: string;
  status?: 'pending' | 'generating' | 'ready' | 'error';
  isPresenting?: boolean;
  // New props for manifest-based persistence
  manifestEntry?: ImageManifestEntry;
  onImageChange?: (slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (slot: ImageSlot) => void;
  // Scene context for visual consistency across images
  sceneContext?: string;
  onSceneContextChange?: (context: string) => void;
  // Library of existing deck images for "From Library" picker
  deckImages?: LibraryImage[];
  // Callback when image is removed
  onImageRemove?: () => void;
}


interface ImageSlots {
  generated?: string;
  uploaded?: string;
  restyled?: string;
}

export function ImagePlaceholder({
  description,
  imageUrl,
  status = 'pending',
  isPresenting = false,
  manifestEntry,
  onImageChange,
  onActiveSlotChange,
  sceneContext,
  onSceneContextChange,
  deckImages = [],
  onImageRemove,
}: ImagePlaceholderProps) {
  // Image slots - each can have its own URL
  const [slots, setSlots] = useState<ImageSlots>({});
  const [activeSlot, setActiveSlot] = useState<ImageSlot | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestyling, setIsRestyling] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showRestyleModal, setShowRestyleModal] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
  const [showGenerateDropdown, setShowGenerateDropdown] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // Scene context editing state (for restyle modal)
  const [editedSceneContext, setEditedSceneContext] = useState('');
  const [isSceneContextExpanded, setIsSceneContextExpanded] = useState(false);

  // Unified action menu state
  const [showActionMenu, setShowActionMenu] = useState(false);
  const [showLibraryPicker, setShowLibraryPicker] = useState(false);
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null);

  const cacheChecked = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const actionMenuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);

  const { imageCache, cacheImage, imageStyle } = useStore();
  const { setShowLedgerModal } = useCreditsContext();

  // Get the current slide background color from CSS variables
  const getBackgroundColor = () => {
    if (typeof window === 'undefined') return '#0a0a0a';
    return getComputedStyle(document.documentElement).getPropertyValue('--slide-bg').trim() || '#0a0a0a';
  };

  // Cache keys for each slot
  const getCacheKey = useCallback((slot: ImageSlot) => {
    switch (slot) {
      case 'generated':
        return imageStyle && imageStyle !== 'none'
          ? `gen:${imageStyle}:${description}`
          : `gen:${description}`;
      case 'uploaded':
        return `upload:${description}`;
      case 'restyled':
        return `restyle:${description}`;
    }
  }, [description, imageStyle]);

  // Persist uploaded/restyled URLs to localStorage (they use random hashes in blob storage)
  const persistSlotUrl = useCallback((slot: ImageSlot, url: string) => {
    if (typeof window === 'undefined') return;
    const key = `vibe-image-${slot}:${description}`;
    localStorage.setItem(key, url);
  }, [description]);

  const getPersistedSlotUrl = useCallback((slot: ImageSlot): string | null => {
    if (typeof window === 'undefined') return null;
    const key = `vibe-image-${slot}:${description}`;
    return localStorage.getItem(key);
  }, [description]);

  // Get active image URL
  const activeImageUrl = activeSlot ? slots[activeSlot] : null;

  // Count available slots
  const availableSlots = Object.entries(slots).filter(([_, url]) => url).map(([slot]) => slot as ImageSlot);

  // Auto-check all slot caches on mount OR use manifestEntry if provided
  useEffect(() => {
    // If manifestEntry is provided, use it directly (from frontmatter)
    if (manifestEntry) {
      setSlots({
        generated: manifestEntry.generated,
        uploaded: manifestEntry.uploaded,
        restyled: manifestEntry.restyled,
      });
      setActiveSlot(manifestEntry.active);
      setIsCheckingCache(false);
      cacheChecked.current = true;
      return;
    }

    // Fall back to cache checking for decks without frontmatter
    if (cacheChecked.current) {
      setIsCheckingCache(false);
      return;
    }

    cacheChecked.current = true;

    const checkAllCaches = async () => {
      const savedStyle = typeof window !== 'undefined'
        ? localStorage.getItem('vibe-slides-image-style') || 'none'
        : 'none';

      const newSlots: ImageSlots = {};

      // Check each slot's cache (priority: restyled → uploaded → generated)
      const slotOrder: ImageSlot[] = ['restyled', 'uploaded', 'generated'];

      for (const slot of slotOrder) {
        let cacheKey: string;

        switch (slot) {
          case 'generated':
            cacheKey = savedStyle && savedStyle !== 'none'
              ? `gen:${savedStyle}:${description}`
              : `gen:${description}`;
            break;
          case 'uploaded':
            cacheKey = `upload:${description}`;
            break;
          case 'restyled':
            cacheKey = `restyle:${description}`;
            break;
        }

        // Check Zustand cache first
        const localCached = imageCache[cacheKey];
        if (localCached) {
          newSlots[slot] = localCached;
          continue;
        }

        // For uploaded/restyled: check localStorage (they use random hashes in blob)
        if (slot === 'uploaded' || slot === 'restyled') {
          const persistedUrl = getPersistedSlotUrl(slot);
          if (persistedUrl) {
            newSlots[slot] = persistedUrl;
            cacheImage(cacheKey, persistedUrl);
            continue;
          }
        }

        // For generated: check server cache (predictable keys in blob)
        if (slot === 'generated') {
          try {
            const response = await fetch('/api/image-cache?' + new URLSearchParams({
              description: description,
              styleId: savedStyle,
            }));

            if (response.ok) {
              const data = await response.json();
              if (data.url) {
                newSlots[slot] = data.url;
                cacheImage(cacheKey, data.url);
              }
            }
          } catch (err) {
            console.error(`Cache check failed for ${slot}:`, err);
          }
        }
      }

      setSlots(newSlots);

      // Set active slot based on priority: restyled → uploaded → generated
      if (newSlots.restyled) {
        setActiveSlot('restyled');
      } else if (newSlots.uploaded) {
        setActiveSlot('uploaded');
      } else if (newSlots.generated) {
        setActiveSlot('generated');
      }

      setIsCheckingCache(false);
    };

    checkAllCaches();
  }, [description, imageCache, cacheImage, getPersistedSlotUrl, manifestEntry]);

  // Initialize edited scene context when modal opens
  useEffect(() => {
    if (showRestyleModal) {
      setEditedSceneContext(sceneContext || '');
      setIsSceneContextExpanded(false);
    }
  }, [showRestyleModal, sceneContext]);

  // Close action menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (actionMenuRef.current && !actionMenuRef.current.contains(e.target as Node)) {
        setShowActionMenu(false);
      }
    };
    if (showActionMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showActionMenu]);

  // Select image from library
  const handleSelectFromLibrary = useCallback((libraryImage: LibraryImage) => {
    // Use uploaded slot for library selections
    const cacheKey = getCacheKey('uploaded');
    setSlots(prev => ({ ...prev, uploaded: libraryImage.url }));
    setActiveSlot('uploaded');
    cacheImage(cacheKey, libraryImage.url);
    persistSlotUrl('uploaded', libraryImage.url);
    onImageChange?.('uploaded', libraryImage.url);
    setShowLibraryPicker(false);
    setShowActionMenu(false);
  }, [getCacheKey, cacheImage, persistSlotUrl, onImageChange]);

  // Remove image
  const handleRemoveImage = useCallback(() => {
    setSlots({});
    setActiveSlot(null);
    setShowActionMenu(false);
    onImageRemove?.();
  }, [onImageRemove]);

  // Generate new image (first-time generation only)
  const handleGenerate = async (styleOverride?: string) => {
    setIsGenerating(true);
    setError(null);
    setShowGenerateDropdown(false);
    setShowActionMenu(false);

    const styleToUse = styleOverride || imageStyle;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          styleId: styleToUse,
          backgroundColor: getBackgroundColor(),
          forceRegenerate: false,
          sceneContext,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.url) {
        const cacheKey = getCacheKey('generated');
        setSlots(prev => ({ ...prev, generated: data.url }));
        setActiveSlot('generated');
        cacheImage(cacheKey, data.url);
        onImageChange?.('generated', data.url);
      } else if (data.placeholder) {
        setError(data.message || 'Image generation not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Core file upload logic (used by both input and drag & drop)
  const uploadFile = async (file: File) => {
    // Validate file type
    const validTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Please upload a valid image file (PNG, JPEG, WebP, or GIF)');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('description', `upload:${description}`);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to upload image');
      }

      const cacheKey = getCacheKey('uploaded');
      setSlots(prev => ({ ...prev, uploaded: data.url }));
      setActiveSlot('uploaded');
      cacheImage(cacheKey, data.url);
      persistSlotUrl('uploaded', data.url);
      // Notify parent to persist to frontmatter
      onImageChange?.('uploaded', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // Handle file input change
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadFile(file);
  };

  // Handle drag & drop - use a counter to handle nested elements
  const dragCounter = useRef(0);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current++;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current--;
    if (dragCounter.current === 0) {
      setIsDragging(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    dragCounter.current = 0;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      await uploadFile(file);
    }
  };

  // Handle restyle - closes modal immediately, shows progress on image
  const handleRestyle = async () => {
    if (!activeImageUrl || (!selectedPreset && !customPrompt.trim())) return;

    // Capture form values before clearing
    const styleToApply = selectedPreset;
    const promptToApply = customPrompt.trim();
    const contextToApply = editedSceneContext.trim();

    // Persist scene context changes if edited
    if (contextToApply !== (sceneContext || '') && onSceneContextChange) {
      onSceneContextChange(contextToApply);
    }

    // Close modal immediately and reset form
    setShowRestyleModal(false);
    setCustomPrompt('');
    setSelectedPreset(null);
    setError(null);

    // Start restyling (DancingPixels overlay will show on the image)
    setIsRestyling(true);

    try {
      const response = await fetch('/api/restyle-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: activeImageUrl,
          styleId: styleToApply || undefined,
          customPrompt: promptToApply || undefined,
          backgroundColor: getBackgroundColor(),
          sceneContext: contextToApply || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to restyle image');
      }

      const cacheKey = getCacheKey('restyled');
      setSlots(prev => ({ ...prev, restyled: data.url }));
      setActiveSlot('restyled');
      cacheImage(cacheKey, data.url);
      persistSlotUrl('restyled', data.url);
      onImageChange?.('restyled', data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to restyle image');
    } finally {
      setIsRestyling(false);
    }
  };

  // Slot labels
  const slotLabels: Record<ImageSlot, string> = {
    generated: 'AI',
    uploaded: 'Upload',
    restyled: 'Styled',
  };

  const slotColors: Record<ImageSlot, string> = {
    generated: 'bg-emerald-600',
    uploaded: 'bg-blue-600',
    restyled: 'bg-purple-600',
  };

  // Hidden file input
  const renderFileInput = () => (
    <input
      ref={fileInputRef}
      type="file"
      accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
      onChange={handleUpload}
      className="hidden"
    />
  );

  // Slot picker UI
  const renderSlotPicker = () => {
    if (availableSlots.length <= 1) return null;

    return (
      <AnimatePresence>
        {showSlotPicker && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            className="absolute top-12 left-2 z-50 bg-neutral-900 rounded-lg border border-neutral-700 p-1 shadow-xl"
          >
            {availableSlots.map(slot => (
              <button
                key={slot}
                onClick={() => {
                  setActiveSlot(slot);
                  setShowSlotPicker(false);
                  // Notify parent to update active slot in frontmatter
                  onActiveSlotChange?.(slot);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 rounded-md text-left text-sm transition-colors ${
                  activeSlot === slot
                    ? 'bg-neutral-700 text-white'
                    : 'hover:bg-neutral-800 text-neutral-300'
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${slotColors[slot]}`} />
                {slotLabels[slot]}
                {activeSlot === slot && <span className="ml-auto text-xs text-neutral-500">Active</span>}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Restyle Modal - Minimal design
  const renderRestyleModal = () => (
    <AnimatePresence>
      {showRestyleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70"
            onClick={() => setShowRestyleModal(false)}
          />

          {/* Modal - compact */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header - minimal */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/5">
              <h3 className="text-sm font-medium text-white">Restyle</h3>
              <button
                onClick={() => setShowRestyleModal(false)}
                className="p-1 -m-1 text-white/40 hover:text-white/70 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Content - tight spacing */}
            <div className="p-4 space-y-3">
              {/* Description input - single line style */}
              <input
                type="text"
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                placeholder="Describe the new style..."
                className="w-full px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-white placeholder-white/30 focus:outline-none focus:border-white/20"
              />

              {/* Style chips - compact */}
              <div className="flex flex-wrap gap-1">
                {IMAGE_STYLE_PRESETS.filter(p => p.id !== 'none').map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => setSelectedPreset(selectedPreset === preset.id ? null : preset.id)}
                    className={`px-2.5 py-1 text-xs rounded-md transition-colors ${
                      selectedPreset === preset.id
                        ? 'bg-white/20 text-white'
                        : 'bg-white/5 text-white/60 hover:bg-white/10 hover:text-white/80'
                    }`}
                  >
                    {preset.name}
                  </button>
                ))}
              </div>

              {/* Selected style description */}
              {selectedPreset && (
                <p className="text-xs text-white/40">
                  {IMAGE_STYLE_PRESETS.find(p => p.id === selectedPreset)?.description}
                </p>
              )}

              {/* Scene context - simple inline expandable */}
              {(sceneContext || editedSceneContext) && (
                <div>
                  <button
                    onClick={() => setIsSceneContextExpanded(!isSceneContextExpanded)}
                    className="flex items-center gap-1.5 text-xs text-white/40 hover:text-white/60 transition-colors"
                  >
                    <ChevronDown className={`w-3 h-3 transition-transform ${isSceneContextExpanded ? 'rotate-180' : ''}`} />
                    Scene context
                  </button>
                  {isSceneContextExpanded && (
                    <textarea
                      value={editedSceneContext}
                      onChange={(e) => setEditedSceneContext(e.target.value)}
                      placeholder="Scene setting for visual consistency..."
                      className="w-full mt-2 px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-xs text-white/70 placeholder-white/30 focus:outline-none focus:border-white/20 resize-none h-16"
                    />
                  )}
                </div>
              )}

              {error && (
                <p className="text-xs text-red-400">{error}</p>
              )}
            </div>

            {/* Footer - compact */}
            <div className="flex items-center justify-between px-4 py-3 border-t border-white/5">
              <button
                type="button"
                onClick={() => setShowLedgerModal(true)}
                className="flex items-center gap-1.5 text-[10px] text-white/40 hover:text-amber-400 transition-colors"
              >
                <div className="w-1 h-1 rounded-full bg-amber-500/60" />
                Uses {CREDIT_COSTS.IMAGE_RESTYLE} credits
              </button>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowRestyleModal(false)}
                  className="px-3 py-1.5 text-xs text-white/50 hover:text-white/70 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleRestyle}
                  disabled={!selectedPreset && !customPrompt.trim()}
                  className="px-4 py-1.5 bg-white text-black text-xs font-medium rounded-lg transition-colors hover:bg-white/90 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Apply
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  // Library picker modal
  const renderLibraryPicker = () => {
    // Filter out current image and images without URLs
    const availableImages = deckImages.filter(img =>
      img.url && img.description !== description
    );

    if (availableImages.length === 0) return null;

    return (
      <AnimatePresence>
        {showLibraryPicker && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
            onClick={() => setShowLibraryPicker(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="bg-[#0a0a0a] border border-[#27272a] rounded-xl shadow-xl max-w-md w-full max-h-[70vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-[#27272a]">
                <h3 className="text-sm font-medium text-white">Select from Library</h3>
                <button
                  onClick={() => setShowLibraryPicker(false)}
                  className="p-1 rounded hover:bg-white/10 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Image grid */}
              <div className="p-3 overflow-y-auto max-h-[calc(70vh-60px)]">
                <div className="grid grid-cols-3 gap-2">
                  {availableImages.map((img, idx) => (
                    <button
                      key={`${img.description}-${idx}`}
                      onClick={() => handleSelectFromLibrary(img)}
                      className="group/libimg relative aspect-video rounded-lg overflow-hidden border border-white/10 hover:border-white/30 transition-all"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.url}
                        alt={img.description}
                        className="w-full h-full object-cover"
                      />
                      {/* Hover overlay - uses named group to avoid parent group interference */}
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/libimg:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-[10px] text-white font-medium px-2 text-center line-clamp-2">
                          {img.description}
                        </span>
                      </div>
                      {/* Slide indicator */}
                      {img.slideIndex !== undefined && (
                        <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 rounded text-[9px] text-white/70">
                          {img.slideIndex + 1}
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  };

  // Calculate menu position for portal rendering
  const updateMenuPosition = useCallback(() => {
    if (!menuButtonRef.current) return;
    const rect = menuButtonRef.current.getBoundingClientRect();
    setMenuPosition({
      top: rect.top,
      left: rect.left + rect.width / 2,
    });
  }, []);

  // Unified action menu for filled state (uses portal to avoid clipping)
  const renderFilledActionMenu = () => {
    const hasLibraryImages = deckImages.filter(img => img.url && img.description !== description).length > 0;

    const handleToggleMenu = () => {
      if (!showActionMenu) {
        updateMenuPosition();
      }
      setShowActionMenu(!showActionMenu);
    };

    const menuContent = showActionMenu && typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        <motion.div
          ref={actionMenuRef}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          transition={{ duration: 0.1 }}
          className="fixed w-44 rounded-xl shadow-2xl overflow-hidden z-[9999]"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #27272a',
            top: menuPosition ? menuPosition.top - 8 : 0,
            left: menuPosition ? menuPosition.left : 0,
            transform: 'translate(-50%, -100%)',
          }}
        >
          <div className="p-1">
            {/* Restyle - primary action for editing existing images */}
            <button
              onClick={() => {
                setShowRestyleModal(true);
                setShowActionMenu(false);
              }}
              disabled={isRestyling}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Wand2 className="w-4 h-4 text-amber-400" />
              Restyle
            </button>

            {/* Upload */}
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowActionMenu(false);
              }}
              disabled={isUploading}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              Upload New
            </button>

            {/* From Library */}
            {hasLibraryImages && (
              <button
                onClick={() => {
                  setShowLibraryPicker(true);
                  setShowActionMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Images className="w-4 h-4 text-amber-400" />
                From Library
              </button>
            )}

            {/* Divider */}
            <div className="my-1 border-t border-white/10" />

            {/* Remove */}
            <button
              onClick={handleRemoveImage}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-red-400/90 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Remove
            </button>
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );

    return (
      <>
        <button
          ref={menuButtonRef}
          onClick={handleToggleMenu}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-black/80 hover:bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 text-xs font-medium text-white/90 hover:text-white transition-all shadow-lg"
        >
          <Pencil className="w-3 h-3" />
          Edit
          <ChevronDown className={`w-3 h-3 transition-transform ${showActionMenu ? 'rotate-180' : ''}`} />
        </button>
        {menuContent}
      </>
    );
  };

  // Unified action menu for empty state (uses portal to avoid clipping)
  const renderEmptyActionMenu = () => {
    const hasLibraryImages = deckImages.filter(img => img.url && img.description !== description).length > 0;

    const handleToggleMenu = () => {
      if (!showActionMenu) {
        updateMenuPosition();
      }
      setShowActionMenu(!showActionMenu);
    };

    const menuContent = showActionMenu && typeof document !== 'undefined' && createPortal(
      <AnimatePresence>
        <motion.div
          ref={actionMenuRef}
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -4 }}
          transition={{ duration: 0.1 }}
          className="fixed w-44 rounded-xl shadow-2xl overflow-hidden z-[9999]"
          style={{
            backgroundColor: '#0a0a0a',
            border: '1px solid #27272a',
            top: menuPosition ? menuPosition.top + 40 : 0, // Below the button
            left: menuPosition ? menuPosition.left : 0,
            transform: 'translateX(-50%)',
          }}
        >
          <div className="p-1">
            {/* Generate */}
            <button
              onClick={() => handleGenerate()}
              disabled={isGenerating}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Paintbrush className="w-4 h-4 text-emerald-400" />
              Generate
            </button>

            {/* Upload */}
            <button
              onClick={() => {
                fileInputRef.current?.click();
                setShowActionMenu(false);
              }}
              disabled={isUploading}
              className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-50"
            >
              <Upload className="w-4 h-4 text-blue-400" />
              Upload
            </button>

            {/* From Library */}
            {hasLibraryImages && (
              <button
                onClick={() => {
                  setShowLibraryPicker(true);
                  setShowActionMenu(false);
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 text-left text-sm text-white/90 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Images className="w-4 h-4 text-amber-400" />
                From Library
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>,
      document.body
    );

    return (
      <>
        <button
          ref={menuButtonRef}
          onClick={handleToggleMenu}
          className="flex items-center gap-2 px-4 py-2 bg-slide-accent/20 hover:bg-slide-accent/30 backdrop-blur-sm rounded-lg border border-slide-accent/40 text-sm font-medium text-slide-accent transition-all"
        >
          <Plus className="w-4 h-4" />
          Add Image
        </button>
        {menuContent}
      </>
    );
  };

  // If we have an active image, show it with action buttons
  if (activeImageUrl) {
    return (
      <>
        {renderFileInput()}
        {renderRestyleModal()}
        {renderLibraryPicker()}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          onDragOver={handleDragOver}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`relative w-full aspect-video rounded-xl overflow-hidden group bg-slide-bg ${
            isDragging ? 'ring-2 ring-slide-accent' : ''
          }`}
        >
          {/* Current image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImageUrl!}
            alt={description}
            className="absolute inset-0 w-full h-full object-contain"
            loading="lazy"
          />

          {/* Restyling overlay with animation */}
          {isRestyling && (
            <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-40">
              <div className="relative w-full h-full">
                <DancingPixels className="text-amber-500" />
              </div>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <p className="text-white/90 text-sm font-medium">Restyling...</p>
              </div>
            </div>
          )}

          {/* Error display for filled state (e.g., insufficient credits) */}
          {error && !isRestyling && (
            <div className="absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t from-black/90 to-transparent z-40">
              <div className="flex items-center justify-center gap-2">
                <div className="flex items-center gap-2 px-3 py-2 bg-red-500/20 border border-red-500/30 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300 text-xs">{error}</span>
                  <button
                    onClick={() => setError(null)}
                    className="ml-2 text-red-400 hover:text-red-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-slide-accent/30 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2 text-white">
                <Upload className="w-10 h-10" />
                <span className="text-sm font-medium">Drop to replace</span>
              </div>
            </div>
          )}

          {/* Slot indicator + picker (top left) - hide during restyling */}
          {!isPresenting && activeSlot && !isRestyling && (
            <div className="absolute top-2 left-2 z-40">
              <button
                onClick={() => setShowSlotPicker(!showSlotPicker)}
                className={`flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium transition-all ${slotColors[activeSlot]} text-white ${
                  availableSlots.length > 1 ? 'hover:opacity-90 cursor-pointer' : ''
                }`}
                disabled={availableSlots.length <= 1}
              >
                {availableSlots.length > 1 && <Layers className="w-3 h-3" />}
                {slotLabels[activeSlot]}
                {availableSlots.length > 1 && (
                  <span className="opacity-70">({availableSlots.length})</span>
                )}
              </button>
              {renderSlotPicker()}
            </div>
          )}

          {/* Unified Edit button (bottom center) - hide during restyling */}
          {!isPresenting && !isRestyling && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              {renderFilledActionMenu()}
            </div>
          )}
        </motion.div>
      </>
    );
  }

  // Show placeholder with generate/upload buttons
  return (
    <>
      {renderFileInput()}
      {renderRestyleModal()}
      {renderLibraryPicker()}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        onDragOver={handleDragOver}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          relative w-full aspect-video rounded-xl
          border-2 border-dashed
          flex flex-col items-center justify-center gap-4
          transition-colors duration-150
          ${isPresenting ? 'p-8' : 'p-4'}
          ${isDragging
            ? 'bg-slide-accent/20 border-slide-accent'
            : 'bg-slide-surface/30 border-slide-accent/30'
          }
        `}
      >
        {isCheckingCache ? (
          <>
            <Loader2 className={`${isPresenting ? 'w-12 h-12' : 'w-8 h-8'} text-slide-muted/50 animate-spin`} />
            <p className={`text-slide-muted/50 ${isPresenting ? 'text-lg' : 'text-xs'}`}>
              Loading...
            </p>
          </>
        ) : isGenerating || isUploading ? (
          <>
            {/* Full container dancing pixels */}
            <DancingPixels color="var(--slide-accent, #06b6d4)" />
            {/* Centered status text */}
            <div className="relative z-10 flex flex-col items-center gap-2">
              <p className={`text-slide-muted ${isPresenting ? 'text-lg' : 'text-sm'} font-medium`}>
                {isUploading ? 'Uploading...' : 'Creating image...'}
              </p>
            </div>
          </>
        ) : error ? (
          <>
            <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />
            <p className={`text-red-400 ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
              {error}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate()}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors"
              >
                Upload Instead
              </button>
            </div>
          </>
        ) : isDragging ? (
          <>
            <Upload className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-accent`} />
            <p className={`text-slide-accent ${isPresenting ? 'text-xl' : 'text-sm'} font-medium`}>
              Drop image here
            </p>
          </>
        ) : (
          <>
            <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />

            <p className={`text-slide-muted ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
              {description}
            </p>

            {!isPresenting && renderEmptyActionMenu()}
          </>
        )}
      </motion.div>
    </>
  );
}
