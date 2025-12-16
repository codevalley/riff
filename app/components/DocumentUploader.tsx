'use client';

// ============================================
// RIFF - Document Uploader Component
// Refined editorial aesthetic with engaging states
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  AlertCircle,
  FileUp,
  ChevronDown,
  Wand2,
  Check,
  Lightbulb,
  Clipboard,
  Plus,
} from 'lucide-react';
import { RiffIcon } from '@/components/RiffIcon';
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

// Animated background orbs for converting state
function ConvertingOrbs() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {[...Array(3)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-64 h-64 rounded-full"
          style={{
            background: `radial-gradient(circle, rgba(255,255,255,0.03) 0%, transparent 70%)`,
            left: `${20 + i * 30}%`,
            top: `${30 + i * 15}%`,
          }}
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.6, 0.3],
            x: [0, 20, 0],
            y: [0, -10, 0],
          }}
          transition={{
            duration: 3 + i * 0.5,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.3,
          }}
        />
      ))}
    </div>
  );
}

// Success particles animation
function SuccessParticles() {
  const particles = [...Array(12)].map((_, i) => ({
    id: i,
    x: Math.cos((i / 12) * Math.PI * 2) * 60,
    y: Math.sin((i / 12) * Math.PI * 2) * 60,
    delay: i * 0.05,
    size: 4 + Math.random() * 4,
  }));

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-emerald-400"
          style={{ width: p.size, height: p.size }}
          initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
          animate={{
            opacity: [0, 1, 0],
            x: p.x,
            y: p.y,
            scale: [0, 1, 0.5],
          }}
          transition={{
            duration: 0.8,
            delay: p.delay,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  );
}

// Custom select component
function CustomSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div ref={ref} className="relative z-20">
      <label className="block text-[11px] font-medium text-white/40 uppercase tracking-wider mb-2">
        {label}
      </label>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white/90 text-left flex items-center justify-between hover:border-white/20 hover:bg-white/[0.05] transition-all duration-200"
      >
        <span>{selectedOption?.label}</span>
        <ChevronDown
          className={`w-4 h-4 text-white/40 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.98 }}
            transition={{ duration: 0.15 }}
            className="absolute z-50 w-full mt-2 py-1 bg-[#141414] border border-white/10 rounded-xl shadow-2xl overflow-hidden"
          >
            {options.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  onChange(option.value);
                  setIsOpen(false);
                }}
                className={`w-full px-4 py-2.5 text-sm text-left transition-colors ${
                  value === option.value
                    ? 'bg-white/10 text-white'
                    : 'text-white/70 hover:bg-white/5 hover:text-white'
                }`}
              >
                {option.label}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function DocumentUploader({ onClose, onSuccess }: DocumentUploaderProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [status, setStatus] = useState<ConversionStatus>('idle');
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [documentContent, setDocumentContent] = useState<string | null>(null);
  const [createdDeckId, setCreatedDeckId] = useState<string | null>(null);
  const [createdDeckName, setCreatedDeckName] = useState<string | null>(null);
  const [slideCount, setSlideCount] = useState<number | null>(null);
  const [showParticles, setShowParticles] = useState(false);

  const [options, setOptions] = useState<ConversionOptions>({
    slideCount: 'auto',
    style: 'professional',
    includeSpeakerNotes: true,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [showContextField, setShowContextField] = useState(false);

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
      if (documentContent) return;
      setPasteError(null);

      try {
        const text = e.clipboardData?.getData('text');
        if (text && text.trim().length > 0) {
          e.preventDefault();
          handlePastedText(text);
        }
      } catch (err) {
        console.error('Paste error:', err);
        setPasteError('Unable to access clipboard. Try the paste button instead.');
      }
    };

    document.addEventListener('paste', handlePaste);
    return () => document.removeEventListener('paste', handlePaste);
  }, [documentContent, handlePastedText]);

  // Handle explicit paste button click (fallback for browsers with issues)
  const handlePasteFromClipboard = async () => {
    setPasteError(null);

    try {
      // Check if clipboard API is available
      if (!navigator.clipboard || !navigator.clipboard.readText) {
        setPasteError('Clipboard not supported. Try Ctrl/Cmd+V instead.');
        return;
      }

      const text = await navigator.clipboard.readText();

      if (!text || text.trim().length === 0) {
        setPasteError('Clipboard is empty. Copy some text first.');
        return;
      }

      handlePastedText(text);
    } catch (err) {
      console.error('Clipboard access error:', err);

      // Provide specific error messages
      if (err instanceof DOMException && err.name === 'NotAllowedError') {
        setPasteError('Clipboard permission denied. Allow access or use Ctrl/Cmd+V.');
      } else {
        setPasteError('Unable to access clipboard. Try Ctrl/Cmd+V instead.');
      }
    }
  };

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
    setPasteError(null);
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
          context: customContext.trim() || undefined,
        }),
      });

      if (response.status === 401 || response.redirected) {
        sessionStorage.setItem('riff-pending-document', JSON.stringify({
          content: documentContent,
          name: fileName,
          options,
        }));
        router.push('/auth/signin?callbackUrl=/editor');
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Conversion failed');
      }

      setCreatedDeckId(data.deck.id);
      setCreatedDeckName(data.deck.name);
      setSlideCount(data.slideCount);
      setShowParticles(true);
      setStatus('success');
      setTimeout(() => setShowParticles(false), 1000);
    } catch (err) {
      if (err instanceof SyntaxError) {
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
        onSuccess(createdDeckId);
        onClose();
      } else {
        router.push(`/editor?deck=${encodeURIComponent(createdDeckId)}`);
      }
    }
  };

  // Converting state messages that cycle
  const convertingMessages = [
    'Analyzing structure...',
    'Crafting slides...',
    'Optimizing content...',
    'Almost there...',
  ];
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    if (status === 'converting') {
      const interval = setInterval(() => {
        setMessageIndex((i) => (i + 1) % convertingMessages.length);
      }, 2000);
      return () => clearInterval(interval);
    } else {
      setMessageIndex(0);
    }
  }, [status]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={status === 'converting' ? undefined : onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl"
      >
        {/* Converting State - Full Takeover */}
        <AnimatePresence mode="wait">
          {status === 'converting' && (
            <motion.div
              key="converting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative py-20 px-6"
            >
              <ConvertingOrbs />

              <div className="relative z-10 text-center">
                {/* Riff icon with subtle pulse */}
                <motion.div
                  className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center"
                  animate={{ scale: [1, 1.02, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <RiffIcon
                    size={36}
                    primaryColor="rgba(255, 255, 255, 0.8)"
                    secondaryColor="rgba(255, 255, 255, 0.4)"
                  />
                </motion.div>

                {/* Progress text */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-3"
                >
                  <h3 className="text-lg font-medium text-white">
                    Creating your deck
                  </h3>
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={messageIndex}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      transition={{ duration: 0.2 }}
                      className="text-sm text-white/40"
                    >
                      {convertingMessages[messageIndex]}
                    </motion.p>
                  </AnimatePresence>
                </motion.div>

                {/* Progress bar */}
                <div className="mt-10 mx-auto max-w-[200px]">
                  <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-white/40 to-white/60 rounded-full"
                      initial={{ width: '0%' }}
                      animate={{ width: '100%' }}
                      transition={{ duration: 12, ease: 'easeInOut' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Success State */}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="relative py-16 px-6"
            >
              {showParticles && <SuccessParticles />}

              <div className="relative z-10 text-center">
                {/* Riff icon with success badge */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative w-20 h-20 mx-auto mb-8"
                >
                  <div className="w-full h-full rounded-2xl bg-gradient-to-br from-white/10 to-white/5 border border-white/10 flex items-center justify-center">
                    <RiffIcon
                      size={36}
                      primaryColor="rgba(255, 255, 255, 0.9)"
                      secondaryColor="rgba(255, 255, 255, 0.5)"
                    />
                  </div>
                  {/* Success badge */}
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    className="absolute -bottom-1 -right-1 w-7 h-7 bg-emerald-500 rounded-full flex items-center justify-center border-2 border-[#0a0a0a]"
                  >
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  </motion.div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="space-y-2"
                >
                  <h3 className="text-lg font-semibold text-white truncate max-w-[280px] mx-auto">
                    {createdDeckName || 'Your deck'}
                  </h3>
                  <p className="text-sm text-white/40">
                    <span className="text-emerald-400 font-medium">{slideCount} slides</span> ready to present
                  </p>
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35 }}
                  onClick={handleGoToEditor}
                  className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-medium text-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-white/10"
                >
                  <span className="relative z-10">Start editing</span>
                  <motion.span
                    className="relative z-10"
                    animate={{ x: [0, 4, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    →
                  </motion.span>
                  <div className="absolute inset-0 bg-gradient-to-r from-white to-white/90 opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>
              </div>
            </motion.div>
          )}

          {/* Default/Idle State */}
          {(status === 'idle' || status === 'reading' || status === 'error') && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Header */}
              <div className="px-6 pt-6 pb-5 border-b border-white/[0.06]">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-semibold text-white tracking-tight">
                      Import Document
                    </h2>
                    <p className="text-sm text-white/40 mt-1">
                      Transform your content into a presentation
                    </p>
                  </div>
                  <button
                    onClick={onClose}
                    className="p-2 -mr-2 -mt-1 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all duration-200"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="px-6 py-5 pb-6 overflow-visible">
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
                    relative rounded-xl transition-all duration-300
                    ${documentContent
                      ? 'bg-white/[0.02] border border-white/[0.08]'
                      : isDragging
                        ? 'bg-white/[0.06] border-2 border-white/30 border-dashed cursor-pointer'
                        : 'bg-white/[0.02] border-2 border-dashed border-white/[0.08] hover:border-white/20 hover:bg-white/[0.04] cursor-pointer'
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
                    // File selected state - enhanced visual
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-5"
                    >
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
                            <FileText className="w-6 h-6 text-emerald-400/80" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-white truncate">
                            {fileName}
                          </p>
                          <p className="text-xs text-white/40 mt-1">
                            {(documentContent.length / 1000).toFixed(1)}K characters · Ready to convert
                          </p>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            clearFile();
                          }}
                          className="p-2.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white/70 transition-all duration-200"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    // Empty state
                    <div className="py-10 px-6 text-center">
                      {status === 'reading' ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                          className="w-12 h-12 mx-auto mb-4 rounded-xl border-2 border-white/20 border-t-white/60"
                        />
                      ) : (
                        <motion.div
                          className="w-14 h-14 mx-auto mb-4 rounded-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/[0.08] flex items-center justify-center"
                          whileHover={{ scale: 1.05 }}
                          transition={{ duration: 0.2 }}
                        >
                          <FileUp className="w-6 h-6 text-white/40" />
                        </motion.div>
                      )}
                      <p className="text-sm font-medium text-white/80 mb-1.5">
                        {isDragging ? 'Drop your file here' : 'Drop or browse'}
                      </p>
                      <p className="text-xs text-white/40 mb-4">
                        Supports .txt and .md files
                      </p>

                      {/* Paste button fallback */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handlePasteFromClipboard();
                        }}
                        className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white/60 hover:text-white/80 bg-white/[0.03] hover:bg-white/[0.06] border border-white/[0.08] hover:border-white/[0.15] rounded-lg transition-all duration-200"
                      >
                        <Clipboard className="w-4 h-4" />
                        <span>Paste from clipboard</span>
                      </button>

                      {/* Paste error message */}
                      <AnimatePresence>
                        {pasteError && (
                          <motion.p
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className="mt-3 text-xs text-amber-400"
                          >
                            {pasteError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                  )}
                </div>

                {/* Options */}
                <AnimatePresence>
                  {documentContent && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="mt-5 space-y-5"
                    >
                      <div className="grid grid-cols-2 gap-4 relative">
                        <CustomSelect
                          label="Slide count"
                          value={
                            options.slideCount === 'auto'
                              ? 'auto'
                              : options.slideCount === 'full'
                              ? 'full'
                              : String(options.slideCount)
                          }
                          onChange={(v) =>
                            setOptions({
                              ...options,
                              slideCount: v === 'auto' ? 'auto' : v === 'full' ? 'full' : parseInt(v),
                            })
                          }
                          options={[
                            { value: 'auto', label: 'Auto-detect' },
                            { value: 'full', label: 'Full (no reduction)' },
                            { value: '10', label: '~10 slides' },
                            { value: '15', label: '~15 slides' },
                            { value: '20', label: '~20 slides' },
                          ]}
                        />
                        <CustomSelect
                          label="Style"
                          value={options.style}
                          onChange={(v) =>
                            setOptions({
                              ...options,
                              style: v as ConversionOptions['style'],
                            })
                          }
                          options={[
                            { value: 'professional', label: 'Professional' },
                            { value: 'minimal', label: 'Minimal' },
                            { value: 'creative', label: 'Creative' },
                          ]}
                        />
                      </div>

                      {/* Checkbox */}
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
                          <div className="w-5 h-5 border border-white/20 rounded-md bg-white/[0.03] peer-checked:bg-white peer-checked:border-white transition-all duration-200" />
                          <svg
                            className="absolute inset-0 w-5 h-5 text-black opacity-0 peer-checked:opacity-100 transition-opacity duration-200 p-1"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        </div>
                        <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors duration-200">
                          Include speaker notes
                        </span>
                      </label>

                      {/* Additional Context - Collapsible */}
                      <AnimatePresence mode="wait">
                        {!showContextField ? (
                          <motion.button
                            key="trigger"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0, height: 0 }}
                            onClick={() => setShowContextField(true)}
                            className="flex items-center gap-2 text-sm text-white/40 hover:text-white/60 transition-colors duration-200 py-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>Add instructions</span>
                          </motion.button>
                        ) : (
                          <motion.div
                            key="field"
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <div className="relative p-3 bg-white/[0.02] rounded-lg border border-white/[0.06]">
                              <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                                  Instructions
                                </label>
                                <button
                                  onClick={() => {
                                    setShowContextField(false);
                                    setCustomContext('');
                                  }}
                                  className="p-1 -mr-1 hover:bg-white/5 rounded text-white/30 hover:text-white/60 transition-all duration-200"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </div>
                              <textarea
                                value={customContext}
                                onChange={(e) => setCustomContext(e.target.value)}
                                placeholder="e.g., This is for a tech-savvy startup audience. Keep it punchy and minimal..."
                                rows={2}
                                className="w-full bg-transparent text-sm text-white/80 placeholder:text-white/25 resize-none outline-none border-none focus:ring-0 leading-relaxed"
                                style={{ boxShadow: 'none' }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Error */}
                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="mt-4 flex items-start gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl"
                    >
                      <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-red-400">{error}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Convert Button */}
                <AnimatePresence>
                  {documentContent && (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      onClick={handleConvert}
                      className="mt-5 w-full flex items-center justify-center gap-2.5 px-4 py-3.5 bg-white hover:bg-white/90 rounded-xl text-black text-sm font-medium transition-all duration-200 group relative z-10"
                    >
                      <Wand2 className="w-4 h-4 transition-transform duration-300 group-hover:rotate-12" />
                      <span>Create slides</span>
                    </motion.button>
                  )}
                </AnimatePresence>

                {/* Tip callout - only show when no document selected */}
                {!documentContent && (
                  <div className="mt-6 pt-5 border-t border-white/[0.06]">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                        <Lightbulb className="w-4 h-4 text-amber-400" />
                      </div>
                      <div>
                        <p className="text-xs font-medium text-white/60 mb-1">
                          Don&apos;t have content ready?
                        </p>
                        <p className="text-xs text-white/40 leading-relaxed">
                          Use{' '}
                          <a href="https://chat.openai.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">ChatGPT</a>,{' '}
                          <a href="https://claude.ai" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Claude</a>, or{' '}
                          <a href="https://gemini.google.com" target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white underline underline-offset-2 transition-colors">Gemini</a>{' '}
                          to draft an outline, then import it here.
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
