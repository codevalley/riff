'use client';

// ============================================
// RIFF - Sweep Generate Dialog (v5)
// Cinematic image generation with stage metaphor
// ============================================

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Check,
  AlertCircle,
  Grid3X3,
  Globe2,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  XCircle,
  ImageIcon,
  Layers,
  Pencil,
  RotateCcw,
  Zap,
  Circle,
} from 'lucide-react';
import { CREDIT_COSTS } from '@/lib/credits-config';
import { DancingPixels } from './DancingPixels';
import { useCreditsContext } from '@/hooks/useCredits';

interface ImageItem {
  id: string;
  description: string;
  modifiedPrompt?: string;
  slideIndex: number;
  hasExistingImage: boolean;
  existingUrl?: string;
  selected: boolean;
  status?: 'pending' | 'generating' | 'completed' | 'failed';
  resultUrl?: string;
  error?: string;
}

interface SweepGenerateDialogProps {
  isOpen: boolean;
  onClose: () => void;
  images: Array<{
    description: string;
    slideIndex: number;
    hasExistingImage: boolean;
    existingUrl?: string;
  }>;
  sceneContext?: string;
  onSceneContextChange?: (context: string) => void;
  onGenerateSingle: (
    description: string,
    modifiedPrompt?: string,
    slideIndex?: number
  ) => Promise<{ url: string | null; error?: string }>;
  onBatchSave?: (images: Array<{ description: string; url: string }>) => Promise<boolean>;
  userCredits?: number;
  onRefreshCredits?: () => Promise<void>;
}

export function SweepGenerateDialog({
  isOpen,
  onClose,
  images,
  sceneContext = '',
  onSceneContextChange,
  onGenerateSingle,
  onBatchSave,
  userCredits = 0,
  onRefreshCredits,
}: SweepGenerateDialogProps) {
  // Credits context
  const { setShowLedgerModal } = useCreditsContext();

  // State
  const [masterContext, setMasterContext] = useState(sceneContext);
  const [imageItems, setImageItems] = useState<ImageItem[]>([]);
  const [showContextEditor, setShowContextEditor] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingPrompt, setEditingPrompt] = useState('');
  const [generationResults, setGenerationResults] = useState<{
    success: number;
    failed: number;
    skipped: number;
    total: number;
    stoppedDueToCredits: boolean;
  } | null>(null);

  // Refs
  const abortRef = useRef(false);
  const editInputRef = useRef<HTMLTextAreaElement>(null);
  const wasOpenRef = useRef(false);
  const isGeneratingRef = useRef(false);

  // Track generating state in ref for effect dependency
  useEffect(() => {
    isGeneratingRef.current = isGenerating;
  }, [isGenerating]);

  // Initialize image items when dialog opens (NOT when images prop changes during generation)
  useEffect(() => {
    // Only initialize on open, not during generation
    if (!isOpen) {
      wasOpenRef.current = false;
      return;
    }

    // Skip re-initialization if already open (prevents losing state during generation)
    if (wasOpenRef.current) {
      return;
    }

    wasOpenRef.current = true;

    const items: ImageItem[] = images.map((img, idx) => ({
      id: `img-${idx}-${img.slideIndex}`,
      description: img.description,
      modifiedPrompt: undefined,
      slideIndex: img.slideIndex,
      hasExistingImage: img.hasExistingImage,
      existingUrl: img.existingUrl,
      selected: !img.hasExistingImage,
      status: undefined,
      resultUrl: undefined,
      error: undefined,
    }));
    setImageItems(items);
    setShowSuccess(false);
    setGenerationResults(null);
    setEditingItemId(null);
    abortRef.current = false;
  }, [isOpen]); // Only depend on isOpen, not images

  // Sync master context with prop
  useEffect(() => {
    setMasterContext(sceneContext);
  }, [sceneContext]);

  // Focus edit input when editing
  useEffect(() => {
    if (editingItemId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingItemId]);

  // Save scene context when it changes
  const handleContextChange = useCallback((value: string) => {
    setMasterContext(value);
  }, []);

  const handleContextBlur = useCallback(() => {
    if (onSceneContextChange && masterContext !== sceneContext) {
      onSceneContextChange(masterContext);
    }
  }, [masterContext, sceneContext, onSceneContextChange]);

  // Memoized calculations
  const { pendingImages, existingImages, selectedCount, creditCost, hasEnoughCredits } = useMemo(() => {
    const pending = imageItems.filter(i => !i.hasExistingImage && i.status !== 'completed');
    const existing = imageItems.filter(i => i.hasExistingImage || i.status === 'completed');
    const selected = imageItems.filter(i => i.selected).length;
    const cost = selected * CREDIT_COSTS.IMAGE_GENERATION; // 5 credits per image
    return {
      pendingImages: pending,
      existingImages: existing,
      selectedCount: selected,
      creditCost: cost,
      hasEnoughCredits: Math.floor(userCredits) >= cost,
    };
  }, [imageItems, userCredits]);

  // Get selected items for progress view
  const selectedItems = useMemo(() =>
    imageItems.filter(i => i.selected),
    [imageItems]
  );

  // Toggle item selection
  const toggleItem = useCallback((id: string, e: React.MouseEvent) => {
    if (isGenerating || editingItemId) return;
    e.stopPropagation();
    setImageItems(prev => prev.map(item =>
      item.id === id ? { ...item, selected: !item.selected } : item
    ));
  }, [isGenerating, editingItemId]);

  // Select/deselect all pending
  const toggleAllPending = useCallback(() => {
    if (isGenerating) return;
    const allPendingSelected = pendingImages.every(i => i.selected);
    setImageItems(prev => prev.map(item => ({
      ...item,
      selected: !item.hasExistingImage && item.status !== 'completed' ? !allPendingSelected : item.selected,
    })));
  }, [pendingImages, isGenerating]);

  // Start editing an item's prompt
  const startEditingPrompt = useCallback((item: ImageItem, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGenerating) return;
    setEditingItemId(item.id);
    setEditingPrompt(item.modifiedPrompt || item.description);
  }, [isGenerating]);

  // Save edited prompt
  const saveEditedPrompt = useCallback(() => {
    if (!editingItemId) return;

    setImageItems(prev => prev.map(item =>
      item.id === editingItemId
        ? { ...item, modifiedPrompt: editingPrompt.trim() !== item.description ? editingPrompt.trim() : undefined }
        : item
    ));
    setEditingItemId(null);
    setEditingPrompt('');
  }, [editingItemId, editingPrompt]);

  // Reset prompt to original
  const resetPrompt = useCallback((id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setImageItems(prev => prev.map(item =>
      item.id === id ? { ...item, modifiedPrompt: undefined } : item
    ));
  }, []);

  // Cancel editing
  const cancelEditing = useCallback(() => {
    setEditingItemId(null);
    setEditingPrompt('');
  }, []);

  // Handle sequential generation with real progress
  const handleGenerate = useCallback(async () => {
    const itemsToGenerate = imageItems.filter(i => i.selected);
    if (itemsToGenerate.length === 0) return;

    setIsGenerating(true);
    abortRef.current = false;

    let successCount = 0;
    let failCount = 0;
    let stoppedDueToCredits = false;

    // Collect successful images for batch save at the end
    const successfulImages: Array<{ description: string; url: string }> = [];

    // Reset all selected items to pending
    setImageItems(prev => prev.map(item => ({
      ...item,
      status: item.selected ? 'pending' : item.status,
      resultUrl: item.selected ? undefined : item.resultUrl,
      error: item.selected ? undefined : item.error,
    })));

    // Process each image sequentially
    for (const item of itemsToGenerate) {
      if (abortRef.current) break;

      // Set current item to generating
      setImageItems(prev => prev.map(i =>
        i.id === item.id ? { ...i, status: 'generating' } : i
      ));

      try {
        const result = await onGenerateSingle(
          item.description,
          item.modifiedPrompt,
          item.slideIndex
        );

        if (result.url) {
          successCount++;
          // Collect for batch save - use ORIGINAL description as manifest key
          successfulImages.push({
            description: item.description,
            url: result.url,
          });
          setImageItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'completed', resultUrl: result.url!, hasExistingImage: true }
              : i
          ));
        } else {
          failCount++;
          const errorMsg = result.error || 'Generation failed';

          // Check if this is a credits error - stop immediately
          const isCreditsError = errorMsg.toLowerCase().includes('credit') ||
                                 errorMsg.toLowerCase().includes('insufficient');

          setImageItems(prev => prev.map(i =>
            i.id === item.id
              ? { ...i, status: 'failed', error: errorMsg }
              : i
          ));

          if (isCreditsError) {
            stoppedDueToCredits = true;
            // Mark remaining items as skipped (not failed)
            setImageItems(prev => prev.map(i => {
              if (i.status === 'pending') {
                return { ...i, status: 'failed', error: 'Skipped: insufficient credits' };
              }
              return i;
            }));
            break; // Stop the loop
          }
        }
      } catch (err) {
        failCount++;
        const errorMsg = String(err);

        // Check if this is a credits error
        const isCreditsError = errorMsg.toLowerCase().includes('credit') ||
                               errorMsg.toLowerCase().includes('insufficient');

        setImageItems(prev => prev.map(i =>
          i.id === item.id
            ? { ...i, status: 'failed', error: errorMsg }
            : i
        ));

        if (isCreditsError) {
          stoppedDueToCredits = true;
          // Mark remaining items as skipped
          setImageItems(prev => prev.map(i => {
            if (i.status === 'pending') {
              return { ...i, status: 'failed', error: 'Skipped: insufficient credits' };
            }
            return i;
          }));
          break;
        }
      }
    }

    // BATCH SAVE all successful images at once (avoids race conditions)
    if (successfulImages.length > 0 && onBatchSave) {
      try {
        await onBatchSave(successfulImages);
      } catch (err) {
        console.error('Failed to batch save images:', err);
        // Images are still in blob cache, just not in manifest
      }
    }

    // Calculate skipped count (items that were pending when we stopped)
    const skippedCount = stoppedDueToCredits
      ? itemsToGenerate.length - successCount - failCount
      : 0;

    setIsGenerating(false);
    setGenerationResults({
      success: successCount,
      failed: failCount,
      skipped: skippedCount,
      total: itemsToGenerate.length,
      stoppedDueToCredits,
    });
    setShowSuccess(true);

    // Refresh credits after generation
    if (onRefreshCredits) {
      await onRefreshCredits();
    }
  }, [imageItems, onGenerateSingle, onBatchSave, onRefreshCredits]);

  // Handle close
  const handleClose = useCallback(() => {
    if (isGenerating) {
      if (!confirm('Generation in progress. Closing will stop remaining images. Continue?')) {
        return;
      }
      abortRef.current = true;
    }
    onClose();
  }, [isGenerating, onClose]);

  // Handle abort generation
  const handleAbort = useCallback(() => {
    abortRef.current = true;
  }, []);

  if (!isOpen) return null;

  const allPendingSelected = pendingImages.length > 0 && pendingImages.every(i => i.selected);
  const completedCount = imageItems.filter(i => i.status === 'completed').length;
  const generatingItem = imageItems.find(i => i.status === 'generating');
  const failedCount = imageItems.filter(i => i.status === 'failed').length;
  const displayCredits = Math.floor(userCredits);
  const progressPercent = selectedItems.length > 0
    ? ((completedCount + failedCount) / selectedItems.length) * 100
    : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/80 backdrop-blur-md"
        onClick={handleClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-3xl max-h-[85vh] bg-[#0a0a0a] border border-white/[0.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden"
      >
        {/* Top accent line */}
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/50 to-transparent" />

        {/* Success State Overlay */}
        <AnimatePresence>
          {showSuccess && generationResults && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 bg-[#050505] flex flex-col"
            >
              {/* Celebratory background effects */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {/* Radial glow */}
                <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-emerald-500/[0.06] rounded-full blur-[120px]" />
                {/* Animated particles */}
                {[...Array(12)].map((_, i) => (
                  <motion.div
                    key={i}
                    initial={{
                      opacity: 0,
                      y: 100,
                      x: Math.random() * 400 - 200,
                    }}
                    animate={{
                      opacity: [0, 0.6, 0],
                      y: -200,
                      x: Math.random() * 400 - 200,
                    }}
                    transition={{
                      duration: 2 + Math.random(),
                      delay: i * 0.15,
                      ease: 'easeOut',
                    }}
                    className="absolute left-1/2 top-1/2"
                    style={{
                      width: Math.random() * 4 + 2,
                      height: Math.random() * 4 + 2,
                    }}
                  >
                    <div className={`w-full h-full rounded-full ${
                      i % 3 === 0 ? 'bg-emerald-400' : i % 3 === 1 ? 'bg-amber-400' : 'bg-white'
                    }`} />
                  </motion.div>
                ))}
              </div>

              {/* Main content */}
              <div className="flex-1 flex flex-col items-center justify-center px-8 py-10 relative">
                {/* Success/Warning icon with ring animation */}
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                  className="relative mb-6"
                >
                  {/* Outer ring */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1.5, opacity: 0 }}
                    transition={{ delay: 0.2, duration: 0.8, ease: 'easeOut' }}
                    className={`absolute inset-0 w-20 h-20 rounded-2xl border-2 ${
                      generationResults.stoppedDueToCredits ? 'border-amber-500' : 'border-emerald-500'
                    }`}
                  />
                  <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shadow-lg ${
                    generationResults.stoppedDueToCredits
                      ? 'bg-gradient-to-br from-amber-500/30 to-amber-600/20 border border-amber-500/50 shadow-amber-500/20'
                      : 'bg-gradient-to-br from-emerald-500/30 to-emerald-600/20 border border-emerald-500/50 shadow-emerald-500/20'
                  }`}>
                    <motion.div
                      initial={{ scale: 0, rotate: -45 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ delay: 0.2, type: 'spring', stiffness: 300 }}
                    >
                      {generationResults.stoppedDueToCredits ? (
                        <AlertCircle className="w-10 h-10 text-amber-400" />
                      ) : (
                        <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                      )}
                    </motion.div>
                  </div>
                </motion.div>

                <motion.h3
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15 }}
                  className="text-2xl font-semibold text-white mb-2 tracking-tight"
                >
                  {generationResults.stoppedDueToCredits
                    ? 'Ran out of credits'
                    : generationResults.success === generationResults.total
                      ? 'All images created!'
                      : 'Generation complete'}
                </motion.h3>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                  className="text-sm text-white/50 mb-4 text-center"
                >
                  {generationResults.success} of {generationResults.total} images generated successfully
                  {generationResults.skipped > 0 && (
                    <span className="text-amber-400/80"> • {generationResults.skipped} skipped</span>
                  )}
                  {generationResults.failed > 0 && !generationResults.stoppedDueToCredits && (
                    <span className="text-red-400/80"> • {generationResults.failed} failed</span>
                  )}
                </motion.p>

                {/* Credits warning message */}
                {generationResults.stoppedDueToCredits && (
                  <motion.button
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    onClick={() => setShowLedgerModal(true)}
                    className="flex items-center gap-2 px-4 py-2 mb-4 bg-amber-500/10 border border-amber-500/30 rounded-lg text-sm text-amber-300 hover:bg-amber-500/20 transition-colors"
                  >
                    <Zap className="w-4 h-4" />
                    <span>Add credits to generate remaining images</span>
                  </motion.button>
                )}

                {/* Generated images showcase - adaptive layout */}
                {generationResults.success > 0 && (
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className="mb-8 w-full max-w-lg"
                  >
                    {/* Adaptive grid: center for 1-3 images, 4-col grid for more */}
                    <div className={`
                      ${generationResults.success <= 3
                        ? 'flex justify-center gap-3'
                        : 'grid grid-cols-4 gap-2'
                      }
                    `}>
                      {imageItems
                        .filter(i => i.status === 'completed' && i.resultUrl)
                        .slice(0, 8)
                        .map((item, idx) => (
                          <motion.div
                            key={item.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{
                              delay: 0.3 + idx * 0.06,
                              type: 'spring',
                              stiffness: 300,
                              damping: 20
                            }}
                            className={`
                              rounded-xl overflow-hidden border border-white/10 shadow-lg
                              ${generationResults.success === 1
                                ? 'w-48 aspect-video'
                                : generationResults.success <= 3
                                  ? 'w-32 aspect-video'
                                  : 'aspect-video'
                              }
                            `}
                          >
                            <img
                              src={item.resultUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </motion.div>
                        ))}
                      {generationResults.success > 8 && (
                        <motion.div
                          initial={{ scale: 0, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          transition={{ delay: 0.78 }}
                          className="aspect-video rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-sm text-white/40 font-medium"
                        >
                          +{generationResults.success - 8}
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}

                <motion.button
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-8 py-3 bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-emerald-400 hover:to-emerald-500 transition-all shadow-lg shadow-emerald-500/25"
                >
                  Done
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Prompt Edit Modal */}
        <AnimatePresence>
          {editingItemId && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6"
              onClick={cancelEditing}
            >
              <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="w-full max-w-lg bg-[#141414] border border-white/[0.08] rounded-xl p-5"
                onClick={e => e.stopPropagation()}
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-medium text-white">Edit Image Prompt</h3>
                  <button
                    onClick={cancelEditing}
                    className="p-1 hover:bg-white/10 rounded-lg text-white/40 hover:text-white/70 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <textarea
                  ref={editInputRef}
                  value={editingPrompt}
                  onChange={(e) => setEditingPrompt(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.metaKey) {
                      saveEditedPrompt();
                    }
                    if (e.key === 'Escape') {
                      cancelEditing();
                    }
                  }}
                  className="w-full h-24 px-4 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-sm text-white/90 placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
                  placeholder="Describe the image..."
                />
                <div className="flex items-center justify-between mt-4">
                  <p className="text-[10px] text-white/30">⌘+Enter to save • Esc to cancel</p>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={cancelEditing}
                      className="px-3 py-1.5 text-xs text-white/60 hover:text-white/80 hover:bg-white/5 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={saveEditedPrompt}
                      className="px-3 py-1.5 text-xs bg-amber-500 text-black font-medium rounded-lg hover:bg-amber-400 transition-colors"
                    >
                      Save
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* =============================================== */}
        {/* CINEMATIC PROGRESS VIEW - Stage metaphor      */}
        {/* =============================================== */}
        {isGenerating ? (
          <div className="flex flex-col h-full bg-gradient-to-b from-[#0a0a0a] via-[#080808] to-[#050505]">
            {/* Ambient glow overlay */}
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-amber-500/[0.03] rounded-full blur-[100px]" />
            </div>

            {/* Minimal header with progress */}
            <div className="relative flex-shrink-0 px-6 py-5 border-b border-white/[0.04]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  {/* Animated pulse ring */}
                  <div className="relative">
                    <div className="w-3 h-3 rounded-full bg-amber-500" />
                    <div className="absolute inset-0 w-3 h-3 rounded-full bg-amber-500 animate-ping opacity-50" />
                  </div>
                  <div>
                    <span className="text-base font-medium text-white tracking-tight">
                      Creating image {completedCount + failedCount + 1}
                    </span>
                    <span className="text-white/30 ml-2 text-sm">of {selectedItems.length}</span>
                  </div>
                </div>
                <button
                  onClick={handleAbort}
                  className="px-4 py-2 text-xs font-medium text-white/50 hover:text-red-400 hover:bg-red-500/10 border border-white/[0.08] hover:border-red-500/30 rounded-lg transition-all"
                >
                  Cancel
                </button>
              </div>

              {/* Elegant progress bar */}
              <div className="relative h-1.5 bg-white/[0.06] rounded-full overflow-hidden">
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-400 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                />
                <motion.div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-amber-400/0 via-white/40 to-amber-400/0 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progressPercent}%` }}
                  transition={{ duration: 0.5, ease: 'easeOut' }}
                  style={{ filter: 'blur(4px)' }}
                />
              </div>
            </div>

            {/* Main content - The Stage */}
            <div className="relative flex-1 overflow-y-auto px-6 py-6">
              {/* Currently generating - THE HERO */}
              {generatingItem ? (
                <motion.div
                  key={generatingItem.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6"
                >
                  <div className="relative aspect-video max-w-xl mx-auto rounded-2xl overflow-hidden border border-amber-500/30 shadow-2xl shadow-amber-500/10 bg-[#0a0a0a]">
                    {/* DancingPixels fills the entire card */}
                    <DancingPixels className="text-amber-500" />

                    {/* Subtle gradient overlay for text legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />

                    {/* Slide badge */}
                    <div className="absolute top-4 left-4 px-2.5 py-1 bg-black/50 backdrop-blur-sm rounded-lg border border-white/10">
                      <span className="text-xs font-medium text-white/80">Slide {generatingItem.slideIndex + 1}</span>
                    </div>

                    {/* Status indicator */}
                    <div className="absolute top-4 right-4 flex items-center gap-2 px-3 py-1.5 bg-amber-500/20 backdrop-blur-sm rounded-full border border-amber-500/30">
                      <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
                      <span className="text-xs font-medium text-amber-300">Creating</span>
                    </div>

                    {/* Prompt text at bottom */}
                    <div className="absolute bottom-0 inset-x-0 p-5">
                      <p className="text-sm text-white/90 font-medium leading-relaxed line-clamp-2">
                        {generatingItem.modifiedPrompt || generatingItem.description}
                      </p>
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Fallback: show a simple loading state if no specific item is generating yet */
                <div className="mb-6">
                  <div className="relative aspect-video max-w-xl mx-auto rounded-2xl overflow-hidden border border-amber-500/30 bg-[#0a0a0a] flex items-center justify-center">
                    <div className="text-center">
                      <div className="w-12 h-12 mx-auto mb-3 rounded-full border-2 border-amber-500/30 border-t-amber-500 animate-spin" />
                      <p className="text-sm text-white/50">Preparing...</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Queue visualization - completed + pending */}
              <div className="grid grid-cols-4 gap-3">
                {selectedItems.map((item, idx) => {
                  // Skip the currently generating item (shown above)
                  if (item.status === 'generating') return null;

                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.03 }}
                      className={`
                        relative rounded-xl overflow-hidden
                        ${item.status === 'completed'
                          ? 'ring-1 ring-emerald-500/40'
                          : item.status === 'failed'
                            ? 'ring-1 ring-red-500/40'
                            : 'ring-1 ring-white/[0.06] opacity-50'
                        }
                      `}
                    >
                      <div className="aspect-video relative bg-[#0a0a0a]">
                        {/* Completed - show image */}
                        {item.status === 'completed' && item.resultUrl ? (
                          <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="relative w-full h-full"
                          >
                            <img
                              src={item.resultUrl}
                              alt=""
                              className="w-full h-full object-cover"
                            />
                            {/* Success overlay */}
                            <motion.div
                              initial={{ opacity: 1 }}
                              animate={{ opacity: 0 }}
                              transition={{ delay: 0.5, duration: 0.3 }}
                              className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center"
                            >
                              <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center">
                                <Check className="w-4 h-4 text-white" />
                              </div>
                            </motion.div>
                          </motion.div>
                        ) : item.status === 'failed' ? (
                          /* Failed state */
                          <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10">
                            <XCircle className="w-5 h-5 text-red-400 mb-1" />
                            <p className="text-[9px] text-red-400/80">Failed</p>
                          </div>
                        ) : (
                          /* Pending - waiting in queue */
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <Circle className="w-4 h-4 text-white/20 mb-1" />
                            <p className="text-[9px] text-white/25">Waiting</p>
                          </div>
                        )}

                        {/* Slide number badge */}
                        <div className="absolute top-1.5 left-1.5 px-1.5 py-0.5 bg-black/60 rounded text-[9px] font-medium text-white/60">
                          {item.slideIndex + 1}
                        </div>

                        {/* Status badge for completed */}
                        {item.status === 'completed' && (
                          <div className="absolute top-1.5 right-1.5">
                            <div className="w-4 h-4 rounded-full bg-emerald-500/90 flex items-center justify-center">
                              <Check className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* Footer with stats */}
            <div className="relative flex-shrink-0 px-6 py-4 border-t border-white/[0.04] bg-black/30">
              <div className="flex items-center justify-center gap-6 text-xs">
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-white/50">{completedCount} done</span>
                </div>
                {generatingItem && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                    <span className="text-amber-400/70">1 in progress</span>
                  </div>
                )}
                {failedCount > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-red-500" />
                    <span className="text-white/50">{failedCount} failed</span>
                  </div>
                )}
                {selectedItems.length - completedCount - failedCount - (generatingItem ? 1 : 0) > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-white/20" />
                    <span className="text-white/40">{selectedItems.length - completedCount - failedCount - (generatingItem ? 1 : 0)} remaining</span>
                  </div>
                )}
              </div>
              <p className="text-[10px] text-white/20 text-center mt-2">
                Please don't refresh the page during generation
              </p>
            </div>
          </div>
        ) : (
          /* =============================================== */
          /* NORMAL SELECTION VIEW - shown when not generating */
          /* =============================================== */
          <>
            {/* Header */}
            <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-white/[0.06]">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/20 flex items-center justify-center">
                    <Layers className="w-5 h-5 text-amber-400" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Generate Images
                    </h2>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-white/40">
                        {pendingImages.length} pending
                      </span>
                      {existingImages.length > 0 && (
                        <>
                          <span className="w-1 h-1 rounded-full bg-white/20" />
                          <span className="text-xs text-emerald-400/70">
                            {existingImages.length} complete
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleClose}
                  className="p-2 -mr-2 -mt-1 hover:bg-white/5 rounded-xl text-white/30 hover:text-white/70 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Configuration Row */}
            <div className="flex-shrink-0 px-6 py-3 border-b border-white/[0.06] flex items-center gap-3">
              {/* Scene Context Toggle */}
              <button
                onClick={() => setShowContextEditor(!showContextEditor)}
                className={`flex items-center gap-2 px-3 py-2 border rounded-xl transition-all ${
                  masterContext.trim()
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                    : 'bg-white/[0.03] hover:bg-white/[0.06] border-white/[0.08] text-white/60'
                }`}
              >
                <Globe2 className="w-4 h-4" />
                <span className="text-sm">{masterContext.trim() ? 'Scene Context' : 'Add Scene Context'}</span>
                {showContextEditor ? (
                  <ChevronUp className="w-3.5 h-3.5 text-white/40" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5 text-white/40" />
                )}
              </button>

              <div className="flex-1" />

              {/* Credits Display */}
              <button
                onClick={() => setShowLedgerModal(true)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-colors ${
                  hasEnoughCredits
                    ? 'bg-white/[0.03] text-white/50 hover:text-amber-400 hover:bg-amber-500/10'
                    : 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                }`}
              >
                <span className="text-xs font-medium">{displayCredits}</span>
                <span className="text-xs">credits</span>
              </button>
            </div>

            {/* Scene Context Editor */}
            <AnimatePresence>
              {showContextEditor && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="flex-shrink-0 overflow-hidden border-b border-white/[0.06]"
                >
                  <div className="px-6 py-4">
                    <div className="flex items-center gap-2 mb-2">
                      <label className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                        Scene Context
                      </label>
                      <span className="text-[10px] text-white/25">(applied to all images)</span>
                    </div>
                    <textarea
                      value={masterContext}
                      onChange={(e) => handleContextChange(e.target.value)}
                      onBlur={handleContextBlur}
                      placeholder="Describe recurring elements like setting, characters, or atmosphere...

Example: Set in a modern Tokyo office with floor-to-ceiling windows, featuring a diverse team of young professionals"
                      className="
                        w-full h-20 px-4 py-3
                        bg-white/[0.03] border border-white/[0.08] rounded-xl
                        text-sm text-white/90 placeholder:text-white/20
                        focus:outline-none focus:border-white/20 focus:bg-white/[0.05]
                        resize-none transition-all duration-200
                      "
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Content - Image Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-4 min-h-0">
              {/* Grid Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Grid3X3 className="w-3.5 h-3.5 text-white/40" />
                  <span className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                    Images ({imageItems.length})
                  </span>
                  <span className="text-[10px] text-white/25">• Click pencil to edit prompt</span>
                </div>
                {pendingImages.length > 0 && (
                  <button
                    onClick={toggleAllPending}
                    className="text-xs text-amber-400/80 hover:text-amber-300 transition-colors"
                  >
                    {allPendingSelected ? 'Deselect all' : 'Select all pending'}
                  </button>
                )}
              </div>

              {/* Image Grid */}
              <div className="grid grid-cols-3 gap-3">
                {imageItems.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className={`
                      relative group rounded-xl overflow-hidden
                      border-2 transition-all duration-200
                      ${item.selected
                        ? 'border-amber-500/60 bg-amber-500/5'
                        : item.status === 'completed' || item.hasExistingImage
                          ? 'border-emerald-500/30 bg-emerald-500/5'
                          : 'border-white/[0.08] bg-white/[0.02] hover:border-white/20'
                      }
                    `}
                  >
                    {/* Image Preview */}
                    <div
                      className="aspect-video relative cursor-pointer"
                      onClick={(e) => toggleItem(item.id, e)}
                    >
                      {item.resultUrl || (item.hasExistingImage && item.existingUrl) ? (
                        <img
                          src={item.resultUrl || item.existingUrl}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-white/[0.02] to-white/[0.04]">
                          <ImageIcon className="w-8 h-8 text-white/10" />
                        </div>
                      )}

                      {/* Status overlays */}
                      {item.status === 'completed' && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-emerald-500/20 flex items-center justify-center pointer-events-none"
                        >
                          <CheckCircle2 className="w-6 h-6 text-emerald-400" />
                        </motion.div>
                      )}
                      {item.status === 'failed' && (
                        <div className="absolute inset-0 bg-red-500/20 flex items-center justify-center pointer-events-none">
                          <XCircle className="w-6 h-6 text-red-400" />
                        </div>
                      )}

                      {/* Selection Checkbox */}
                      <div className={`
                        absolute top-2 left-2 w-5 h-5 rounded-md border-2 flex items-center justify-center
                        transition-all duration-200 pointer-events-none
                        ${item.selected
                          ? 'bg-amber-500 border-amber-500'
                          : item.status === 'completed' || item.hasExistingImage
                            ? 'border-emerald-500/50 bg-emerald-500/20'
                            : 'border-white/30 bg-black/50'
                        }
                      `}>
                        {item.selected && <Check className="w-3 h-3 text-black" />}
                        {!item.selected && (item.status === 'completed' || item.hasExistingImage) && (
                          <Check className="w-3 h-3 text-emerald-400" />
                        )}
                      </div>

                      {/* Slide Badge */}
                      <div className="absolute top-2 right-2 px-1.5 py-0.5 bg-black/60 rounded text-[10px] font-medium text-white/70">
                        {item.slideIndex + 1}
                      </div>
                    </div>

                    {/* Description with Edit */}
                    <div className="p-2.5">
                      <div className="flex items-start gap-2">
                        <p className="flex-1 text-xs text-white/60 line-clamp-2 leading-relaxed">
                          {item.modifiedPrompt || item.description}
                        </p>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          {item.modifiedPrompt && (
                            <button
                              onClick={(e) => resetPrompt(item.id, e)}
                              className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-white/60 transition-colors"
                              title="Reset to original"
                            >
                              <RotateCcw className="w-3 h-3" />
                            </button>
                          )}
                          <button
                            onClick={(e) => startEditingPrompt(item, e)}
                            className="p-1 hover:bg-white/10 rounded text-white/30 hover:text-amber-400 transition-colors"
                            title="Edit prompt"
                          >
                            <Pencil className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                      {item.modifiedPrompt && (
                        <span className="text-[9px] text-amber-400/60 uppercase tracking-wider">edited</span>
                      )}
                      {item.error && (
                        <p className="text-[10px] text-red-400 mt-1 line-clamp-1">{item.error}</p>
                      )}
                    </div>
                  </motion.div>
                ))}

                {imageItems.length === 0 && (
                  <div className="col-span-3 py-12 text-center">
                    <ImageIcon className="w-12 h-12 text-white/10 mx-auto mb-3" />
                    <p className="text-sm text-white/30">No images in this deck</p>
                    <p className="text-xs text-white/20 mt-1">Add [image: description] to your slides</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-shrink-0 px-6 py-4 border-t border-white/[0.06] bg-white/[0.02]">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-amber-500/60" />
                    <span className="text-sm text-white/60">
                      <span className="text-white/90 font-medium">{selectedCount}</span> selected
                    </span>
                  </div>
                  <button
                    onClick={() => setShowLedgerModal(true)}
                    className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                  >
                    <div className={`w-2 h-2 rounded-full ${hasEnoughCredits ? 'bg-emerald-500/60' : 'bg-red-500/60'}`} />
                    <span className={`text-sm ${hasEnoughCredits ? 'text-white/60' : 'text-red-400/90'}`}>
                      <span className={hasEnoughCredits ? 'text-white/90 font-medium' : 'text-red-400 font-medium'}>
                        {creditCost}
                      </span> credits
                    </span>
                  </button>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={handleClose}
                    className="px-4 py-2.5 text-sm text-white/60 hover:text-white/80 hover:bg-white/[0.05] rounded-lg transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleGenerate}
                    disabled={selectedCount === 0 || !hasEnoughCredits}
                    className={`
                      flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium
                      transition-all duration-200
                      ${selectedCount > 0 && hasEnoughCredits
                        ? 'bg-gradient-to-r from-amber-500 to-amber-600 text-black hover:from-amber-400 hover:to-amber-500 shadow-lg shadow-amber-500/20'
                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }
                    `}
                  >
                    <Grid3X3 className="w-4 h-4" />
                    <span>Generate{selectedCount > 0 ? ` ${selectedCount}` : ''}</span>
                  </button>
                </div>
              </div>

              {/* Credit warning */}
              {!hasEnoughCredits && selectedCount > 0 && (
                <button
                  onClick={() => setShowLedgerModal(true)}
                  className="flex items-center gap-1.5 mt-3 text-xs text-red-400/90 hover:text-red-300 transition-colors"
                >
                  <AlertCircle className="w-3.5 h-3.5" />
                  <span>Need {creditCost - displayCredits} more credits to generate {selectedCount} images</span>
                </button>
              )}
            </div>
          </>
        )}
      </motion.div>
    </div>
  );
}
