'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Upload,
  X,
  FileText,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Lightbulb,
  FileUp,
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DocumentUploaderProps {
  onClose: () => void;
  onSuccess?: (deckId: string) => void;
}

type ConversionStatus = 'idle' | 'reading' | 'converting' | 'success' | 'error';

interface ConversionOptions {
  slideCount: 'auto' | 'full' | number;
  style: 'professional' | 'minimal' | 'creative';
  includeSpeakerNotes: boolean;
}

export function DocumentUploader({ onClose, onSuccess }: DocumentUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState<number | null>(null);

  const [options, setOptions] = useState<ConversionOptions>({
    slideCount: 'auto',
    style: 'professional',
    includeSpeakerNotes: true,
  });

  const [isDragging, setIsDragging] = useState(false);

  // Handle pasted text content
  const handlePastedText = useCallback((text: string) => {
    if (text.trim().length < 100) {
      setError('Content too short. Please provide at least 100 characters.');
      return;
    }

    if (text.length > 1024 * 1024) {
      setError('Content too large. Maximum size: 1MB');
      return;
    }

    setError(null);
    setFileName('Pasted content');
    setDocumentContent(text);
  }, []);

  // Listen for paste events when modal is open
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      // Don't handle paste if we already have content
      if (documentContent) return;

      const text = e.clipboardData?.getData('text');
      if (text && text.trim().length > 0) {
        e.preventDefault();
        handlePastedText(text);
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [documentContent, handlePastedText]);

  const handleFileSelect = useCallback(async (file: File) => {
    const allowedTypes = ['text/plain', 'text/markdown', 'text/x-markdown'];
    const allowedExtensions = ['.txt', '.md', '.markdown'];

    const hasValidType = allowedTypes.includes(file.type);
    const hasValidExtension = allowedExtensions.some((ext) =>
      file.name.toLowerCase().endsWith(ext)
    );

    if (!hasValidType && !hasValidExtension) {
      setError('Please upload a text or markdown file (.txt, .md)');
      return;
    }

    if (file.size > 1024 * 1024) {
      setError('File too large. Maximum size: 1MB');
      return;
    }

    setStatus('reading');
    setError(null);
    setFileName(file.name);

    try {
      const content = await file.text();

      if (content.trim().length < 100) {
        setError('Document too short. Please provide at least 100 characters of content.');
        setStatus('idle');
        return;
      }

      setDocumentContent(content);
      setStatus('idle');
    } catch {
      setError('Failed to read file');
      setStatus('idle');
    }
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);

      const file = e.dataTransfer.files[0];
      if (file) {
        handleFileSelect(file);
      }
    },
    [handleFileSelect]
  );

  const clearFile = () => {
    setDocumentContent(null);
    setFileName(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleConvert = async () => {
    if (!documentContent || !fileName) return;

    setStatus('converting');
    setError(null);

    try {
      const response = await fetch('/api/convert-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentContent,
          documentName: fileName.replace(/\.(txt|md|markdown)$/i, ''),
          options,
        }),
      });

      // Handle authentication redirect
      if (response.status === 401 || response.redirected) {
        // Store document in sessionStorage for after login
        sessionStorage.setItem('riff-pending-document', JSON.stringify({
          content: documentContent,
          name: fileName,
          options,
        }));
        // Redirect to sign in, then back to editor
        router.push('/auth/signin?callbackUrl=/editor');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setCreatedDeckId(data.deck.id);
      setSlideCount(data.slideCount);
      setStatus('success');
    } catch (err) {
      // Handle JSON parse errors from auth redirects
      if (err instanceof SyntaxError) {
        // Store document in sessionStorage for after login
        sessionStorage.setItem('riff-pending-document', JSON.stringify({
          content: documentContent,
          name: fileName,
          options,
        }));
        router.push('/auth/signin?callbackUrl=/editor');
        return;
      }
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setStatus('error');
    }
  };

  const handleGoToEditor = () => {
    if (createdDeckId) {
      if (onSuccess) {
        // If callback provided (from editor), use it to load the deck
        onSuccess(createdDeckId);
        onClose();
      } else {
        // Otherwise navigate to editor with deck param
        router.push(`/editor?deck=${encodeURIComponent(createdDeckId)}`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-xl font-semibold text-white mb-1">
                Import Document
              </h2>
              <p className="text-sm text-white/50">
                Transform your notes, outlines, or articles into slides
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 -mr-2 -mt-1 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="px-6 pb-6">
          {status === 'success' ? (
            // Success state
            <div className="text-center py-8">
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.1, type: 'spring', stiffness: 200 }}
                className="w-16 h-16 mx-auto mb-5 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center"
              >
                <CheckCircle className="w-8 h-8 text-emerald-400" />
              </motion.div>
              <h3 className="text-lg font-medium text-white mb-2">
                Conversion Complete
              </h3>
              <p className="text-sm text-white/50 mb-8">
                Created <span className="text-white font-medium">{slideCount} slides</span> from your document
              </p>
              <button
                onClick={handleGoToEditor}
                className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-black rounded-xl font-medium text-sm hover:bg-white/90 transition-colors"
              >
                Open in Editor
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Upload Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => !documentContent && fileInputRef.current?.click()}
                className={`
                  relative border rounded-xl transition-all duration-200
                  ${documentContent
                    ? 'border-white/10 bg-white/[0.02]'
                    : isDragging
                      ? 'border-white/30 bg-white/[0.04] cursor-pointer'
                      : 'border-dashed border-white/10 hover:border-white/20 hover:bg-white/[0.02] cursor-pointer'
                  }
                `}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.md,.markdown,text/plain,text/markdown"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleFileSelect(file);
                  }}
                  className="hidden"
                />

                {documentContent ? (
                  // File selected state
                  <div className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white/60" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">{fileName}</p>
                      <p className="text-xs text-white/40 mt-0.5">
                        {(documentContent.length / 1000).toFixed(1)}K characters
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        clearFile();
                      }}
                      className="p-2 hover:bg-white/5 rounded-lg text-white/40 hover:text-white transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  // Empty state
                  <div className="py-10 px-6 text-center">
                    {status === 'reading' ? (
                      <Loader2 className="w-8 h-8 mx-auto mb-4 text-white/30 animate-spin" />
                    ) : (
                      <div className="w-12 h-12 mx-auto mb-4 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center">
                        <FileUp className="w-5 h-5 text-white/40" />
                      </div>
                    )}
                    <p className="text-sm font-medium text-white/80 mb-1">
                      {isDragging ? 'Drop your file here' : 'Drop, paste, or click to browse'}
                    </p>
                    <p className="text-xs text-white/40">
                      Paste text (Ctrl+V) or upload .txt/.md files
                    </p>
                  </div>
                )}
              </div>

              {/* Options - only show when file is selected */}
              {documentContent && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="mt-4 space-y-4"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-2">
                        Slide count
                      </label>
                      <select
                        value={options.slideCount === 'auto' ? 'auto' : options.slideCount === 'full' ? 'full' : String(options.slideCount)}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            slideCount: e.target.value === 'auto' ? 'auto' : e.target.value === 'full' ? 'full' : parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="full">Full (don&apos;t reduce)</option>
                        <option value="10">~10 slides</option>
                        <option value="15">~15 slides</option>
                        <option value="20">~20 slides</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-white/40 mb-2">
                        Style
                      </label>
                      <select
                        value={options.style}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            style: e.target.value as ConversionOptions['style'],
                          })
                        }
                        className="w-full px-3 py-2.5 bg-white/[0.03] border border-white/10 rounded-lg text-sm text-white focus:border-white/20 focus:outline-none transition-colors appearance-none cursor-pointer"
                      >
                        <option value="professional">Professional</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group py-1">
                    <div className="relative">
                      <input
                        type="checkbox"
                        checked={options.includeSpeakerNotes}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            includeSpeakerNotes: e.target.checked,
                          })
                        }
                        className="sr-only peer"
                      />
                      <div className="w-5 h-5 border border-white/20 rounded-md bg-white/[0.03] peer-checked:bg-white peer-checked:border-white transition-all" />
                      <CheckCircle className="absolute inset-0 w-5 h-5 text-black opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                      Include speaker notes
                    </span>
                  </label>
                </motion.div>
              )}

              {/* Error */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-3 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                >
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <p className="text-sm text-red-400">{error}</p>
                </motion.div>
              )}

              {/* Convert Button */}
              {documentContent && (
                <motion.button
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={handleConvert}
                  disabled={status === 'converting'}
                  className="mt-4 w-full flex items-center justify-center gap-2.5 px-4 py-3 bg-white hover:bg-white/90 disabled:bg-white/10 disabled:text-white/30 rounded-xl text-black text-sm font-medium transition-colors"
                >
                  {status === 'converting' ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Convert to Slides
                    </>
                  )}
                </motion.button>
              )}

              {/* Tip callout */}
              <div className="mt-6 pt-5 border-t border-white/[0.06]">
                <div className="flex gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                    <Lightbulb className="w-4 h-4 text-amber-400" />
                  </div>
                  <div>
                    <p className="text-xs font-medium text-white/70 mb-1">
                      Don&apos;t have content ready?
                    </p>
                    <p className="text-xs text-white/40 leading-relaxed">
                      Use{' '}
                      <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">ChatGPT</a>,{' '}
                      <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">Claude</a>, or{' '}
                      <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-white/70 hover:text-white underline underline-offset-2 transition-colors">Gemini</a>{' '}
                      to draft an outline, then import it here.
                    </p>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
