'use client';

// ============================================
// VIBE SLIDES - Image Placeholder Component
// ============================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { ImageIcon, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useStore } from '@/lib/store';

// Use regular img tag to avoid Next.js image optimizer timeout issues in dev

interface ImagePlaceholderProps {
  description: string;
  imageUrl?: string;
  status?: 'pending' | 'generating' | 'ready' | 'error';
  isPresenting?: boolean;
}

export function ImagePlaceholder({
  description,
  imageUrl,
  status = 'pending',
  isPresenting = false,
}: ImagePlaceholderProps) {
  const [localUrl, setLocalUrl] = useState<string | null>(imageUrl || null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { imageCache, cacheImage } = useStore();

  // Check cache first
  const cachedUrl = imageCache[description] || localUrl;

  const handleGenerate = async (forceRegenerate = false) => {
    setIsGenerating(true);
    setError(null);

    try {
      const response = await fetch('/api/generate-image', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          forceRegenerate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate image');
      }

      if (data.url) {
        setLocalUrl(data.url);
        cacheImage(description, data.url);
      } else if (data.placeholder) {
        setError(data.message || 'Image generation not available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate image');
    } finally {
      setIsGenerating(false);
    }
  };

  // If we have a cached URL, show the image
  if (cachedUrl) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative w-full aspect-video rounded-xl overflow-hidden group"
      >
        {/* Using regular img to avoid Next.js image optimizer timeout in dev */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cachedUrl}
          alt={description}
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
        />

        {/* Regenerate button (hover) */}
        {!isPresenting && (
          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
            <button
              onClick={() => handleGenerate(true)}
              disabled={isGenerating}
              className="flex items-center gap-2 px-4 py-2 bg-slide-accent text-slide-bg rounded-lg font-medium text-sm hover:bg-slide-accent/90 transition-colors disabled:opacity-50"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4" />
              )}
              Regenerate
            </button>
          </div>
        )}

        {/* Description tooltip */}
        <div className="absolute bottom-0 left-0 right-0 p-3 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
          <p className="text-white/80 text-sm truncate">{description}</p>
        </div>
      </motion.div>
    );
  }

  // Show placeholder with generate button
  return (
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
      {isGenerating ? (
        <>
          <div className="relative">
            <Loader2 className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-accent animate-spin`} />
            <Sparkles className="w-6 h-6 text-slide-accent absolute -top-1 -right-1 animate-pulse" />
          </div>
          <p className={`text-slide-muted ${isPresenting ? 'text-xl' : 'text-sm'}`}>
            Generating image...
          </p>
        </>
      ) : error ? (
        <>
          <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />
          <p className={`text-red-400 ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
            {error}
          </p>
          <button
            onClick={() => handleGenerate(false)}
            className="px-4 py-2 bg-slide-accent text-slide-bg rounded-lg font-medium text-sm hover:bg-slide-accent/90 transition-colors"
          >
            Try Again
          </button>
        </>
      ) : (
        <>
          <ImageIcon className={`${isPresenting ? 'w-16 h-16' : 'w-10 h-10'} text-slide-muted/50`} />

          <p className={`text-slide-muted ${isPresenting ? 'text-xl' : 'text-sm'} text-center max-w-md`}>
            {description}
          </p>

          {!isPresenting && (
            <button
              onClick={() => handleGenerate(false)}
              className="flex items-center gap-2 px-4 py-2 bg-slide-accent text-slide-bg rounded-lg font-medium text-sm hover:bg-slide-accent/90 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              Generate Image
            </button>
          )}
        </>
      )}
    </motion.div>
  );
}
