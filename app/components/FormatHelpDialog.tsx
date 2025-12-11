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
  { syntax: '# Title [anvil]', description: 'Anvil drop animation' },
  { syntax: '# Title [typewriter]', description: 'Typewriter effect' },
  { syntax: '# Title [glow]', description: 'Pulsing glow effect' },
  { syntax: '# Title [shake]', description: 'Attention shake' },
];

// Background effect previews with visual demonstrations
const BACKGROUND_EFFECTS = [
  {
    type: 'glow',
    name: 'Glow',
    description: 'Radial gradient glow',
    preview: (color: string) => ({
      backgroundImage: `radial-gradient(125% 125% at 50% 110%, transparent 40%, ${color} 100%)`,
    })
  },
  {
    type: 'grid',
    name: 'Grid',
    description: 'Orthogonal grid pattern',
    preview: (color: string) => ({
      backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
      backgroundSize: '8px 8px',
    })
  },
  {
    type: 'hatch',
    name: 'Hatch',
    description: 'Diagonal cross pattern',
    preview: (color: string) => ({
      backgroundImage: `linear-gradient(45deg, transparent 49%, ${color} 49%, ${color} 51%, transparent 51%), linear-gradient(-45deg, transparent 49%, ${color} 49%, ${color} 51%, transparent 51%)`,
      backgroundSize: '10px 10px',
    })
  },
  {
    type: 'dashed',
    name: 'Dashed',
    description: 'Dashed grid pattern',
    preview: (color: string) => ({
      backgroundImage: `linear-gradient(to right, ${color} 1px, transparent 1px), linear-gradient(to bottom, ${color} 1px, transparent 1px)`,
      backgroundSize: '6px 6px',
    })
  },
];

const POSITIONS = ['top', 'bottom', 'left', 'right', 'center'];

const COLORS = [
  { name: 'accent', color: 'var(--slide-accent)', preview: '#6366f1' },
  { name: 'amber', color: '#f59e0b', preview: '#f59e0b' },
  { name: 'blue', color: '#3b82f6', preview: '#3b82f6' },
  { name: 'purple', color: '#a855f7', preview: '#a855f7' },
  { name: 'rose', color: '#f43f5e', preview: '#f43f5e' },
  { name: 'emerald', color: '#10b981', preview: '#10b981' },
  { name: 'cyan', color: '#06b6d4', preview: '#06b6d4' },
  { name: 'orange', color: '#f97316', preview: '#f97316' },
  { name: 'pink', color: '#ec4899', preview: '#ec4899' },
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
                      <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                        {item.syntax}
                      </code>
                      <span className="text-sm text-text-primary">
                        {item.description}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Background Effects Section */}
                <div className="mt-6 p-4 bg-surface rounded-lg border border-border">
                  <h3 className="text-xs font-medium text-text-primary uppercase tracking-wider mb-3">
                    Background Effects
                  </h3>
                  <p className="text-xs text-text-secondary mb-3">
                    Syntax: <code className="text-amber-400 bg-amber-400/10 px-1 rounded">[bg:type-position-color]</code>
                  </p>

                  {/* Effect Types with Previews */}
                  <div className="mb-4">
                    <p className="text-xs text-text-primary mb-2 font-medium">Types:</p>
                    <div className="grid grid-cols-4 gap-2">
                      {BACKGROUND_EFFECTS.map((effect) => (
                        <div key={effect.type} className="text-center">
                          <div
                            className="w-full h-12 rounded border border-border mb-1 bg-black"
                            style={effect.preview('rgba(99, 102, 241, 0.6)')}
                          />
                          <code className="text-[10px] text-amber-400">{effect.type}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Positions */}
                  <div className="mb-4">
                    <p className="text-xs text-text-primary mb-2 font-medium">Positions:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {POSITIONS.map((pos) => (
                        <code key={pos} className="text-[10px] text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded">
                          {pos}
                        </code>
                      ))}
                    </div>
                  </div>

                  {/* Colors with Swatches */}
                  <div>
                    <p className="text-xs text-text-primary mb-2 font-medium">Colors:</p>
                    <div className="flex flex-wrap gap-1.5">
                      {COLORS.map((c) => (
                        <div key={c.name} className="flex items-center gap-1 bg-black/30 px-2 py-0.5 rounded border border-border">
                          <div
                            className="w-2.5 h-2.5 rounded-full border border-white/20"
                            style={{ backgroundColor: c.preview }}
                          />
                          <code className="text-[10px] text-text-primary">{c.name}</code>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Example */}
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs text-text-secondary">
                      Example: <code className="text-amber-400 bg-amber-400/10 px-1 rounded">[bg:glow-bottom-amber]</code> creates an amber glow from the bottom
                    </p>
                  </div>
                </div>

                {/* Tips section */}
                <div className="mt-4 p-4 bg-surface rounded-lg border border-border">
                  <h3 className="text-xs font-medium text-text-primary uppercase tracking-wider mb-2">
                    Tips
                  </h3>
                  <ul className="text-xs text-text-secondary space-y-1.5">
                    <li>• Use <code className="text-amber-400 bg-amber-400/10 px-1 rounded">**pause**</code> to reveal content step-by-step</li>
                    <li>• Wrap text in <code className="text-amber-400 bg-amber-400/10 px-1 rounded">`backticks`</code> to highlight keywords</li>
                    <li>• Add <code className="text-amber-400 bg-amber-400/10 px-1 rounded">[section]</code> after <code className="text-amber-400 bg-amber-400/10 px-1 rounded">---</code> for bold section headers</li>
                    <li>• Add <code className="text-amber-400 bg-amber-400/10 px-1 rounded">[anvil]</code> or other effects to headings for animations</li>
                    <li>• Speaker notes (<code className="text-amber-400 bg-amber-400/10 px-1 rounded">&gt;</code>) are only visible in notes panel</li>
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
