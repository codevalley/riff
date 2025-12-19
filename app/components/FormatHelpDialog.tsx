'use client';

// ============================================
// VIBE SLIDES - Format Help Dialog
// Shows supported markdown formats
// ============================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, X } from 'lucide-react';

const FORMAT_EXAMPLES = [
  // Basic syntax
  { syntax: '---', description: 'Slide separator', category: 'basic' },
  { syntax: '# Title', description: 'Main headline (f1 font)', category: 'basic' },
  { syntax: '## Heading', description: 'Secondary heading (f2 font)', category: 'basic' },
  { syntax: '### Subtitle', description: 'Body text (f2 font)', category: 'basic' },
  { syntax: 'Regular text', description: 'Body text (no prefix)', category: 'basic' },
  { syntax: '- Item  or  * Item', description: 'Unordered list', category: 'basic' },
  { syntax: '1. Item', description: 'Ordered list', category: 'basic' },
  { syntax: '`keyword`', description: 'Highlighted accent text', category: 'basic' },
  { syntax: '```lang\\ncode\\n```', description: 'Code block', category: 'basic' },
  { syntax: '**pause**', description: 'Reveal animation beat', category: 'basic' },
  { syntax: '> Note', description: 'Speaker notes (hidden)', category: 'basic' },

  // Layout v2
  { syntax: '[left, top]', description: 'Alignment: horizontal, vertical', category: 'layout' },
  { syntax: '[center, center]', description: 'Center content (default)', category: 'layout' },
  { syntax: '[section]', description: 'Section header slide', category: 'layout' },
  { syntax: '[space:2]', description: 'Vertical spacer (multiplier)', category: 'layout' },
  { syntax: '$<footer text>', description: 'Slide footer', category: 'layout' },

  // Images
  { syntax: '[image: desc]', description: 'AI-generated image', category: 'image' },
  { syntax: '[image: desc, left]', description: 'Image on left (30/70 split)', category: 'image' },
  { syntax: '[image: desc, right]', description: 'Image on right (70/30 split)', category: 'image' },
  { syntax: '[image: desc, top]', description: 'Image on top (landscape)', category: 'image' },
  { syntax: '[image: desc, bottom]', description: 'Image on bottom', category: 'image' },

  // Grids
  { syntax: '[grid]', description: 'Start grid card layout', category: 'grid' },
  { syntax: '- [icon: rocket]', description: 'Lucide icon in grid item', category: 'grid' },
  { syntax: '- ## Card Title', description: 'Heading row in grid item', category: 'grid' },

  // Text effects
  { syntax: '# Title [anvil]', description: 'Anvil drop animation', category: 'effect' },
  { syntax: '# Title [typewriter]', description: 'Typewriter effect', category: 'effect' },
  { syntax: '# Title [glow]', description: 'Pulsing glow effect', category: 'effect' },
  { syntax: '# Title [shake]', description: 'Attention shake', category: 'effect' },
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
  {
    type: 'retrogrid',
    name: 'RetroGrid',
    description: 'Animated perspective grid',
    preview: (color: string) => ({
      backgroundImage: `linear-gradient(to bottom, transparent 50%, ${color} 100%), linear-gradient(to right, ${color} 1px, transparent 1px)`,
      backgroundSize: '100% 100%, 8px 100%',
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
        className="flex items-center gap-1.5 px-2.5 py-1.5 text-sm text-text-secondary hover:text-text-primary hover:bg-surface rounded-md transition-colors"
        title="Markdown format help"
      >
        <Lightbulb className="w-4 h-4" />
        
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
              className="fixed inset-0 z-50 bg-black/80"
              onClick={() => setIsOpen(false)}
            />

            {/* Dialog */}
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="w-full max-w-lg max-h-[85vh] bg-[#0a0a0a] border border-[#27272a] rounded-lg shadow-xl flex flex-col"
              >
                {/* Header */}
                <div className="flex flex-col gap-1.5 p-6 pb-4 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-white tracking-tight">
                      Handbook
                    </h2>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="rounded-sm opacity-70 hover:opacity-100 transition-opacity"
                    >
                      <X className="w-4 h-4 text-white" />
                    </button>
                  </div>
                  <p className="text-sm text-[#a1a1aa]">
                    Markdown syntax for creating slides.
                  </p>
                </div>

                {/* Content */}
                <div className="px-6 pb-6 overflow-y-auto flex-1">
                  {/* Basic Syntax */}
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">Basic Syntax</h3>
                    <div className="space-y-0.5">
                      {FORMAT_EXAMPLES.filter(i => i.category === 'basic').map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-xs text-[#a1a1aa]">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Layout */}
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">Layout & Alignment</h3>
                    <div className="space-y-0.5">
                      {FORMAT_EXAMPLES.filter(i => i.category === 'layout').map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-xs text-[#a1a1aa]">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Images */}
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">Images</h3>
                    <div className="space-y-0.5">
                      {FORMAT_EXAMPLES.filter(i => i.category === 'image').map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-xs text-[#a1a1aa]">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Grids */}
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">Grid Cards</h3>
                    <div className="space-y-0.5">
                      {FORMAT_EXAMPLES.filter(i => i.category === 'grid').map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-xs text-[#a1a1aa]">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Text Effects */}
                  <div className="mb-4">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2 px-3">Text Effects</h3>
                    <div className="space-y-0.5">
                      {FORMAT_EXAMPLES.filter(i => i.category === 'effect').map((item, index) => (
                        <div
                          key={index}
                          className="flex items-start gap-3 py-1.5 px-3 rounded-md hover:bg-white/5 transition-colors"
                        >
                          <code className="flex-shrink-0 min-w-[160px] text-xs font-mono text-rose-400 bg-rose-500/10 px-2 py-0.5 rounded">
                            {item.syntax}
                          </code>
                          <span className="text-xs text-[#a1a1aa]">
                            {item.description}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Background Effects Section */}
                  <div className="mt-5 p-4 bg-[#18181b] rounded-md border border-[#27272a]">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-3">
                      Background Effects
                    </h3>
                    <p className="text-xs text-[#71717a] mb-3">
                      Syntax: <code className="text-amber-400 bg-amber-500/10 px-1 rounded">[bg:type-position-color]</code>
                    </p>

                    {/* Effect Types with Previews */}
                    <div className="mb-4">
                      <p className="text-xs text-white mb-2 font-medium">Types:</p>
                      <div className="grid grid-cols-5 gap-2">
                        {BACKGROUND_EFFECTS.map((effect) => (
                          <div key={effect.type} className="text-center">
                            <div
                              className="w-full h-10 rounded border border-[#27272a] mb-1 bg-black"
                              style={effect.preview('rgba(99, 102, 241, 0.6)')}
                            />
                            <code className="text-[10px] text-amber-400">{effect.type}</code>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Positions */}
                    <div className="mb-4">
                      <p className="text-xs text-white mb-2 font-medium">Positions:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {POSITIONS.map((pos) => (
                          <code key={pos} className="text-[10px] text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded">
                            {pos}
                          </code>
                        ))}
                      </div>
                    </div>

                    {/* Colors with Swatches */}
                    <div>
                      <p className="text-xs text-white mb-2 font-medium">Colors:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {COLORS.map((c) => (
                          <div key={c.name} className="flex items-center gap-1 bg-black/50 px-2 py-0.5 rounded border border-[#27272a]">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: c.preview }}
                            />
                            <code className="text-[10px] text-[#a1a1aa]">{c.name}</code>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Tips section */}
                  <div className="mt-4 p-4 bg-[#18181b] rounded-md border border-[#27272a]">
                    <h3 className="text-xs font-medium text-white uppercase tracking-wider mb-2">
                      Tips
                    </h3>
                    <ul className="text-xs text-[#71717a] space-y-1.5">
                      <li>• Use <code className="text-amber-400 bg-amber-500/10 px-1 rounded">**pause**</code> to reveal content step-by-step</li>
                      <li>• Wrap text in <code className="text-amber-400 bg-amber-500/10 px-1 rounded">`backticks`</code> to highlight keywords</li>
                      <li>• Add <code className="text-amber-400 bg-amber-500/10 px-1 rounded">[section]</code> for bold section headers</li>
                      <li>• Alignment goes at slide start: <code className="text-cyan-400 bg-cyan-500/10 px-1 rounded">[left, top]</code></li>
                      <li>• Grid items support icons, images, and multi-line text</li>
                      <li>• Use <code className="text-amber-400 bg-amber-500/10 px-1 rounded">**pause**</code> between grid items for reveals</li>
                    </ul>
                  </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end px-6 py-4 border-t border-[#27272a] flex-shrink-0">
                  <button
                    onClick={() => setIsOpen(false)}
                    className="h-9 px-4 bg-white hover:bg-white/90 text-black text-sm font-medium rounded-md transition-colors"
                  >
                    Got it
                  </button>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
