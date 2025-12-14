'use client';

// ============================================
// VIBE SLIDES - Image Placeholder Component
// With 3 image slots: Generated, Uploaded, Restyled
// ============================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ImageIcon,
  Loader2,
  RefreshCw,
  Sparkles,
  Upload,
  Wand2,
  X,
  Layers,
  ChevronDown,
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { IMAGE_STYLE_PRESETS, ImageManifestEntry, ImageSlot } from '@/lib/types';

interface ImagePlaceholderProps {
  description: string;
  imageUrl?: string;
  status?: 'pending' | 'generating' | 'ready' | 'error';
  isPresenting?: boolean;
  // New props for manifest-based persistence
  manifestEntry?: ImageManifestEntry;
  onImageChange?: (slot: ImageSlot, url: string) => void;
  onActiveSlotChange?: (slot: ImageSlot) => void;
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

  const cacheChecked = useRef(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { imageCache, cacheImage, imageStyle } = useStore();

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

  // Generate new image with optional style override
  const handleGenerate = async (forceRegenerate = false, styleOverride?: string) => {
    setIsGenerating(true);
    setError(null);
    setShowGenerateDropdown(false);

    const styleToUse = styleOverride || imageStyle;

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          styleId: styleToUse,
          backgroundColor: getBackgroundColor(),
          forceRegenerate,
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
        // Notify parent to persist to frontmatter
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

  // Handle restyle
  const handleRestyle = async () => {
    if (!activeImageUrl || (!selectedPreset && !customPrompt.trim())) return;

    setIsRestyling(true);
    setError(null);

    try {
      const response = await fetch('/api/restyle-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageUrl: activeImageUrl,
          styleId: selectedPreset || undefined,
          customPrompt: customPrompt.trim() || undefined,
          backgroundColor: getBackgroundColor(),
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
      persistSlotUrl('restyled', data.url); // Persist to localStorage for page refresh
      // Notify parent to persist to frontmatter
      onImageChange?.('restyled', data.url);
      setShowRestyleModal(false);
      setCustomPrompt('');
      setSelectedPreset(null);
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

  // Restyle Modal (shadcn-inspired)
  const renderRestyleModal = () => (
    <AnimatePresence>
      {showRestyleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80"
          onClick={() => setShowRestyleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="bg-[#0a0a0a] border border-[#27272a] rounded-lg shadow-xl max-w-lg w-full max-h-[85vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex flex-col gap-1.5 p-6 pb-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-white tracking-tight">Restyle image</h3>
                <button
                  onClick={() => setShowRestyleModal(false)}
                  className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                >
                  <X className="w-4 h-4 text-white" />
                </button>
              </div>
              <p className="text-sm text-[#a1a1aa]">
                Transform this image with a new artistic style.
              </p>
            </div>

            {/* Content */}
            <div className="px-6 pb-6 space-y-4 overflow-y-auto max-h-[calc(85vh-160px)]">
              {/* Preview */}
              <div className="rounded-md overflow-hidden border border-[#27272a]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={activeImageUrl || ''}
                  alt="Current image"
                  className="w-full aspect-video object-contain bg-[#18181b]"
                />
              </div>

              {/* Style presets */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Style preset</label>
                <div className="grid grid-cols-2 gap-2">
                  {IMAGE_STYLE_PRESETS.filter(p => p.id !== 'none').map((preset) => (
                    <button
                      key={preset.id}
                      onClick={() => {
                        setSelectedPreset(preset.id);
                        setCustomPrompt('');
                      }}
                      className={`p-3 text-left rounded-md border transition-all ${
                        selectedPreset === preset.id
                          ? 'border-white bg-white/10'
                          : 'border-[#27272a] hover:border-[#3f3f46] bg-[#18181b]'
                      }`}
                    >
                      <div className="font-medium text-sm text-white">{preset.name}</div>
                      <div className="text-xs text-[#71717a] mt-0.5 line-clamp-1">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom prompt */}
              <div>
                <label className="block text-sm font-medium text-white mb-2">Custom prompt</label>
                <textarea
                  value={customPrompt}
                  onChange={(e) => {
                    setCustomPrompt(e.target.value);
                    if (e.target.value.trim()) setSelectedPreset(null);
                  }}
                  placeholder="e.g., Transform into a watercolor painting..."
                  className="w-full h-20 px-3 py-2 bg-[#18181b] border border-[#27272a] rounded-md text-sm text-white placeholder-[#52525b] focus:outline-none focus:ring-1 focus:ring-[#3f3f46] resize-none"
                />
              </div>

              {error && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-md text-red-400 text-sm">
                  {error}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-2 px-6 py-4 border-t border-[#27272a]">
              <button
                onClick={() => setShowRestyleModal(false)}
                className="h-9 px-4 text-sm text-[#a1a1aa] hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestyle}
                disabled={isRestyling || (!selectedPreset && !customPrompt.trim())}
                className="h-9 px-4 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-md transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isRestyling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Applying...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Apply style
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // If we have an active image, show it with action buttons
  if (activeImageUrl) {
    return (
      <>
        {renderFileInput()}
        {renderRestyleModal()}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImageUrl}
            alt={description}
            className="absolute inset-0 w-full h-full object-contain"
            loading="lazy"
          />

          {/* Drag overlay */}
          {isDragging && (
            <div className="absolute inset-0 bg-slide-accent/30 flex items-center justify-center z-50">
              <div className="flex flex-col items-center gap-2 text-white">
                <Upload className="w-10 h-10" />
                <span className="text-sm font-medium">Drop to replace</span>
              </div>
            </div>
          )}

          {/* Slot indicator + picker (top left) */}
          {!isPresenting && activeSlot && (
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

          {/* Floating action bar (bottom) */}
          {!isPresenting && (
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-all duration-200 translate-y-1 group-hover:translate-y-0">
              <div className="flex items-center gap-1 px-1.5 py-1.5 bg-black/90 backdrop-blur-sm rounded-lg border border-white/10 shadow-xl">
                {/* Generate split button */}
                <div className="relative flex items-center">
                  <button
                    onClick={() => handleGenerate(true)}
                    disabled={isGenerating}
                    className="flex items-center gap-1.5 pl-2.5 pr-1.5 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-l-md text-xs font-medium transition-colors disabled:opacity-50"
                    title="Regenerate with current style"
                  >
                    {isGenerating ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3.5 h-3.5" />
                    )}
                    Regen
                  </button>
                  <button
                    onClick={() => setShowGenerateDropdown(!showGenerateDropdown)}
                    disabled={isGenerating}
                    className="flex items-center px-1 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-r-md transition-colors disabled:opacity-50 border-l border-white/10"
                    title="Choose style"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Style dropdown - rendered with fixed positioning to escape backdrop-blur */}
                  <AnimatePresence>
                    {showGenerateDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={() => setShowGenerateDropdown(false)}
                        />
                        <div className="absolute left-0 bottom-full mb-1.5 z-[101]">
                          <motion.div
                            initial={{ opacity: 0, y: 4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 4 }}
                            transition={{ duration: 0.1 }}
                            className="w-48 rounded-lg shadow-2xl overflow-hidden isolate"
                            style={{
                              backgroundColor: '#09090b',
                              border: '1px solid #27272a',
                            }}
                          >
                            <div
                              className="px-2.5 py-1.5 border-b border-[#27272a]"
                              style={{ backgroundColor: '#09090b' }}
                            >
                              <p className="text-[10px] text-[#71717a] uppercase tracking-wider">Generate with style</p>
                            </div>
                            <div
                              className="p-1 max-h-48 overflow-y-auto"
                              style={{ backgroundColor: '#09090b' }}
                            >
                              {IMAGE_STYLE_PRESETS.map((preset) => (
                                <button
                                  key={preset.id}
                                  onClick={() => handleGenerate(true, preset.id)}
                                  className="w-full text-left px-2.5 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors"
                                >
                                  {preset.name}
                                </button>
                              ))}
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>

                <div className="w-px h-4 bg-white/20" />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md text-xs font-medium transition-colors disabled:opacity-50"
                  title="Upload image"
                >
                  {isUploading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Upload className="w-3.5 h-3.5" />
                  )}
                  Upload
                </button>

                <div className="w-px h-4 bg-white/20" />

                <button
                  onClick={() => setShowRestyleModal(true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 text-white/80 hover:text-white hover:bg-white/10 rounded-md text-xs font-medium transition-colors"
                  title="Restyle image"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Style
                </button>
              </div>
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
            <div className="relative">
              <Loader2 className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-accent animate-spin`} />
              <Sparkles className="w-6 h-6 text-slide-accent absolute -top-1 -right-1 animate-pulse" />
            </div>
            <p className={`text-slide-muted ${isPresenting ? 'text-xl' : 'text-sm'}`}>
              {isUploading ? 'Uploading...' : 'Generating image...'}
            </p>
          </>
        ) : error ? (
          <>
            <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />
            <p className={`text-red-400 ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
              {error}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => handleGenerate(false)}
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

            {!isPresenting && (
              <div
                className="flex items-center gap-1 px-1.5 py-1.5 rounded-lg border border-white/10"
                style={{ backgroundColor: 'rgba(0, 0, 0, 0.95)' }}
              >
                {/* Generate split button */}
                <div className="relative flex items-center">
                  <button
                    onClick={() => handleGenerate(false)}
                    className="flex items-center gap-1.5 pl-3 pr-1.5 py-1.5 text-white hover:bg-white/10 rounded-l-md text-xs font-medium transition-colors"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    Generate
                  </button>
                  <button
                    onClick={() => setShowGenerateDropdown(!showGenerateDropdown)}
                    className="flex items-center px-1 py-1.5 text-white/60 hover:text-white hover:bg-white/10 rounded-r-md transition-colors border-l border-white/10"
                    title="Choose style"
                  >
                    <ChevronDown className="w-3 h-3" />
                  </button>

                  {/* Style dropdown */}
                  <AnimatePresence>
                    {showGenerateDropdown && (
                      <>
                        <div
                          className="fixed inset-0 z-[100]"
                          onClick={() => setShowGenerateDropdown(false)}
                        />
                        <div className="absolute left-0 top-full mt-1.5 z-[101]">
                          <motion.div
                            initial={{ opacity: 0, y: -4 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -4 }}
                            transition={{ duration: 0.1 }}
                            className="w-48 rounded-lg shadow-2xl overflow-hidden"
                            style={{
                              backgroundColor: '#09090b',
                              border: '1px solid #27272a',
                            }}
                          >
                            <div style={{ backgroundColor: '#09090b' }}>
                              <div className="px-2.5 py-1.5 border-b border-[#27272a]">
                                <p className="text-[10px] text-[#71717a] uppercase tracking-wider">Generate with style</p>
                              </div>
                              <div className="p-1 max-h-48 overflow-y-auto">
                                {IMAGE_STYLE_PRESETS.map((preset) => (
                                  <button
                                    key={preset.id}
                                    onClick={() => handleGenerate(false, preset.id)}
                                    className="w-full text-left px-2.5 py-1.5 text-xs text-white/90 hover:text-white hover:bg-white/10 rounded transition-colors"
                                  >
                                    {preset.name}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </motion.div>
                        </div>
                      </>
                    )}
                  </AnimatePresence>
                </div>
                <div className="w-px h-4 bg-white/20" />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-white hover:bg-white/10 rounded-md text-xs font-medium transition-colors"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
              </div>
            )}
          </>
        )}
      </motion.div>
    </>
  );
}
