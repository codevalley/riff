'use client';

// ============================================
// RIFF - Export Dropdown Component
// Dropdown for exporting deck in multiple formats
// ============================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CloudDownload,
  Loader2,
  FileJson,
  FileText,
  Presentation,
  ChevronDown,
  Check,
  Coins,
} from 'lucide-react';
import { useCreditsContext } from '@/hooks/useCredits';
import { useOnboarding } from '@/hooks/useOnboarding';
import { analytics } from '@/lib/analytics';

type ExportFormat = 'riff' | 'pdf' | 'pptx';

interface ExportOption {
  id: ExportFormat;
  label: string;
  description: string;
  icon: React.ElementType;
  extension: string;
  badge?: string;
  credits?: number;
}

const EXPORT_OPTIONS: ExportOption[] = [
  {
    id: 'riff',
    label: '.riff',
    description: 'Portable backup (for import)',
    icon: FileJson,
    extension: 'riff',
  },
  {
    id: 'pdf',
    label: 'PDF',
    description: 'High-fidelity document',
    icon: FileText,
    extension: 'pdf',
    credits: 2,
  },
  {
    id: 'pptx',
    label: 'PowerPoint',
    description: 'Editable presentation',
    icon: Presentation,
    extension: 'pptx',
    badge: 'Beta',
    credits: 2,
  },
];

interface ExportDropdownProps {
  deckId: string;
  deckName: string;
}

export function ExportDropdown({ deckId, deckName }: ExportDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState<ExportFormat | null>(null);
  const [completed, setCompleted] = useState<ExportFormat | null>(null);
  const [error, setError] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const { balance, hasEnough, refetch, triggerInsufficientModal } = useCreditsContext();
  const { recordFeatureUse } = useOnboarding();

  // Trigger publishing tour when dropdown opens
  const handleToggle = () => {
    if (!isOpen) {
      recordFeatureUse('sharing-click');
    }
    setIsOpen(!isOpen);
  };

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
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
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen]);

  const handleExport = async (format: ExportFormat) => {
    if (exporting) return;

    const option = EXPORT_OPTIONS.find(o => o.id === format);
    const creditsRequired = option?.credits || 0;

    // Check if user has enough credits for paid exports
    if (creditsRequired > 0 && !hasEnough(creditsRequired)) {
      triggerInsufficientModal(creditsRequired, `${option?.label} export`);
      setIsOpen(false);
      return;
    }

    setExporting(format);
    setCompleted(null);
    setError(null);

    try {
      // Determine endpoint based on format
      let endpoint: string;
      let contentType: string;

      switch (format) {
        case 'riff':
          endpoint = `/api/decks/${deckId}/export`;
          contentType = 'application/json';
          break;
        case 'pdf':
          endpoint = `/api/decks/${deckId}/export/pdf`;
          contentType = 'application/pdf';
          break;
        case 'pptx':
          endpoint = `/api/decks/${deckId}/export/pptx`;
          contentType = 'application/vnd.openxmlformats-officedocument.presentationml.presentation';
          break;
      }

      const response = await fetch(endpoint);

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      // Get blob and trigger download
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);

      // Create safe filename
      const safeFilename = deckName
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        || 'presentation';

      const extension = EXPORT_OPTIONS.find(o => o.id === format)?.extension || format;

      const a = document.createElement('a');
      a.href = url;
      a.download = `${safeFilename}.${extension}`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);

      // Deduct credits after successful export (if required)
      if (creditsRequired > 0) {
        try {
          await fetch('/api/credits/deduct', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              amount: creditsRequired,
              description: `${option?.label} export`,
            }),
          });
          // Refresh balance
          await refetch();
        } catch (err) {
          console.warn('Failed to deduct credits:', err);
        }
      }

      // Track successful export
      analytics.deckExported(format);

      // Show completion state briefly
      setCompleted(format);
      setTimeout(() => {
        setCompleted(null);
        setIsOpen(false);
      }, 1000);
    } catch (err) {
      console.error('Export failed:', err);
      setError('Export failed. Please try again.');
    } finally {
      setExporting(null);
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Trigger button */}
      <button
        onClick={handleToggle}
        disabled={exporting !== null}
        className="p-2 text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-colors disabled:opacity-40 flex items-center gap-1"
        title="Export deck"
      >
        {exporting ? (
          <Loader2 className="w-4 h-4 animate-spin" />
        ) : (
          <CloudDownload className="w-4 h-4" />
        )}
        <ChevronDown className={`w-3 h-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -4, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -4, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-full mt-2 w-56 bg-[#141414] border border-white/[0.08] rounded-xl shadow-2xl overflow-hidden z-50"
          >
            {/* Header */}
            <div className="px-3 py-2 border-b border-white/[0.06]">
              <p className="text-[11px] font-medium text-white/40 uppercase tracking-wider">
                Export as
              </p>
            </div>

            {/* Options */}
            <div className="py-1">
              {EXPORT_OPTIONS.map((option) => {
                const Icon = option.icon;
                const isExporting = exporting === option.id;
                const isCompleted = completed === option.id;
                const canAfford = !option.credits || hasEnough(option.credits);

                return (
                  <button
                    key={option.id}
                    onClick={() => handleExport(option.id)}
                    disabled={exporting !== null}
                    className="w-full px-3 py-2.5 flex items-center gap-3 hover:bg-white/[0.04] transition-colors text-left disabled:opacity-50"
                  >
                    {/* Icon */}
                    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0">
                      {isExporting ? (
                        <Loader2 className="w-4 h-4 text-white/60 animate-spin" />
                      ) : isCompleted ? (
                        <Check className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <Icon className="w-4 h-4 text-white/60" />
                      )}
                    </div>

                    {/* Label & description */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-white/90">
                          {option.label}
                        </span>
                        {option.badge && (
                          <span className="px-1.5 py-0.5 text-[10px] font-medium bg-amber-500/20 text-amber-400 rounded">
                            {option.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-white/40 truncate">
                        {isExporting ? 'Exporting...' : option.description}
                      </p>
                    </div>

                    {/* Credits cost */}
                    {option.credits && (
                      <div className={`flex items-center gap-1 text-xs ${canAfford ? 'text-white/40' : 'text-red-400'}`}>
                        <Coins className="w-3 h-3" />
                        <span>{option.credits}</span>
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Footer hint */}
            <div className="px-3 py-2 border-t border-white/[0.06] bg-white/[0.02]">
              <p className="text-[10px] text-white/30 text-center">
                PDF & PPTX include all images
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
