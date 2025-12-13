'use client';

// ============================================
// RIFF - Publish Popover Component
// Dropdown-style publish UI inspired by Lovable
// ============================================

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Copy,
  Check,
  Loader2,
  Globe,
  ExternalLink,
  ChevronDown,
  Code2,
  Cloud,
  CloudOff,
  CloudAlert,
  CloudCheck,
  CloudBackup,
} from 'lucide-react';

export interface PublishStatus {
  isPublished: boolean;
  publishedAt: string | null;
  hasUnpublishedChanges: boolean;
  shareToken: string | null;
}

interface PublishPopoverProps {
  deckId: string;
  deckName: string;
  publishStatus: PublishStatus | null;
  onPublishStatusChange?: (status: PublishStatus) => void;
}

type EmbedSize = 'small' | 'medium' | 'large';

const EMBED_SIZES: Record<EmbedSize, { width: number; height: number; label: string }> = {
  small: { width: 480, height: 270, label: 'S' },
  medium: { width: 640, height: 360, label: 'M' },
  large: { width: 960, height: 540, label: 'L' },
};

export function PublishPopover({
  deckId,
  deckName,
  publishStatus: initialStatus,
  onPublishStatusChange
}: PublishPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [status, setStatus] = useState<PublishStatus | null>(initialStatus);
  const [publishing, setPublishing] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showEmbed, setShowEmbed] = useState(false);
  const [embedSize, setEmbedSize] = useState<EmbedSize>('medium');
  const [embedCopied, setEmbedCopied] = useState(false);
  const [unpublishing, setUnpublishing] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Update status when prop changes
  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const getShareUrl = () => {
    if (!status?.shareToken) return '';
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.riff.im';
    return `${baseUrl}/p/${status.shareToken}`;
  };

  // Collect all image URLs from localStorage for publishing
  const collectImageUrls = (): Record<string, string> => {
    const imageUrls: Record<string, string> = {};
    if (typeof window === 'undefined') return imageUrls;

    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('vibe-image-')) {
        const url = localStorage.getItem(key);
        if (url) {
          imageUrls[key] = url;
        }
      }
    }

    const imageStyle = localStorage.getItem('vibe-slides-image-style') || 'none';
    imageUrls['__imageStyle__'] = imageStyle;

    return imageUrls;
  };

  const handlePublish = async () => {
    try {
      setPublishing(true);
      setError(null);

      const imageUrls = collectImageUrls();

      const res = await fetch(`/api/decks/${deckId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageUrls }),
      });

      if (!res.ok) throw new Error('Failed to publish');

      const data = await res.json();
      const newStatus: PublishStatus = {
        isPublished: true,
        publishedAt: data.publishedAt,
        hasUnpublishedChanges: false,
        shareToken: data.shareToken,
      };

      setStatus(newStatus);
      onPublishStatusChange?.(newStatus);
    } catch (err) {
      setError('Failed to publish');
      console.error(err);
    } finally {
      setPublishing(false);
    }
  };

  const handleCopy = async () => {
    const url = getShareUrl();
    if (url) {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const getEmbedCode = () => {
    if (!status?.shareToken) return '';
    const { width, height } = EMBED_SIZES[embedSize];
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://www.riff.im';
    return `<iframe src="${baseUrl}/embed/${status.shareToken}" width="${width}" height="${height}" frameborder="0" allowfullscreen style="border-radius: 8px;"></iframe>`;
  };

  const handleCopyEmbed = async () => {
    const code = getEmbedCode();
    await navigator.clipboard.writeText(code);
    setEmbedCopied(true);
    setTimeout(() => setEmbedCopied(false), 2000);
  };

  const handleUnpublish = async () => {
    try {
      setUnpublishing(true);
      setError(null);

      const res = await fetch(`/api/decks/${deckId}/publish`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to unpublish');

      const newStatus: PublishStatus = {
        isPublished: false,
        publishedAt: null,
        hasUnpublishedChanges: false,
        shareToken: null,
      };

      setStatus(newStatus);
      onPublishStatusChange?.(newStatus);
      setShowEmbed(false);
    } catch (err) {
      setError('Failed to unpublish');
      console.error(err);
    } finally {
      setUnpublishing(false);
    }
  };

  const formatRelativeTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${diffDays}d ago`;
  };

  // Button states
  const getButtonState = () => {
    if (!status) return { label: 'Publish', variant: 'default' as const };
    if (!status.isPublished) return { label: 'Publish', variant: 'default' as const };
    if (status.hasUnpublishedChanges) return { label: 'Publish', variant: 'warning' as const };
    return { label: 'Published', variant: 'success' as const };
  };

  const buttonState = getButtonState();

  return (
    <div className="relative" ref={popoverRef}>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-2 px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200
          ${buttonState.variant === 'success'
            ? 'text-emerald-400 hover:bg-emerald-500/10'
            : buttonState.variant === 'warning'
            ? 'text-amber-400 hover:bg-amber-500/10'
            : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
          }
        `}
      >
        {buttonState.variant === 'success' ? (
          <CloudCheck className="w-4 h-4" />
        ) : buttonState.variant === 'warning' ? (
          <CloudAlert className="w-4 h-4" />
        ) : (
          <Cloud className="w-4 h-4" />
        )}
        <span>{buttonState.label}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.23, 1, 0.32, 1] }}
            className="absolute right-0 top-full mt-2 w-80 z-50"
          >
            <div className="bg-[#0c0c0c] border border-zinc-800 rounded-xl shadow-2xl shadow-black/50 overflow-hidden">
              {/* Header */}
              <div className="px-4 py-3 border-b border-zinc-800/50">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold text-zinc-100">Publish</span>
                  {status?.isPublished && (
                    <span className="flex items-center gap-1.5 px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                      Live
                    </span>
                  )}
                </div>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Warning for unpublished changes */}
                {status?.hasUnpublishedChanges && (
                  <div className="flex items-center gap-2.5 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                    <CloudAlert className="w-4 h-4 text-amber-400 flex-shrink-0" />
                    <p className="text-xs font-medium text-amber-400">You have unpublished changes</p>
                  </div>
                )}

                {/* URL Section - only show if published */}
                {status?.isPublished && status.shareToken && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 flex items-center gap-2 h-9 px-3 bg-zinc-900 border border-zinc-800 rounded-lg">
                        <Globe className="w-3.5 h-3.5 text-zinc-500 flex-shrink-0" />
                        <span className="text-xs text-zinc-400 truncate font-mono">
                          {getShareUrl().replace('https://', '').replace('http://', '')}
                        </span>
                      </div>
                      <button
                        onClick={handleCopy}
                        className="flex items-center justify-center h-9 w-9 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors"
                      >
                        {copied ? (
                          <Check className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <Copy className="w-4 h-4 text-zinc-400" />
                        )}
                      </button>
                    </div>

                    {/* Preview link */}
                    <a
                      href={getShareUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-zinc-500 hover:text-zinc-300 transition-colors"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Open preview</span>
                      {status.publishedAt && (
                        <span className="text-zinc-600">· {formatRelativeTime(status.publishedAt)}</span>
                      )}
                    </a>
                  </div>
                )}

                {/* Error */}
                {error && (
                  <div className="text-xs text-red-400 text-center py-2">{error}</div>
                )}

                {/* Publish Button */}
                <button
                  onClick={handlePublish}
                  disabled={publishing}
                  className={`
                    w-full h-10 px-4 text-sm font-medium rounded-lg transition-all duration-200
                    flex items-center justify-center gap-2
                    disabled:opacity-50 disabled:cursor-not-allowed
                    ${status?.isPublished
                      ? status.hasUnpublishedChanges
                        ? 'bg-amber-500 hover:bg-amber-400 text-black'
                        : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-300'
                      : 'bg-white hover:bg-zinc-100 text-black'
                    }
                  `}
                >
                  {publishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Publishing...</span>
                    </>
                  ) : (
                    <>
                      {status?.isPublished ? (
                        status.hasUnpublishedChanges ? (
                          <CloudAlert className="w-4 h-4" />
                        ) : (
                          <CloudBackup className="w-4 h-4" />
                        )
                      ) : (
                        <Cloud className="w-4 h-4" />
                      )}
                      <span>
                        {status?.isPublished
                          ? status.hasUnpublishedChanges
                            ? 'Push changes'
                            : 'Republish'
                          : 'Publish'
                        }
                      </span>
                    </>
                  )}
                </button>

                {/* Embed Section - only show if published */}
                {status?.isPublished && (
                  <div className="pt-2 border-t border-zinc-800/50">
                    <button
                      onClick={() => setShowEmbed(!showEmbed)}
                      className="flex items-center justify-between w-full py-2 text-left group"
                    >
                      <div className="flex items-center gap-2">
                        <Code2 className="w-4 h-4 text-zinc-500" />
                        <span className="text-xs font-medium text-zinc-400 group-hover:text-zinc-300 transition-colors">
                          Embed code
                        </span>
                      </div>
                      <ChevronDown
                        className={`w-3.5 h-3.5 text-zinc-500 transition-transform duration-200 ${
                          showEmbed ? 'rotate-180' : ''
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {showEmbed && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.15 }}
                          className="overflow-hidden"
                        >
                          <div className="pt-2 space-y-3">
                            {/* Size selector */}
                            <div className="flex gap-1">
                              {(Object.keys(EMBED_SIZES) as EmbedSize[]).map((size) => (
                                <button
                                  key={size}
                                  onClick={() => setEmbedSize(size)}
                                  className={`flex-1 h-7 text-xs font-medium rounded-md transition-colors ${
                                    embedSize === size
                                      ? 'bg-zinc-700 text-white'
                                      : 'bg-zinc-900 text-zinc-500 hover:text-zinc-300 border border-zinc-800'
                                  }`}
                                >
                                  {EMBED_SIZES[size].label}
                                </button>
                              ))}
                            </div>

                            {/* Code */}
                            <pre className="p-2.5 bg-zinc-900 border border-zinc-800 rounded-lg text-[10px] text-zinc-500 overflow-x-auto whitespace-pre-wrap break-all font-mono leading-relaxed">
                              {getEmbedCode()}
                            </pre>

                            {/* Copy */}
                            <button
                              onClick={handleCopyEmbed}
                              className="w-full h-8 text-xs font-medium bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 text-zinc-400"
                            >
                              {embedCopied ? (
                                <>
                                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                                  <span className="text-emerald-400">Copied!</span>
                                </>
                              ) : (
                                <>
                                  <Copy className="w-3.5 h-3.5" />
                                  <span>Copy code</span>
                                </>
                              )}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* Unpublish Button - only show if published */}
                {status?.isPublished && (
                  <div className="pt-2 border-t border-zinc-800/50">
                    <button
                      onClick={handleUnpublish}
                      disabled={unpublishing}
                      className="flex items-center gap-2 w-full py-2 text-xs text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
                    >
                      {unpublishing ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <CloudOff className="w-3.5 h-3.5" />
                      )}
                      <span>{unpublishing ? 'Unpublishing...' : 'Unpublish'}</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
