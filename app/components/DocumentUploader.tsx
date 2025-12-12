'use client';

import { useState, useRef, useCallback } from 'react';
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
} from 'lucide-react';
import { useRouter } from 'next/navigation';

interface DocumentUploaderProps {
  onClose: () => void;
}

type ConversionStatus = 'idle' | 'reading' | 'converting' | 'success' | 'error';

interface ConversionOptions {
  slideCount: 'auto' | number;
  style: 'professional' | 'minimal' | 'creative';
  includeSpeakerNotes: boolean;
}

export function DocumentUploader({ onClose }: DocumentUploaderProps) {
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

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
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

    // Validate file size (max 1MB for text)
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

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setCreatedDeckId(data.deck.id);
      setSlideCount(data.slideCount);
      setStatus('success');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Conversion failed');
      setStatus('error');
    }
  };

  const handleGoToEditor = () => {
    if (createdDeckId) {
      router.push(`/editor?deck=${encodeURIComponent(createdDeckId)}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative w-full max-w-lg bg-surface border border-border rounded-xl shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-text-tertiary" />
            <span className="text-sm font-medium">Import Document</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-surface-hover rounded-md text-text-tertiary hover:text-text-primary transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {status === 'success' ? (
            // Success state
            <div className="text-center py-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-green-500/10 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-500" />
              </div>
              <h3 className="text-lg font-medium mb-2">Conversion Complete!</h3>
              <p className="text-sm text-text-secondary mb-6">
                Created {slideCount} slides from your document
              </p>
              <button
                onClick={handleGoToEditor}
                className="inline-flex items-center gap-2 px-6 py-3 bg-text-primary text-background rounded-lg font-medium hover:bg-text-secondary transition-colors"
              >
                Open in Editor
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Drop Zone */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`
                  relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                  transition-colors
                  ${
                    isDragging
                      ? 'border-text-primary bg-surface-hover'
                      : 'border-border hover:border-border-hover'
                  }
                  ${documentContent ? 'bg-surface-hover' : ''}
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

                {status === 'reading' ? (
                  <Loader2 className="w-8 h-8 mx-auto mb-3 text-text-tertiary animate-spin" />
                ) : documentContent ? (
                  <FileText className="w-8 h-8 mx-auto mb-3 text-text-secondary" />
                ) : (
                  <Upload className="w-8 h-8 mx-auto mb-3 text-text-tertiary" />
                )}

                <p className="text-sm text-text-secondary mb-1">
                  {documentContent
                    ? fileName
                    : isDragging
                      ? 'Drop file here'
                      : 'Drop a document or click to upload'}
                </p>
                <p className="text-xs text-text-quaternary">
                  {documentContent
                    ? `${(documentContent.length / 1000).toFixed(1)}K characters`
                    : 'Supports .txt and .md files'}
                </p>
              </div>

              {/* Options */}
              {documentContent && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-text-tertiary mb-2">Slide Count</label>
                      <select
                        value={options.slideCount === 'auto' ? 'auto' : String(options.slideCount)}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            slideCount:
                              e.target.value === 'auto' ? 'auto' : parseInt(e.target.value),
                          })
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:border-border-focus focus:outline-none transition-colors"
                      >
                        <option value="auto">Auto-detect</option>
                        <option value="5">~5 slides</option>
                        <option value="10">~10 slides</option>
                        <option value="15">~15 slides</option>
                        <option value="20">~20 slides</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-text-tertiary mb-2">Style</label>
                      <select
                        value={options.style}
                        onChange={(e) =>
                          setOptions({
                            ...options,
                            style: e.target.value as ConversionOptions['style'],
                          })
                        }
                        className="w-full px-3 py-2 bg-background border border-border rounded-lg text-sm text-text-primary focus:border-border-focus focus:outline-none transition-colors"
                      >
                        <option value="professional">Professional</option>
                        <option value="minimal">Minimal</option>
                        <option value="creative">Creative</option>
                      </select>
                    </div>
                  </div>

                  <label className="flex items-center gap-3 cursor-pointer group">
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
                      <div className="w-5 h-5 border border-border rounded bg-background peer-checked:bg-text-primary peer-checked:border-text-primary transition-colors" />
                      <CheckCircle className="absolute inset-0 w-5 h-5 text-background opacity-0 peer-checked:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-sm text-text-secondary group-hover:text-text-primary transition-colors">
                      Include speaker notes
                    </span>
                  </label>
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="flex items-center gap-2 p-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-500">{error}</p>
                </div>
              )}

              {/* Convert Button */}
              {documentContent && (
                <button
                  onClick={handleConvert}
                  disabled={status === 'converting'}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-text-primary hover:bg-text-secondary disabled:bg-surface disabled:text-text-quaternary rounded-lg text-background text-sm font-medium transition-colors"
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
                </button>
              )}
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
