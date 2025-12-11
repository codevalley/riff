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
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { IMAGE_STYLE_PRESETS } from '@/lib/types';

interface ImagePlaceholderProps {
  description: string;
  imageUrl?: string;
  status?: 'pending' | 'generating' | 'ready' | 'error';
  isPresenting?: boolean;
}

// Three separate slots for images
type ImageSlot = 'generated' | 'uploaded' | 'restyled';

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
}: ImagePlaceholderProps) {
  // Image slots - each can have its own URL
  const [slots, setSlots] = useState<ImageSlots>({});
  const [activeSlot, setActiveSlot] = useState<ImageSlot | null>(null);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isRestyling, setIsRestyling] = useState(false);
  const [isCheckingCache, setIsCheckingCache] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showRestyleModal, setShowRestyleModal] = useState(false);
  const [showSlotPicker, setShowSlotPicker] = useState(false);
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

  // Auto-check all slot caches on mount
  useEffect(() => {
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
  }, [description, imageCache, cacheImage, getPersistedSlotUrl]);

  // Generate new image
  const handleGenerate = async (forceRegenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          styleId: imageStyle,
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
      } else if (data.placeholder) {
        setError(data.message || 'Image generation not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // Handle file upload
  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

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
      persistSlotUrl('uploaded', data.url); // Persist to localStorage for page refresh
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
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

  // Restyle Modal
  const renderRestyleModal = () => (
    <AnimatePresence>
      {showRestyleModal && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
          onClick={() => setShowRestyleModal(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-neutral-900 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto border border-neutral-700"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Wand2 className="w-5 h-5 text-purple-400" />
                <h3 className="text-lg font-semibold text-white">Restyle Image</h3>
              </div>
              <button
                onClick={() => setShowRestyleModal(false)}
                className="p-1 hover:bg-neutral-800 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-neutral-400" />
              </button>
            </div>

            <div className="mb-6 rounded-lg overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={activeImageUrl || ''}
                alt="Current image"
                className="w-full aspect-video object-contain bg-neutral-800"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-300 mb-3">
                Select a Style Preset
              </label>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_STYLE_PRESETS.filter(p => p.id !== 'none').map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      setSelectedPreset(preset.id);
                      setCustomPrompt('');
                    }}
                    className={`p-3 text-left rounded-lg border transition-all ${
                      selectedPreset === preset.id
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-neutral-700 hover:border-neutral-600 bg-neutral-800/50'
                    }`}
                  >
                    <div className="font-medium text-sm text-white">{preset.name}</div>
                    <div className="text-xs text-neutral-400 mt-0.5 line-clamp-1">
                      {preset.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-neutral-300 mb-2">
                Or Use Custom Prompt
              </label>
              <textarea
                value={customPrompt}
                onChange={(e) => {
                  setCustomPrompt(e.target.value);
                  if (e.target.value.trim()) setSelectedPreset(null);
                }}
                placeholder="e.g., Transform into a watercolor painting..."
                className="w-full px-4 py-3 bg-neutral-800 border border-neutral-700 rounded-lg text-sm text-white placeholder-neutral-500 focus:outline-none focus:border-purple-500 resize-none"
                rows={3}
              />
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-300 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setShowRestyleModal(false)}
                className="flex-1 px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg font-medium text-sm transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleRestyle}
                disabled={isRestyling || (!selectedPreset && !customPrompt.trim())}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 disabled:bg-neutral-700 disabled:text-neutral-500 text-white rounded-lg font-medium text-sm transition-colors"
              >
                {isRestyling ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Restyling...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-4 h-4" />
                    Apply Style
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
          className="relative w-full aspect-video rounded-xl overflow-hidden group"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={activeImageUrl}
            alt={description}
            className="absolute inset-0 w-full h-full object-contain bg-black/20"
            loading="lazy"
          />

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

          {/* Action buttons (hover) */}
          {!isPresenting && (
            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <button
                onClick={() => handleGenerate(true)}
                disabled={isGenerating}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-600 text-white rounded-lg font-medium text-xs hover:bg-emerald-500 transition-colors disabled:opacity-50"
                title="Generate with AI"
              >
                {isGenerating ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Sparkles className="w-3.5 h-3.5" />
                )}
                Generate
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 text-white rounded-lg font-medium text-xs hover:bg-blue-500 transition-colors disabled:opacity-50"
                title="Upload your own image"
              >
                {isUploading ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Upload className="w-3.5 h-3.5" />
                )}
                Upload
              </button>

              <button
                onClick={() => setShowRestyleModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 bg-purple-600 text-white rounded-lg font-medium text-xs hover:bg-purple-500 transition-colors"
                title="Restyle this image"
              >
                <Wand2 className="w-3.5 h-3.5" />
                Restyle
              </button>
            </div>
          )}

          {/* Description tooltip */}
          <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
            <p className="text-white/80 text-sm truncate">{description}</p>
          </div>
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
        className={`
          relative w-full aspect-video rounded-xl
          bg-slide-surface/30 border-2 border-dashed border-slide-accent/30
          flex flex-col items-center justify-center gap-4
          ${isPresenting ? 'p-8' : 'p-4'}
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
        ) : (
          <>
            <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />

            <p className={`text-slide-muted ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
              {description}
            </p>

            {!isPresenting && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleGenerate(false)}
                  className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg font-medium text-sm hover:bg-emerald-500 transition-colors"
                >
                  <Sparkles className="w-4 h-4" />
                  Generate
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-500 transition-colors"
                >
                  <Upload className="w-4 h-4" />
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
