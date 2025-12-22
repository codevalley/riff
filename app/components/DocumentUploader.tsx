'use client';

// ============================================
// RIFF - Document Uploader Component
// Multi-stage deck generation with tips carousel
// ============================================

import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  FileText,
  AlertCircle,
  FileUp,
  Wand2,
  Check,
  Clipboard,
  Lightbulb,
  ChevronDown,
  ImageIcon,
  Palette,
  Share2,
  Code2,
} from 'lucide-react';
import { RiffIcon } from '@/components/RiffIcon';
import { useRouter } from 'next/navigation';

interface DocumentUploaderProps {
  onClose: () => void;
  onSuccess?: (deckId: string) => void;
}

type ConversionStatus = 'idle' | 'reading' | 'converting' | 'success' | 'error';
type ConversionStage = 'decksmith' | 'packaging' | 'theming' | 'saving';

interface ConversionOptions {
  slideCount: 'auto' | 'full' | number;
  style: 'professional' | 'minimal' | 'creative';
  includeSpeakerNotes: boolean;
}

// Stage configuration
const STAGES: { id: ConversionStage; label: string; messages: string[] }[] = [
  {
    id: 'decksmith',
    label: 'DeckSmith',
    messages: [
      'Analyzing content structure...',
      'Mapping to slide templates...',
      'Organizing narrative flow...',
      'Crafting slide layouts...',
      'Optimizing density...',
    ],
  },
  {
    id: 'packaging',
    label: 'Packaging',
    messages: ['Extracting title...', 'Analyzing theme...'],
  },
  {
    id: 'theming',
    label: 'Theming',
    messages: ['Generating color palette...', 'Selecting typography...'],
  },
  {
    id: 'saving',
    label: 'Finish',
    messages: ['Saving to cloud...'],
  },
];

// Tips for the carousel
const TIPS = [
  {
    icon: ImageIcon,
    title: 'AI Images',
    description: 'Type [image: description] and images appear automatically.',
  },
  {
    icon: Palette,
    title: 'Custom Themes',
    description: 'Describe any style and AI generates matching colors & fonts.',
  },
  {
    icon: Share2,
    title: 'One-Click Publish',
    description: 'Share your deck with a single link. No sign-up required for viewers.',
  },
  {
    icon: Code2,
    title: 'Markdown Native',
    description: 'Edit slides in familiar markdown. Export anytime.',
  },
];

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

// Tips carousel component - fixed height to prevent jumping
function TipsCarousel({ currentTip }: { currentTip: number }) {
  const tip = TIPS[currentTip];
  const Icon = tip.icon;

  return (
    <div className="mb-8">
      {/* Fixed height container to prevent layout shifts */}
      <div className="h-[88px] relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentTip}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-0 bg-white/[0.03] border border-white/[0.08] rounded-xl p-4"
          >
            <div className="flex items-center gap-4 h-full">
              <div className="w-10 h-10 rounded-lg bg-white/[0.05] border border-white/[0.1] flex items-center justify-center flex-shrink-0">
                <Icon className="w-5 h-5 text-white/60" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white/80 mb-0.5">{tip.title}</p>
                <p className="text-sm text-white/40 leading-snug line-clamp-2">{tip.description}</p>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Carousel dots */}
      <div className="flex justify-center gap-1.5 mt-4">
        {TIPS.map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
              i === currentTip ? 'bg-white/60 w-4' : 'bg-white/20'
            }`}
          />
        ))}
      </div>
    </div>
  );
}

// Horizontal stage progress component with animated progress line
function StageProgress({
  currentStage,
  currentMessage,
}: {
  currentStage: ConversionStage;
  currentMessage: string;
}) {
  const currentIndex = STAGES.findIndex((s) => s.id === currentStage);

  // Stage weights for visual spacing (DeckSmith is longest/most complex)
  const stageWeights = [3, 1, 1, 0.5]; // DeckSmith, Packaging, Theming, Saving

  return (
    <div>
      {/* Horizontal progress bar */}
      <div className="flex items-center mb-6">
        {STAGES.map((stage, index) => {
          const isCompleted = index < currentIndex;
          const isCurrent = index === currentIndex;
          const weight = stageWeights[index];

          return (
            <div
              key={stage.id}
              className="flex items-center"
              style={{ flex: index < STAGES.length - 1 ? weight : 0 }}
            >
              {/* Stage circle */}
              <div className="flex flex-col items-center flex-shrink-0">
                <motion.div
                  className={`w-8 h-8 rounded-full flex items-center justify-center border-2 transition-all duration-300 ${
                    isCompleted
                      ? 'border-emerald-500 bg-emerald-500'
                      : isCurrent
                      ? 'border-white bg-white/10'
                      : 'border-white/20 bg-transparent'
                  }`}
                >
                  {isCompleted ? (
                    <Check className="w-4 h-4 text-white" strokeWidth={3} />
                  ) : isCurrent ? (
                    <motion.div
                      className="w-2 h-2 rounded-full bg-white"
                      animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                  ) : null}
                </motion.div>
                <span
                  className={`text-[11px] mt-2 font-medium transition-colors duration-300 whitespace-nowrap ${
                    isCompleted
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-white'
                      : 'text-white/30'
                  }`}
                >
                  {stage.label}
                </span>
              </div>

              {/* Connector line with animated progress */}
              {index < STAGES.length - 1 && (
                <div className="flex-1 mx-3 h-0.5 mt-[-20px] relative overflow-hidden rounded-full bg-white/10">
                  {/* Completed fill */}
                  {isCompleted && (
                    <div className="absolute inset-0 bg-emerald-500 rounded-full" />
                  )}
                  {/* Animated progress for current stage */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-y-0 left-0 bg-gradient-to-r from-white/60 via-white/80 to-white/60 rounded-full"
                      initial={{ left: '-20%', width: '20%' }}
                      animate={{ left: '100%' }}
                      transition={{
                        duration: stage.id === 'decksmith' ? 3 : 1.5,
                        repeat: Infinity,
                        ease: 'linear',
                      }}
                      style={{ width: '30%' }}
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Current stage message */}
      <div className="text-center">
        <AnimatePresence mode="wait">
          <motion.p
            key={currentMessage}
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            transition={{ duration: 0.2 }}
            className="text-sm text-white/50"
          >
            {currentMessage}
          </motion.p>
        </AnimatePresence>
      </div>
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

  // Simplified options - always full content with speaker notes
  const [options] = useState<ConversionOptions>({
    slideCount: 'full',
    style: 'professional',
    includeSpeakerNotes: true,
  });

  const [isDragging, setIsDragging] = useState(false);
  const [pasteError, setPasteError] = useState<string | null>(null);
  const [customContext, setCustomContext] = useState('');
  const [showNotesField, setShowNotesField] = useState(false);
  const [pendingDocumentLoaded, setPendingDocumentLoaded] = useState(false);

  // Multi-stage conversion state
  const [conversionStage, setConversionStage] = useState<ConversionStage>('decksmith');
  const [stageMessage, setStageMessage] = useState('');
  const [currentTip, setCurrentTip] = useState(0);

  // Rotate tips during conversion
  useEffect(() => {
    if (status === 'converting') {
      const interval = setInterval(() => {
        setCurrentTip((prev) => (prev + 1) % TIPS.length);
      }, 4000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Rotate stage messages
  useEffect(() => {
    if (status === 'converting') {
      const stage = STAGES.find((s) => s.id === conversionStage);
      if (stage) {
        let messageIndex = 0;
        setStageMessage(stage.messages[0]);

        const interval = setInterval(() => {
          messageIndex = (messageIndex + 1) % stage.messages.length;
          setStageMessage(stage.messages[messageIndex]);
        }, 2000);

        return () => clearInterval(interval);
      }
    }
  }, [status, conversionStage]);

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

  // Check for pending document from pre-auth upload
  useEffect(() => {
    if (pendingDocumentLoaded) return;

    const pendingData = sessionStorage.getItem('riff-pending-document');
    if (!pendingData) return;

    try {
      const { content, name } = JSON.parse(pendingData);
      sessionStorage.removeItem('riff-pending-document');
      setPendingDocumentLoaded(true);

      // Set the document state - conversion will be triggered by the next useEffect
      setDocumentContent(content);
      setFileName(name);
    } catch (err) {
      console.error('Failed to load pending document:', err);
      sessionStorage.removeItem('riff-pending-document');
    }
  }, [pendingDocumentLoaded]);

  // Auto-start conversion when pending document is loaded
  useEffect(() => {
    if (pendingDocumentLoaded && documentContent && fileName && status === 'idle') {
      // Trigger conversion
      const startConversion = async () => {
        setStatus('converting');
        setConversionStage('decksmith');
        setError(null);

        try {
          // ===== STAGE 1: DeckSmith - Generate deck =====
          const deckResponse = await fetch('/api/generate-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              document: documentContent,
              options,
              context: customContext.trim() || undefined,
            }),
          });

          if (!deckResponse.ok) {
            const deckData = await deckResponse.json();
            throw new Error(deckData.error || 'Failed to generate deck');
          }

          const { markdown, slideCount: generatedSlideCount } = await deckResponse.json();
          setSlideCount(generatedSlideCount);

          // ===== STAGE 2: Packaging =====
          setConversionStage('packaging');
          const metadataResponse = await fetch('/api/generate-deck-metadata', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ markdown }),
          });

          if (!metadataResponse.ok) {
            throw new Error('Failed to extract metadata');
          }

          const { title, themePrompt, imageContext } = await metadataResponse.json();

          // ===== STAGE 3: Theming =====
          setConversionStage('theming');
          const themeResponse = await fetch('/api/generate-theme', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: themePrompt }),
          });

          if (!themeResponse.ok) {
            throw new Error('Failed to generate theme');
          }

          const { css: themeCSS } = await themeResponse.json();

          // ===== STAGE 4: Saving =====
          setConversionStage('saving');
          const saveResponse = await fetch('/api/save-deck', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              markdown,
              title: title || fileName?.replace(/\.(txt|md|markdown)$/i, '') || 'Untitled',
              themeCss: themeCSS,
              themePrompt,
              imageContext,
            }),
          });

          const saveData = await saveResponse.json();
          if (!saveResponse.ok) {
            throw new Error(saveData.error || 'Failed to save deck');
          }

          setCreatedDeckId(saveData.deck.id);
          setCreatedDeckName(saveData.deck.name);
          // Use actual slideCount from save response if available
          if (saveData.slideCount) {
            setSlideCount(saveData.slideCount);
          }
          setStatus('success');
          setShowParticles(true);
        } catch (err) {
          console.error('Conversion error:', err);
          setError(err instanceof Error ? err.message : 'Conversion failed');
          setStatus('error');
        }
      };

      startConversion();
    }
  }, [pendingDocumentLoaded, documentContent, fileName, status, options, customContext]);

  // Handle explicit paste button click (fallback for browsers with issues)
  const handlePasteFromClipboard = async () => {
    setPasteError(null);

    try {
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

  // Multi-stage conversion process
  const handleConvert = async () => {
    if (!documentContent || !fileName) return;

    setError(null);

    // Check auth status first (before showing any progress)
    // This prevents the jarring flash of progress bar before login dialog
    const authCheck = await fetch('/api/credits');
    if (authCheck.status === 401) {
      // Save document for after login
      sessionStorage.setItem('riff-pending-document', JSON.stringify({
        content: documentContent,
        name: fileName,
        options,
      }));
      // Redirect to sign-in with context for custom messaging
      router.push('/auth/signin?callbackUrl=/editor&from=document');
      return;
    }

    // User is authenticated - now show progress and start conversion
    setStatus('converting');
    setConversionStage('decksmith');

    try {
      // ===== STAGE 1: DeckSmith - Generate deck =====
      const deckResponse = await fetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: documentContent,
          options,
          context: customContext.trim() || undefined,
        }),
      });

      const deckData = await deckResponse.json();
      if (!deckResponse.ok) {
        throw new Error(deckData.error || 'Failed to generate deck');
      }

      const { markdown, slideCount: generatedSlideCount } = deckData;
      setSlideCount(generatedSlideCount);

      // ===== STAGE 2: Packaging - Extract title & theme prompt =====
      setConversionStage('packaging');

      const metadataResponse = await fetch('/api/generate-deck-metadata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markdown }),
      });

      const metadataData = await metadataResponse.json();
      if (!metadataResponse.ok) {
        throw new Error(metadataData.error || 'Failed to extract metadata');
      }

      const { title, themePrompt, imageContext } = metadataData;

      // ===== STAGE 3: Theming - Generate CSS =====
      setConversionStage('theming');

      const themeResponse = await fetch('/api/generate-theme', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: themePrompt }),
      });

      const themeData = await themeResponse.json();
      let themeCss = null;
      if (themeResponse.ok) {
        themeCss = themeData.css;
      }
      // Theme generation is optional - continue even if it fails

      // ===== STAGE 4: Saving - Save to database =====
      setConversionStage('saving');

      const saveResponse = await fetch('/api/save-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          markdown,
          title,
          themeCss,
          themePrompt,
          imageContext, // Scene setting for AI-generated images
        }),
      });

      const saveData = await saveResponse.json();
      if (!saveResponse.ok) {
        throw new Error(saveData.error || 'Failed to save deck');
      }

      // Success!
      setCreatedDeckId(saveData.deck.id);
      setCreatedDeckName(saveData.deck.name);
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

  const [isLoadingEditor, setIsLoadingEditor] = useState(false);

  const handleGoToEditor = async () => {
    if (createdDeckId) {
      if (onSuccess) {
        // Show loading state while deck loads
        setIsLoadingEditor(true);
        try {
          await onSuccess(createdDeckId);
        } finally {
          setIsLoadingEditor(false);
        }
        onClose();
      } else {
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
        {/* Converting State - Multi-stage with tips */}
        <AnimatePresence mode="wait">
          {status === 'converting' && (
            <motion.div
              key="converting"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative py-10 px-6"
            >
              <ConvertingOrbs />

              <div className="relative z-10">
                {/* Tips carousel */}
                <TipsCarousel currentTip={currentTip} />

                {/* Stage progress */}
                <StageProgress currentStage={conversionStage} currentMessage={stageMessage} />
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
                  disabled={isLoadingEditor}
                  className="mt-8 group relative inline-flex items-center gap-3 px-8 py-4 bg-white text-black rounded-xl font-medium text-sm overflow-hidden transition-all duration-300 hover:shadow-lg hover:shadow-white/10 disabled:opacity-90"
                >
                  {isLoadingEditor ? (
                    <>
                      <motion.div
                        className="relative z-10 w-4 h-4 border-2 border-black/20 border-t-black rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      />
                      <span className="relative z-10">Loading editor...</span>
                    </>
                  ) : (
                    <>
                      <span className="relative z-10">Start editing</span>
                      <motion.span
                        className="relative z-10"
                        animate={{ x: [0, 4, 0] }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        →
                      </motion.span>
                    </>
                  )}
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
                    // Content preview - sealed document style
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                      className="relative"
                    >
                      {/* Paper-like preview card - warm sepia tone for "document" feel */}
                      <div className="relative overflow-hidden rounded-xl bg-gradient-to-b from-[#1c1a16] to-[#15140f] border border-[#3d382a]/40">
                        {/* Paper texture overlay */}
                        <div
                          className="absolute inset-0 opacity-[0.03]"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                          }}
                        />

                        {/* Decorative corner fold */}
                        <div className="absolute top-0 right-0 w-6 h-6 overflow-hidden">
                          <div className="absolute top-0 right-0 w-8 h-8 bg-gradient-to-bl from-[#0a0a0a] to-[#1c1a16] transform rotate-45 translate-x-4 -translate-y-4" />
                        </div>

                        {/* Header bar */}
                        <div className="relative flex items-center justify-between px-4 py-3 border-b border-[#3d382a]/20">
                          <div className="flex items-center gap-2.5">
                            <FileText className="w-3.5 h-3.5 text-amber-600/50" />
                            <span className="text-xs font-medium text-white/40 truncate max-w-[200px]">
                              {fileName === 'Pasted content' ? 'From clipboard' : fileName}
                            </span>
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              clearFile();
                            }}
                            className="p-1.5 hover:bg-white/10 rounded-lg text-white/30 hover:text-white/60 transition-all duration-200"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Content preview - read-only document feel */}
                        <div className="relative px-4 pt-4 pb-6">
                          {/* Decorative line numbers - faded like old document */}
                          <div className="absolute left-4 top-4 flex flex-col gap-[7px] text-[10px] text-amber-900/20 font-mono select-none">
                            {[1, 2, 3, 4, 5].map((n) => (
                              <span key={n}>{n}</span>
                            ))}
                          </div>

                          {/* Actual content preview */}
                          <div className="pl-6 space-y-1.5">
                            {documentContent
                              .split('\n')
                              .filter(line => line.trim())
                              .slice(0, 5)
                              .map((line, i) => (
                                <motion.p
                                  key={i}
                                  initial={{ opacity: 0, x: -4 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: i * 0.05 }}
                                  className="text-[13px] text-white/50 leading-relaxed truncate select-none"
                                  style={{ fontFamily: "'Georgia', serif" }}
                                >
                                  {line.slice(0, 60)}{line.length > 60 ? '...' : ''}
                                </motion.p>
                              ))}
                          </div>

                          {/* Fade gradient with "more content" indicator */}
                          <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-[#15140f] via-[#15140f]/80 to-transparent pointer-events-none" />
                        </div>

                        {/* Footer with stats and overflow indicator */}
                        <div className="relative flex items-center justify-between px-4 py-2.5 border-t border-[#3d382a]/15 bg-[#0f0e0a]/50">
                          <span className="text-[11px] text-white/25">
                            {(documentContent.length / 1000).toFixed(1)}K characters
                          </span>
                          {/* More content indicator */}
                          {documentContent.split('\n').filter(l => l.trim()).length > 5 && (
                            <span className="text-[10px] text-amber-600/40 font-medium">
                              +{documentContent.split('\n').filter(l => l.trim()).length - 5} more lines
                            </span>
                          )}
                        </div>
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

                {/* Notes for AI - Collapsible */}
                <AnimatePresence>
                  {documentContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      transition={{ delay: 0.1 }}
                      className="mt-4"
                    >
                      {!showNotesField ? (
                        // Collapsed state - clickable trigger
                        <button
                          onClick={() => setShowNotesField(true)}
                          className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 hover:bg-amber-500/10 hover:border-amber-500/30 transition-all duration-200 group"
                        >
                          <div className="flex items-center gap-2.5">
                            <Wand2 className="w-4 h-4 text-amber-400/70 group-hover:text-amber-400 transition-colors" />
                            <span className="text-sm text-amber-400/80 group-hover:text-amber-400 transition-colors">
                              Notes for AI
                            </span>
                            <span className="text-[10px] text-white/20 italic">optional</span>
                          </div>
                          <ChevronDown className="w-4 h-4 text-amber-400/40 group-hover:text-amber-400/60 transition-colors" />
                        </button>
                      ) : (
                        // Expanded state - editable field
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="relative group"
                        >
                          {/* Amber glow effect on focus */}
                          <div className="absolute -inset-px rounded-xl bg-gradient-to-r from-amber-500/0 via-amber-500/0 to-amber-500/0 group-focus-within:from-amber-500/20 group-focus-within:via-amber-500/10 group-focus-within:to-orange-500/20 transition-all duration-300 blur-sm" />

                          <div className="relative rounded-xl bg-[#141210] border border-amber-500/20 group-focus-within:border-amber-500/40 transition-colors duration-200 overflow-hidden">
                            {/* Header with collapse button */}
                            <button
                              onClick={() => {
                                if (!customContext.trim()) {
                                  setShowNotesField(false);
                                }
                              }}
                              className="w-full flex items-center justify-between px-3 pt-3 pb-2 hover:bg-white/[0.02] transition-colors"
                            >
                              <div className="flex items-center gap-2">
                                <Wand2 className="w-3.5 h-3.5 text-amber-400/60" />
                                <span className="text-[11px] font-medium text-amber-400/70 uppercase tracking-wider">
                                  Notes for AI
                                </span>
                              </div>
                              <ChevronDown className={`w-4 h-4 text-amber-400/40 transition-transform ${customContext.trim() ? 'opacity-30' : 'rotate-180'}`} />
                            </button>

                            <textarea
                              value={customContext}
                              onChange={(e) => setCustomContext(e.target.value)}
                              placeholder="e.g., Focus on the key metrics. This is for executives who want a quick overview..."
                              rows={2}
                              autoFocus
                              className="w-full px-3 pb-3 bg-transparent text-sm text-white/80 placeholder:text-white/25 resize-none outline-none border-none focus:ring-0 leading-relaxed"
                              style={{ boxShadow: 'none' }}
                            />
                          </div>
                        </motion.div>
                      )}
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
