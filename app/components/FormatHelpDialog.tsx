'use client';

// ============================================
// VIBE SLIDES - Format Help Dialog
// Shows supported markdown formats
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { HelpCircle, X } from 'lucide-react';

const FORMAT_EXAMPLES = [
  { syntax: '---', description: 'Slide separator' },
  { syntax: '# Title', description: 'Main headline (h1)' },
  { syntax: '## Heading', description: 'Secondary heading (h2)' },
  { syntax: '### Subtitle', description: 'Tertiary text (h3)' },
  { syntax: 'Regular text', description: 'Body text (no prefix)' },
  { syntax: '- Item  or  * Item', description: 'Unordered list' },
  { syntax: '1. Item', description: 'Ordered list' },
  { syntax: '[image: description]', description: 'AI-generated image' },
  { syntax: '**pause**', description: 'Reveal animation beat' },
  { syntax: '> Note', description: 'Speaker notes (hidden)' },
  { syntax: '`keyword`', description: 'Highlighted text' },
  { syntax: '```lang\\ncode\\n```', description: 'Code block' },
  { syntax: '[section]', description: 'Section header slide' },
];

export function FormatHelpDialog() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setIsOpen(true)}
        className="
          p-2 rounded-md transition-colors
          hover:bg-surface text-text-tertiary hover:text-text-secondary
        "
        title="Markdown format help"
      >
        <HelpCircle className="w-4 h-4" />
      </button>

      {/* Dialog */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ duration: 0.15 }}
              className="
                fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50
                w-full max-w-lg max-h-[80vh] overflow-hidden
                bg-surface border border-border rounded-xl
                shadow-2xl shadow-black/30
              "
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-text-tertiary" />
                  <h2 className="text-base font-medium text-text-primary">
                    Supported Formats
                  </h2>
                </div>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 hover:bg-surface-hover rounded-md text-text-tertiary hover:text-text-primary transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Content */}
              <div className="p-5 overflow-y-auto max-h-[calc(80vh-120px)]">
                <p className="text-sm text-text-secondary mb-4">
                  Use these markdown formats in your slides:
                </p>

                <div className="space-y-1">
                  {FORMAT_EXAMPLES.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 py-2 px-3 rounded-md hover:bg-surface-hover transition-colors"
                    >
                      <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-slide-accent bg-background px-2 py-1 rounded">
                        {item.syntax}
                      </code>
                      <span className="text-sm text-text-secondary">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Tips section */}
                <div className="mt-6 p-4 bg-background rounded-lg border border-border">
                  <h3 className="text-xs font-medium text-text-primary uppercase tracking-wider mb-2">
                    Tips
                  </h3>
                  <ul className="text-xs text-text-tertiary space-y-1.5">
                    <li>• Use <code className="text-slide-accent">**pause**</code> to reveal content step-by-step</li>
                    <li>• Wrap text in <code className="text-slide-accent">`backticks`</code> to highlight keywords</li>
                    <li>• Add <code className="text-slide-accent">[section]</code> after <code className="text-slide-accent">---</code> for bold section headers</li>
                    <li>• Speaker notes (<code className="text-slide-accent">&gt;</code>) are only visible in notes panel</li>
                  </ul>
                </div>
              </div>

              {/* Footer */}
              <div className="px-5 py-3 border-t border-border bg-background/50">
                <button
                  onClick={() => setIsOpen(false)}
                  className="
                    w-full px-4 py-2
                    bg-text-primary hover:bg-text-secondary
                    rounded-md text-background text-sm font-medium
                    transition-colors
                  "
                >
                  Got it
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
