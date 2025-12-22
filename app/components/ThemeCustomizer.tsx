'use client';

// ============================================
// RIFF - Theme Customizer Component
// Accordion-style Quick Apply matching CreditsLedgerModal
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Paintbrush,
  X,
  ChevronDown,
  RotateCcw,
  Clock,
  Wand2,
  Palette,
} from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';

interface ThemeHistoryItem {
  index: number;
  prompt: string;
  generatedAt?: string;
  preview: string | null;
}

interface ThemeCustomizerProps {
  currentPrompt: string;
  onGenerate: (prompt: string, systemPrompt?: string) => Promise<void>;
  onReset: () => void;
  onApplyTheme?: (css: string, prompt: string) => void;
  deckId?: string;
  isGenerating?: boolean;
}

// Preset styles
const PRESET_STYLES = [
  { label: 'Minimal Dark', prompt: 'Dark minimal with subtle cyan accents', color: '#06b6d4' },
  { label: 'Warm Elegant', prompt: 'Warm and elegant with gold on deep burgundy', color: '#d97706' },
  { label: 'Clean Modern', prompt: 'Clean Apple-style with generous white space', color: '#a1a1aa' },
  { label: 'High Contrast', prompt: 'High contrast with stark black and white', color: '#ffffff' },
  { label: 'Soft Pastel', prompt: 'Soft pastels with gentle gradients', color: '#f9a8d4' },
  { label: 'Editorial', prompt: 'Editorial magazine with sophisticated serifs', color: '#78716c' },
];

// Loading dots
function LoadingDots() {
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-current"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
}

// Accordion section component
function AccordionSection({
  icon: Icon,
  title,
  count,
  isOpen,
  onToggle,
  children,
  disabled,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  count: number;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <div className="border-b border-white/[0.04] last:border-0">
      <button
        onClick={onToggle}
        disabled={disabled || count === 0}
        className={`
          w-full flex items-center justify-between py-3 px-1
          hover:bg-white/[0.02] transition-colors rounded-lg -mx-1 group
          ${disabled || count === 0 ? 'opacity-40 cursor-not-allowed' : ''}
        `}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-3.5 h-3.5 text-white/40" />
          <span
            style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
            className="text-[13px] font-medium text-white/70"
          >
            {title}
          </span>
          <span className="text-[11px] text-white/30">
            {count}
          </span>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-white/30 transition-transform duration-200 ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            className="overflow-hidden"
          >
            <div className="pb-3 space-y-0.5 max-h-[180px] overflow-y-auto scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Style item row
function StyleItem({
  color,
  label,
  sublabel,
  isSelected,
  onClick,
  isLoading,
}: {
  color: string;
  label: string;
  sublabel?: string;
  isSelected?: boolean;
  onClick: () => void;
  isLoading?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={isLoading}
      className={`
        w-full flex items-center gap-3 py-2 px-2 rounded-lg
        hover:bg-white/[0.03] transition-colors group
        ${isSelected ? 'bg-white/[0.04]' : ''}
        ${isLoading ? 'opacity-50 cursor-wait' : ''}
      `}
    >
      <div
        className="w-3.5 h-3.5 rounded-full ring-1 ring-white/20 flex-shrink-0 mt-0.5 self-start"
        style={{ backgroundColor: color }}
      />
      <div className="flex-1 min-w-0 text-left">
        <p className="text-[13px] text-white/60 group-hover:text-white/80 transition-colors truncate">
          {label}
        </p>
        <div className="flex items-center gap-2 mt-0.5">
          {sublabel && (
            <span className="text-[10px] text-white/25">{sublabel}</span>
          )}
          {isLoading ? (
            <LoadingDots />
          ) : isSelected ? (
            <span className="text-[10px] text-emerald-400">Selected</span>
          ) : (
            <span className="text-[10px] text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity">
              Apply
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

export function ThemeCustomizer({
  currentPrompt,
  onGenerate,
  onReset,
  onApplyTheme,
  deckId,
  isGenerating = false,
}: ThemeCustomizerProps) {
  const { recordFeatureUse } = useOnboarding();

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState(currentPrompt);
  const [themeHistory, setThemeHistory] = useState<ThemeHistoryItem[]>([]);
  const [isApplyingHistory, setIsApplyingHistory] = useState<number | null>(null);

  // Accordion state - only one can be open at a time
  const [openSection, setOpenSection] = useState<'recent' | 'presets' | null>(null);

  // Fetch theme history
  const fetchThemeHistory = useCallback(async () => {
    if (!deckId) return;
    try {
      const response = await fetch(`/api/theme/${encodeURIComponent(deckId)}`);
      if (response.ok) {
        const data = await response.json();
        setThemeHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch theme history:', err);
    }
  }, [deckId]);

  // Apply theme from history
  const applyFromHistory = useCallback(
    async (historyIndex: number) => {
      if (!deckId || !onApplyTheme) return;
      setIsApplyingHistory(historyIndex);
      try {
        const response = await fetch(`/api/theme/${encodeURIComponent(deckId)}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ historyIndex }),
        });
        if (response.ok) {
          const data = await response.json();
          onApplyTheme(data.css, data.prompt);
          fetchThemeHistory();
          setIsOpen(false);
        }
      } catch (err) {
        console.error('Failed to apply theme from history:', err);
      } finally {
        setIsApplyingHistory(null);
      }
    },
    [deckId, onApplyTheme, fetchThemeHistory]
  );

  // On open
  useEffect(() => {
    if (isOpen) {
      recordFeatureUse('theme-panel-open');
      fetchThemeHistory();
    }
  }, [isOpen, recordFeatureUse, fetchThemeHistory]);

  useEffect(() => {
    setPrompt(currentPrompt);
  }, [currentPrompt]);

  const handleGenerate = async () => {
    if (prompt.trim()) {
      await onGenerate(prompt.trim());
    }
  };

  const handlePresetSelect = (preset: typeof PRESET_STYLES[0]) => {
    setPrompt(preset.prompt);
    setOpenSection(null);
  };

  const handleResetTheme = () => {
    onReset();
    setPrompt('');
  };

  return (
    <div className="relative">
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="
          flex items-center gap-1.5 px-2.5 py-1.5
          hover:bg-surface border border-border hover:border-border-hover
          rounded-md text-text-secondary hover:text-text-primary
          transition-all duration-fast text-xs
        "
        title="Theme customization"
      >
        <Paintbrush className="w-3.5 h-3.5" />
        <span>Theme</span>
        {currentPrompt && (
          <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
        )}
        <ChevronDown
          className={`w-3 h-3 text-text-tertiary transition-transform duration-fast ${
            isOpen ? 'rotate-180' : ''
          }`}
        />
      </button>

      {/* Modal */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md"
              onClick={() => setIsOpen(false)}
            />

            {/* Modal panel */}
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 10 }}
              transition={{ duration: 0.25, ease: [0.19, 1, 0.22, 1] }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
            >
              <div
                className="relative w-full max-w-[400px] pointer-events-auto bg-[#0c0c0c] border border-white/[0.08] rounded-2xl shadow-2xl shadow-black/60"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Top accent */}
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />

                {/* Close */}
                <button
                  onClick={() => setIsOpen(false)}
                  className="absolute top-4 right-4 p-1.5 hover:bg-white/5 rounded-lg text-white/30 hover:text-white/60 transition-colors z-10"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Header */}
                <div className="px-6 pt-6 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-full bg-amber-500/10">
                      <Paintbrush className="w-5 h-5 text-amber-400" />
                    </div>
                    <div>
                      <h2
                        style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                        className="text-xl font-medium text-white tracking-tight"
                      >
                        Theme Studio
                      </h2>
                      <p className="text-[12px] text-white/40">Colors, fonts & mood</p>
                    </div>
                  </div>
                </div>

                {/* Content */}
                <div className="px-6 pb-6">

                  {/* ═══════════════════════════════════════════
                      QUICK APPLY - Accordion sections
                  ═══════════════════════════════════════════ */}
                  <div className="mb-5">
                    {/* Recent Themes */}
                    <AccordionSection
                      icon={Clock}
                      title="Recent Themes"
                      count={themeHistory.length}
                      isOpen={openSection === 'recent'}
                      onToggle={() => setOpenSection(openSection === 'recent' ? null : 'recent')}
                    >
                      {themeHistory.map((item) => (
                        <StyleItem
                          key={item.index}
                          color={item.preview || '#666'}
                          label={item.prompt}
                          sublabel={item.generatedAt ? new Date(item.generatedAt).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                          }) : undefined}
                          onClick={() => applyFromHistory(item.index)}
                          isLoading={isApplyingHistory === item.index}
                        />
                      ))}
                    </AccordionSection>

                    {/* Preset Styles */}
                    <AccordionSection
                      icon={Palette}
                      title="Preset Styles"
                      count={PRESET_STYLES.length}
                      isOpen={openSection === 'presets'}
                      onToggle={() => setOpenSection(openSection === 'presets' ? null : 'presets')}
                    >
                      {PRESET_STYLES.map((preset) => (
                        <StyleItem
                          key={preset.label}
                          color={preset.color}
                          label={preset.label}
                          sublabel={preset.prompt}
                          isSelected={prompt === preset.prompt}
                          onClick={() => handlePresetSelect(preset)}
                        />
                      ))}
                    </AccordionSection>
                  </div>

                  {/* ═══════════════════════════════════════════
                      HERO CTA - Input + Generate
                  ═══════════════════════════════════════════ */}
                  <div className="border-t border-white/[0.04] pt-5 space-y-4">
                    {/* Input */}
                    <textarea
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your theme vision..."
                      className="
                        w-full h-[72px] px-3 py-2.5
                        bg-[#0a0a0a] border border-white/[0.10] rounded-lg
                        text-white text-[13px] placeholder:text-white/25
                        focus:border-amber-500/50 focus:ring-2 focus:ring-amber-500/20
                        outline-none resize-none transition-all
                      "
                    />

                    {/* Hero CTA + Reset inline */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={handleGenerate}
                        disabled={isGenerating || !prompt.trim()}
                        className="
                          flex-1 flex items-center justify-center gap-2.5 px-4 py-3
                          bg-gradient-to-r from-amber-600 to-orange-600
                          hover:from-amber-500 hover:to-orange-500
                          disabled:from-[#1a1a1a] disabled:to-[#1a1a1a] disabled:text-white/30
                          disabled:cursor-not-allowed
                          rounded-lg text-white text-[13px] font-medium
                          transition-all shadow-lg shadow-amber-500/20
                          disabled:shadow-none
                        "
                      >
                        {isGenerating ? (
                          <>
                            <span>Crafting theme</span>
                            <LoadingDots />
                          </>
                        ) : (
                          <>
                            <Wand2 className="w-4 h-4" />
                            Generate Theme
                          </>
                        )}
                      </button>

                      {/* Reset - only show when there's an active theme */}
                      {currentPrompt && (
                        <button
                          onClick={handleResetTheme}
                          className="p-3 text-white/30 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                          title="Reset to default"
                        >
                          <RotateCcw className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
