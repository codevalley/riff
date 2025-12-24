'use client';

// ============================================
// RIFF - Documentation Page
// Wikipedia-style single page with sidebar TOC
// ============================================

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ChevronRight,
  FileText,
  Image,
  Palette,
  Play,
  Share2,
  Upload,
  Coins,
  Menu,
  X,
  ExternalLink,
  Copy,
  Check,
} from 'lucide-react';
import { RiffIcon } from '@/components/RiffIcon';
import { SnowTrigger } from '@/components/SnowfallEffect';

// Table of contents structure
const TOC = [
  {
    id: 'getting-started',
    title: 'Getting Started',
    icon: FileText,
    children: [
      { id: 'what-is-riff', title: 'What is Riff?' },
      { id: 'quick-start', title: 'Quick Start' },
      { id: 'editor-overview', title: 'Editor Overview' },
      { id: 'slash-commands', title: 'Slash Commands' },
    ],
  },
  {
    id: 'markdown-syntax',
    title: 'Markdown Syntax',
    icon: FileText,
    children: [
      { id: 'slides', title: 'Creating Slides' },
      { id: 'alignment', title: 'Alignment' },
      { id: 'text-formatting', title: 'Text & Formatting' },
      { id: 'lists-tables', title: 'Lists & Tables' },
      { id: 'grid-cards', title: 'Grid Cards' },
      { id: 'code-blocks', title: 'Code Blocks' },
      { id: 'speaker-notes', title: 'Speaker Notes' },
    ],
  },
  {
    id: 'images',
    title: 'Images',
    icon: Image,
    children: [
      { id: 'image-placeholders', title: 'Image Placeholders' },
      { id: 'image-positioning', title: 'Image Positioning' },
      { id: 'ai-generation', title: 'AI Generation' },
      { id: 'image-styles', title: 'Image Styles' },
      { id: 'uploading', title: 'Uploading Images' },
    ],
  },
  {
    id: 'themes',
    title: 'Themes',
    icon: Palette,
    children: [
      { id: 'theme-studio', title: 'Theme Studio' },
      { id: 'quick-styles', title: 'Quick Styles' },
      { id: 'custom-themes', title: 'Custom Themes' },
    ],
  },
  {
    id: 'presenting',
    title: 'Presenting',
    icon: Play,
    children: [
      { id: 'presentation-mode', title: 'Presentation Mode' },
      { id: 'keyboard-shortcuts', title: 'Keyboard Shortcuts' },
      { id: 'animations', title: 'Animations & Reveals' },
    ],
  },
  {
    id: 'sharing',
    title: 'Sharing',
    icon: Share2,
    children: [
      { id: 'publishing', title: 'Publishing' },
      { id: 'embedding', title: 'Embedding' },
      { id: 'exporting', title: 'Exporting' },
    ],
  },
  {
    id: 'importing',
    title: 'Importing',
    icon: Upload,
    children: [
      { id: 'supported-formats', title: 'Supported Formats' },
      { id: 'conversion-tips', title: 'Conversion Tips' },
    ],
  },
  {
    id: 'credits',
    title: 'Credits',
    icon: Coins,
    children: [
      { id: 'how-credits-work', title: 'How Credits Work' },
      { id: 'credit-costs', title: 'Credit Costs' },
    ],
  },
];

// Code block component with copy
function CodeBlock({ code, language = 'markdown' }: { code: string; language?: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative group my-4">
      <pre className="bg-[#0a0a0a] border border-white/[0.06] rounded-lg p-4 overflow-x-auto">
        <code className="text-[13px] font-mono text-white/70 leading-relaxed">{code}</code>
      </pre>
      <button
        onClick={handleCopy}
        className="absolute top-2 right-2 p-2 rounded-md bg-white/5 opacity-0 group-hover:opacity-100 hover:bg-white/10 transition-all"
      >
        {copied ? (
          <Check className="w-4 h-4 text-emerald-400" />
        ) : (
          <Copy className="w-4 h-4 text-white/40" />
        )}
      </button>
    </div>
  );
}

// Keyboard shortcut display
function Kbd({ children }: { children: React.ReactNode }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 bg-white/[0.06] border border-white/[0.1] rounded text-[11px] font-mono text-white/60">
      {children}
    </kbd>
  );
}

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState('getting-started');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Scroll spy - track which section is in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll('[data-section]');
      const scrollPosition = window.scrollY + 120;

      sections.forEach((section) => {
        const element = section as HTMLElement;
        const top = element.offsetTop;
        const height = element.offsetHeight;
        const id = element.getAttribute('data-section');

        if (scrollPosition >= top && scrollPosition < top + height && id) {
          setActiveSection(id);
        }
      });
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Smooth scroll to section
  const scrollToSection = (id: string) => {
    const element = document.querySelector(`[data-section="${id}"]`);
    if (element) {
      const top = element.getBoundingClientRect().top + window.scrollY - 100;
      window.scrollTo({ top, behavior: 'smooth' });
      setMobileMenuOpen(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-[#030303] text-[#e8e8e8]"
      style={{ fontFamily: "'Inter', system-ui, sans-serif" }}
    >
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/90 backdrop-blur-xl border-b border-white/[0.04]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-1">
              <Link href="/" className="flex items-center gap-2.5 hover:opacity-80 transition-opacity">
                <RiffIcon size={24} primaryColor="rgba(255, 255, 255, 0.9)" secondaryColor="rgba(255, 255, 255, 0.5)" />
                <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-lg font-semibold tracking-tight">
                  Riff
                </span>
              </Link>
              <SnowTrigger className="ml-0.5 mb-2" />
            </div>
            <div className="hidden sm:flex items-center gap-1.5 text-[13px]">
              <span className="text-white/30">/</span>
              <span className="text-white/60">Documentation</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mobile menu toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-md hover:bg-white/5 text-white/60"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>

            <Link
              href="/editor"
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2 bg-white/[0.05] hover:bg-white/[0.08] border border-white/[0.08] rounded-lg text-[13px] text-white/70 hover:text-white transition-all"
            >
              Open Editor
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto pt-16">
        <div className="flex">
          {/* Sidebar */}
          <aside
            className={`
              fixed lg:sticky top-16 left-0 z-40
              w-72 h-[calc(100vh-4rem)]
              bg-[#030303] lg:bg-transparent
              border-r border-white/[0.04] lg:border-0
              overflow-y-auto overscroll-contain
              transition-transform duration-300 ease-out
              ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
            `}
          >
            <nav className="p-6 lg:pr-8">
              <div className="space-y-1">
                {TOC.map((section) => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id ||
                    section.children.some(c => c.id === activeSection);

                  return (
                    <div key={section.id} className="mb-4">
                      <button
                        onClick={() => scrollToSection(section.id)}
                        className={`
                          w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left
                          transition-all duration-200
                          ${isActive
                            ? 'bg-white/[0.05] text-white'
                            : 'text-white/50 hover:text-white/80 hover:bg-white/[0.02]'
                          }
                        `}
                      >
                        <Icon className="w-4 h-4 opacity-60" />
                        <span className="text-[14px] font-medium">{section.title}</span>
                      </button>

                      {/* Children */}
                      <div className="mt-1 ml-4 pl-4 border-l border-white/[0.06] space-y-0.5">
                        {section.children.map((child) => (
                          <button
                            key={child.id}
                            onClick={() => scrollToSection(child.id)}
                            className={`
                              w-full px-3 py-1.5 rounded-md text-left text-[13px]
                              transition-all duration-200
                              ${activeSection === child.id
                                ? 'text-amber-400 bg-amber-500/[0.08]'
                                : 'text-white/40 hover:text-white/70 hover:bg-white/[0.02]'
                              }
                            `}
                          >
                            {child.title}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </nav>
          </aside>

          {/* Mobile backdrop */}
          {mobileMenuOpen && (
            <div
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />
          )}

          {/* Main content */}
          <main
            ref={contentRef}
            className="flex-1 min-w-0 px-6 lg:px-12 py-12 lg:py-16"
          >
            <div className="max-w-3xl">

              {/* Hero */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-12"
              >
                <h1
                  className="text-4xl sm:text-5xl font-semibold tracking-tight mb-4"
                  style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                >
                  Documentation
                </h1>
                <p className="text-lg text-white/50 leading-relaxed max-w-xl">
                  Everything you need to create beautiful presentations with Riff.
                  From basic markdown to advanced theming.
                </p>
              </motion.div>

              {/* Video Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-10"
              >
                <div className="flex items-center gap-2 mb-4">
                  <Play className="w-4 h-4 text-amber-400" />
                  <h3 className="text-sm font-medium text-white/60 uppercase tracking-wider">Watch Demo</h3>
                </div>
                <div className="rounded-xl overflow-hidden border border-white/[0.08] bg-black/30">
                  <div style={{ position: 'relative', paddingBottom: '56.25%', height: 0 }}>
                    <iframe
                      src="https://www.loom.com/embed/46fdab1604f24901ac1e99b78ba2de6a"
                      frameBorder="0"
                      allowFullScreen
                      style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Philosophy callout */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
                className="mb-16"
              >
                <Link
                  href="/philosophy"
                  className="group block p-5 rounded-xl bg-gradient-to-r from-amber-500/[0.06] to-transparent border border-amber-500/15 hover:border-amber-500/25 transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                      <svg className="w-4.5 h-4.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[14px] text-white/70 group-hover:text-amber-300 transition-colors">
                        <strong className="text-white/90 font-medium">Our Philosophy</strong>
                        <span className="mx-2 text-white/20">·</span>
                        No subscriptions. No dark patterns. No lock-in.
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-amber-400 group-hover:translate-x-0.5 transition-all flex-shrink-0" />
                  </div>
                </Link>
              </motion.div>

              {/* ============================================ */}
              {/* GETTING STARTED */}
              {/* ============================================ */}

              <section data-section="getting-started" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Getting Started</h2>
                </div>
              </section>

              <section data-section="what-is-riff" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">What is Riff?</h3>
                <div className="prose-custom">
                  <p>
                    Riff is a presentation tool that transforms markdown into stunning slide decks.
                    Write your content naturally, and Riff handles the design.
                  </p>
                  <p>
                    No more fighting with slide layouts or hunting for the right template.
                    Just write, and present.
                  </p>
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                    <p className="text-amber-200/80 text-[14px]">
                      <strong className="text-amber-300">Pro tip:</strong> Riff works best when you focus on content first.
                      Write your ideas, then polish the visuals with themes and images.
                    </p>
                  </div>
                </div>
              </section>

              <section data-section="quick-start" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Quick Start</h3>
                <div className="prose-custom">
                  <p>Get your first presentation in 60 seconds:</p>
                  <ol className="list-decimal list-outside ml-5 space-y-3 text-white/60 mt-4">
                    <li>Open the <Link href="/editor" className="text-amber-400 hover:text-amber-300">Editor</Link></li>
                    <li>Paste your content or start typing</li>
                    <li>Use <code>---</code> to separate slides</li>
                    <li>Click <strong className="text-white/80">Present</strong> to view your deck</li>
                  </ol>
                  <p className="mt-4">Here&apos;s a minimal example:</p>
                  <CodeBlock code={`# Welcome to My Talk
### A brief introduction

---

## The Problem
- Point one
- Point two
- Point three

---

## The Solution
Our approach solves everything.

[image: futuristic solution diagram]

---

# Thank You
Questions?`} />
                </div>
              </section>

              <section data-section="editor-overview" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Editor Overview</h3>
                <div className="prose-custom">
                  <p>The editor has three main areas:</p>
                  <ul className="list-disc list-outside ml-5 space-y-2 text-white/60 mt-4">
                    <li><strong className="text-white/80">Left panel:</strong> Markdown editor where you write content</li>
                    <li><strong className="text-white/80">Right panel:</strong> Live preview of your current slide</li>
                    <li><strong className="text-white/80">Top bar:</strong> Tools for themes, images, publishing, and presenting</li>
                  </ul>
                  <p className="mt-4">
                    The editor features syntax highlighting for slide-specific tokens like <code>---</code> delimiters,
                    <code>**pause**</code> markers, and <code>[image:]</code> placeholders.
                  </p>
                </div>
              </section>

              <section data-section="slash-commands" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Slash Commands</h3>
                <div className="prose-custom">
                  <p>
                    Type <code>/</code> anywhere in the editor to open a command menu.
                    Quickly insert common elements without memorizing syntax.
                  </p>
                  <div className="mt-6 space-y-4">
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-cyan-400 text-[13px] font-medium mb-2">Layout Commands</p>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div><code>/section</code> <span className="text-white/40">Section header</span></div>
                        <div><code>/grid</code> <span className="text-white/40">Grid cards</span></div>
                        <div><code>/space</code> <span className="text-white/40">Vertical spacer</span></div>
                        <div><code>/footer</code> <span className="text-white/40">Slide footer</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-emerald-400 text-[13px] font-medium mb-2">Image Commands</p>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div><code>/image</code> <span className="text-white/40">Full-slide image</span></div>
                        <div><code>/image-left</code> <span className="text-white/40">30/70 split</span></div>
                        <div><code>/image-right</code> <span className="text-white/40">70/30 split</span></div>
                        <div><code>/icon</code> <span className="text-white/40">Lucide icon</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-rose-400 text-[13px] font-medium mb-2">Effect Commands</p>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div><code>/pause</code> <span className="text-white/40">Reveal beat</span></div>
                        <div><code>/anvil</code> <span className="text-white/40">Drop animation</span></div>
                        <div><code>/typewriter</code> <span className="text-white/40">Type effect</span></div>
                        <div><code>/glow</code> <span className="text-white/40">Pulsing glow</span></div>
                      </div>
                    </div>
                    <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                      <p className="text-violet-400 text-[13px] font-medium mb-2">Background Commands</p>
                      <div className="grid grid-cols-2 gap-2 text-[13px]">
                        <div><code>/bg-glow</code> <span className="text-white/40">Radial glow</span></div>
                        <div><code>/bg-grid</code> <span className="text-white/40">Grid pattern</span></div>
                        <div><code>/bg-retrogrid</code> <span className="text-white/40">Perspective grid</span></div>
                        <div><code>/bg-dots</code> <span className="text-white/40">Dot pattern</span></div>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] text-white/40">
                    Start typing after <code>/</code> to filter commands. Press <Kbd>Enter</Kbd> or <Kbd>Tab</Kbd> to insert.
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* MARKDOWN SYNTAX */}
              {/* ============================================ */}

              <section data-section="markdown-syntax" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-blue-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Markdown Syntax</h2>
                </div>
              </section>

              <section data-section="slides" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Creating Slides</h3>
                <div className="prose-custom">
                  <p>
                    Separate slides with three dashes (<code>---</code>) on their own line:
                  </p>
                  <CodeBlock code={`# First Slide
Content here

---

# Second Slide
More content

---

# Third Slide
Even more content`} />
                </div>
              </section>

              <section data-section="alignment" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Alignment</h3>
                <div className="prose-custom">
                  <p>
                    Control slide content alignment with <code>[horizontal, vertical]</code> markers at the start of a slide:
                  </p>
                  <CodeBlock code={`[center, center]  // Centered (default)

# Impact Statement

---

[left, top]  // Top-left aligned

# Content-Heavy Slide

- Point one
- Point two
- Point three

---

[center, top]  // Top-centered (good for grids)

# Our Features

[grid]
- ## Feature 1
- ## Feature 2`} />
                  <p className="mt-4">
                    <strong>Horizontal:</strong> <code>left</code>, <code>center</code>, <code>right</code>
                  </p>
                  <p>
                    <strong>Vertical:</strong> <code>top</code>, <code>center</code>, <code>bottom</code>
                  </p>
                </div>
              </section>

              <section data-section="text-formatting" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Text & Formatting</h3>
                <div className="prose-custom">
                  <p>Standard markdown formatting works as expected:</p>
                  <CodeBlock code={`# Heading 1 (slide title)
## Heading 2 (section)
### Heading 3 (subtitle)

**Bold text** for emphasis
*Italic text* for nuance
~~Strikethrough~~ for corrections
\`inline code\` for technical terms

[Link text](https://example.com)`} />
                </div>
              </section>

              <section data-section="lists-tables" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Lists & Tables</h3>
                <div className="prose-custom">
                  <p>Create bullet lists, numbered lists, and tables:</p>
                  <CodeBlock code={`Bullet list:
- First item
- Second item
  - Nested item
- Third item

Numbered list:
1. Step one
2. Step two
3. Step three

Tables:
| Feature | Status |
|---------|--------|
| Themes  | Done   |
| Images  | Done   |
| Export  | Soon   |`} />
                </div>
              </section>

              <section data-section="grid-cards" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Grid Cards</h3>
                <div className="prose-custom">
                  <p>
                    Create horizontal card layouts for features, benefits, or comparisons:
                  </p>
                  <CodeBlock code={`[grid]
- [icon: rocket]
  ## Launch Fast
  Deploy in minutes
- [icon: shield]
  ## Stay Secure
  Enterprise-grade protection
- [icon: zap]
  ## Scale Easy
  Grows with you`} />
                  <p className="mt-4">
                    Each bullet (<code>-</code>) starts a new card. Within each card:
                  </p>
                  <ul className="list-disc ml-5 mt-2 space-y-1 text-white/60">
                    <li><code>[icon: name]</code> - Lucide icon (optional)</li>
                    <li><code>## Heading</code> - Card title</li>
                    <li>Plain text - Description</li>
                  </ul>
                  <p className="mt-4">
                    Use <code>**pause**</code> between grid items for progressive reveals:
                  </p>
                  <CodeBlock code={`[grid]
- ## Step 1
  Research

**pause**

- ## Step 2
  Build

**pause**

- ## Step 3
  Launch`} />
                </div>
              </section>

              <section data-section="code-blocks" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Code Blocks</h3>
                <div className="prose-custom">
                  <p>Display code with syntax highlighting:</p>
                  <CodeBlock code={`\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}!\`;
}
\`\`\`

\`\`\`python
def greet(name):
    return f"Hello, {name}!"
\`\`\``} />
                </div>
              </section>

              <section data-section="speaker-notes" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Speaker Notes</h3>
                <div className="prose-custom">
                  <p>
                    Add notes that only you see during presentation. Use blockquotes:
                  </p>
                  <CodeBlock code={`# My Slide Title

Visible content here.

> These are speaker notes.
> Only visible in presenter mode.
> Use them to remember key points.`} />
                  <p className="mt-4">
                    Press <Kbd>N</Kbd> during presentation to toggle notes.
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* IMAGES */}
              {/* ============================================ */}

              <section data-section="images" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-green-500/20 flex items-center justify-center">
                    <Image className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Images</h2>
                </div>
              </section>

              <section data-section="image-placeholders" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Image Placeholders</h3>
                <div className="prose-custom">
                  <p>
                    Add images by describing what you want. Riff shows a placeholder that you can
                    click to generate or upload an image:
                  </p>
                  <CodeBlock code={`[image: a serene mountain landscape at sunset]

[image: diagram showing user authentication flow]

[image: team collaboration in modern office]`} />
                </div>
              </section>

              <section data-section="image-positioning" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Image Positioning</h3>
                <div className="prose-custom">
                  <p>
                    Create split layouts by adding a position after the description:
                  </p>
                  <CodeBlock code={`[image: description, left]    // 30% image left, 70% content right
[image: description, right]   // 70% content left, 30% image right
[image: description, top]     // 70% image top, 30% content bottom
[image: description, bottom]  // 30% content top, 70% image bottom`} />
                  <p className="mt-4">
                    Left/right positions create portrait-oriented images, while top/bottom create landscape-oriented images.
                  </p>
                  <CodeBlock code={`[left, center]

# Our Process

### Building great products requires great collaboration

[image: Team brainstorming around whiteboard, right]`} />
                </div>
              </section>

              <section data-section="ai-generation" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">AI Generation</h3>
                <div className="prose-custom">
                  <p>
                    Click any image placeholder, then click the generate button. Riff uses AI
                    to create an image matching your description.
                  </p>
                  <div className="mt-4 p-4 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <p className="text-white/50 text-[14px]">
                      <strong className="text-white/70">Tips for better results:</strong>
                    </p>
                    <ul className="list-disc list-outside ml-5 mt-2 space-y-1 text-white/50 text-[14px]">
                      <li>Be specific about style: &quot;minimalist illustration&quot; vs &quot;photorealistic&quot;</li>
                      <li>Include colors: &quot;blue and orange color scheme&quot;</li>
                      <li>Describe composition: &quot;centered, with negative space&quot;</li>
                    </ul>
                  </div>
                </div>
              </section>

              <section data-section="image-styles" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Image Styles</h3>
                <div className="prose-custom">
                  <p>
                    Use the <strong>Style</strong> dropdown in the toolbar to set a default
                    style for all generated images:
                  </p>
                  <ul className="list-disc list-outside ml-5 space-y-2 text-white/60 mt-4">
                    <li><strong className="text-white/80">None:</strong> Use your description as-is</li>
                    <li><strong className="text-white/80">Photographic:</strong> Realistic, high-quality photos</li>
                    <li><strong className="text-white/80">Illustration:</strong> Clean, vector-style graphics</li>
                    <li><strong className="text-white/80">3D Render:</strong> Modern 3D visualizations</li>
                    <li><strong className="text-white/80">Sketch:</strong> Hand-drawn aesthetic</li>
                  </ul>
                </div>
              </section>

              <section data-section="uploading" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Uploading Images</h3>
                <div className="prose-custom">
                  <p>
                    Click any image placeholder, then click the upload button to use your own image.
                    Supported formats: JPG, PNG, GIF, WebP.
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* THEMES */}
              {/* ============================================ */}

              <section data-section="themes" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center">
                    <Palette className="w-5 h-5 text-purple-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Themes</h2>
                </div>
              </section>

              <section data-section="theme-studio" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Theme Studio</h3>
                <div className="prose-custom">
                  <p>
                    Click the <strong>Theme</strong> button in the toolbar to open Theme Studio.
                    Describe the mood you want, and AI generates matching colors, fonts, and styling.
                  </p>
                  <CodeBlock code={`Example prompts:

"Dark minimal with subtle cyan accents"
"Warm and elegant with gold on deep burgundy"
"Clean Apple-style with generous white space"
"Editorial magazine with sophisticated serifs"`} />
                </div>
              </section>

              <section data-section="quick-styles" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Quick Styles</h3>
                <div className="prose-custom">
                  <p>
                    Theme Studio includes pre-built quick styles. Click any style to load its
                    prompt, then click Generate to apply it.
                  </p>
                </div>
              </section>

              <section data-section="custom-themes" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Custom Themes</h3>
                <div className="prose-custom">
                  <p>
                    For advanced control, expand &quot;Advanced: System Prompt&quot; in Theme Studio.
                    This lets you customize the instructions given to the AI theme generator.
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* PRESENTING */}
              {/* ============================================ */}

              <section data-section="presenting" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-500/20 to-red-500/20 flex items-center justify-center">
                    <Play className="w-5 h-5 text-rose-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Presenting</h2>
                </div>
              </section>

              <section data-section="presentation-mode" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Presentation Mode</h3>
                <div className="prose-custom">
                  <p>
                    Click <strong>Present</strong> in the toolbar to enter fullscreen presentation mode.
                    Your slides display edge-to-edge with a minimal control bar.
                  </p>
                </div>
              </section>

              <section data-section="keyboard-shortcuts" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Keyboard Shortcuts</h3>
                <div className="prose-custom">
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center gap-3">
                      <Kbd>Space</Kbd>
                      <span className="text-white/60 text-[14px]">Next slide</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>←</Kbd>
                      <span className="text-white/60 text-[14px]">Previous slide</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>F</Kbd>
                      <span className="text-white/60 text-[14px]">Toggle fullscreen</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>N</Kbd>
                      <span className="text-white/60 text-[14px]">Toggle notes</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>G</Kbd>
                      <span className="text-white/60 text-[14px]">Slide overview</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>Home</Kbd>
                      <span className="text-white/60 text-[14px]">First slide</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>End</Kbd>
                      <span className="text-white/60 text-[14px]">Last slide</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Kbd>Esc</Kbd>
                      <span className="text-white/60 text-[14px]">Exit presentation</span>
                    </div>
                  </div>
                </div>
              </section>

              <section data-section="animations" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Animations & Reveals</h3>
                <div className="prose-custom">
                  <p>
                    Use <code>**pause**</code> to create click-to-reveal content:
                  </p>
                  <CodeBlock code={`# Building Suspense

First point appears immediately.

**pause**

Second point appears on click.

**pause**

Final reveal!`} />
                  <p className="mt-4">
                    <strong>Text Effects</strong> - Add animations to titles:
                  </p>
                  <CodeBlock code={`# Title [anvil]       // Dramatic drop-in bounce
# Title [typewriter]  // Character-by-character
# Title [glow]        // Pulsing glow effect
# Title [shake]       // Attention-grabbing shake`} />
                  <p className="mt-4">
                    <strong>Background Effects</strong> - Decorative slide backgrounds:
                  </p>
                  <CodeBlock code={`[bg:glow-center]            // Radial glow
[bg:grid-top-right]         // Grid pattern
[bg:hatch-bottom-left-amber] // Hatched pattern
[bg:dashed-center-blue]     // Dashed grid`} />
                  <p className="mt-4 text-white/50">
                    Colors: <code>accent</code>, <code>amber</code>, <code>blue</code>, <code>purple</code>, <code>rose</code>, <code>emerald</code>, <code>cyan</code>, <code>orange</code>, <code>pink</code>
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* SHARING */}
              {/* ============================================ */}

              <section data-section="sharing" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-sky-500/20 to-blue-500/20 flex items-center justify-center">
                    <Share2 className="w-5 h-5 text-sky-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Sharing</h2>
                </div>
              </section>

              <section data-section="publishing" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Publishing</h3>
                <div className="prose-custom">
                  <p>
                    Click <strong>Publish</strong> in the toolbar to make your deck public.
                    You&apos;ll get a shareable link that anyone can view.
                  </p>
                  <p className="mt-4">
                    Published decks are accessible at <code>riff.im/p/[token]</code>
                  </p>
                </div>
              </section>

              <section data-section="embedding" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Embedding</h3>
                <div className="prose-custom">
                  <p>
                    After publishing, copy the embed code to add your presentation to any website:
                  </p>
                  <CodeBlock code={`<iframe
  src="https://riff.im/embed/[token]"
  width="100%"
  height="500"
  frameborder="0"
  allowfullscreen
></iframe>`} />
                </div>
              </section>

              <section data-section="exporting" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Exporting</h3>
                <div className="prose-custom">
                  <p>
                    Your content is stored as markdown, making it easy to export. Copy from
                    the editor to save your slides as a <code>.md</code> file.
                  </p>
                </div>
              </section>

              {/* ============================================ */}
              {/* IMPORTING */}
              {/* ============================================ */}

              <section data-section="importing" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-amber-500/20 flex items-center justify-center">
                    <Upload className="w-5 h-5 text-orange-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Importing</h2>
                </div>
              </section>

              <section data-section="supported-formats" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Supported Formats</h3>
                <div className="prose-custom">
                  <p>
                    Import existing documents to convert them to slides:
                  </p>
                  <ul className="list-disc list-outside ml-5 space-y-2 text-white/60 mt-4">
                    <li><strong className="text-white/80">PDF:</strong> Extracts text and converts to slides</li>
                    <li><strong className="text-white/80">DOCX:</strong> Word documents</li>
                    <li><strong className="text-white/80">TXT:</strong> Plain text files</li>
                    <li><strong className="text-white/80">MD:</strong> Markdown files</li>
                  </ul>
                </div>
              </section>

              <section data-section="conversion-tips" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Conversion Tips</h3>
                <div className="prose-custom">
                  <p>For best results when importing:</p>
                  <ul className="list-disc list-outside ml-5 space-y-2 text-white/60 mt-4">
                    <li>Use clear headings in your source document</li>
                    <li>Break content into logical sections</li>
                    <li>Keep paragraphs concise</li>
                    <li>Review and edit after import</li>
                  </ul>
                </div>
              </section>

              {/* ============================================ */}
              {/* CREDITS */}
              {/* ============================================ */}

              <section data-section="credits" className="scroll-mt-24">
                <div className="flex items-center gap-3 mb-8">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-yellow-500/20 flex items-center justify-center">
                    <Coins className="w-5 h-5 text-amber-400" />
                  </div>
                  <h2 className="text-2xl font-semibold">Credits</h2>
                </div>
              </section>

              <section data-section="how-credits-work" className="mb-12 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">How Credits Work</h3>
                <div className="prose-custom">
                  <p>
                    Credits are used for AI-powered features. You only pay for what you use—no subscriptions,
                    no monthly fees.
                  </p>
                  <ul className="list-disc list-outside ml-5 space-y-2 text-white/60 mt-4">
                    <li><strong className="text-white/80">New users</strong> get 50 free credits to explore</li>
                    <li><strong className="text-white/80">$1 = 20 credits</strong> ($0.05 per credit)</li>
                    <li><strong className="text-white/80">Credits never expire</strong></li>
                  </ul>
                  <div className="mt-6 p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-transparent border border-amber-500/20">
                    <p className="text-amber-200/80 text-[14px]">
                      <strong className="text-amber-300">Our philosophy:</strong> Don&apos;t create anxiety
                      around parked money. Buy what you need, use it whenever.{' '}
                      <Link href="/philosophy" className="text-amber-400 hover:text-amber-300">Read more →</Link>
                    </p>
                  </div>
                </div>
              </section>

              <section data-section="credit-costs" className="mb-16 scroll-mt-24">
                <h3 className="text-xl font-medium mb-4 text-white/90">Credit Costs</h3>
                <div className="prose-custom">
                  <p>Here&apos;s what each AI feature costs:</p>
                  <div className="mt-6 p-5 rounded-xl bg-white/[0.02] border border-white/[0.06]">
                    <div className="space-y-3">
                      {/* Major operations - 5 credits ($0.25) */}
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <span className="text-white/70">Generate image</span>
                        <span className="text-amber-400 font-medium tabular-nums">5 credits</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <span className="text-white/70">Restyle image</span>
                        <span className="text-amber-400 font-medium tabular-nums">5 credits</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <div>
                          <span className="text-white/70">Import document</span>
                          <span className="text-white/40 text-[13px] ml-2">(premium AI conversion)</span>
                        </div>
                        <span className="text-amber-400 font-medium tabular-nums">5 credits</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <span className="text-white/70">Revamp deck</span>
                        <span className="text-amber-400 font-medium tabular-nums">5 credits</span>
                      </div>
                      {/* Minor operations - 1 credit ($0.05) */}
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <span className="text-white/70">Generate theme</span>
                        <span className="text-amber-400 font-medium tabular-nums">1 credit</span>
                      </div>
                      <div className="flex justify-between items-center py-2 border-b border-white/[0.06]">
                        <span className="text-white/70">Add slide</span>
                        <span className="text-amber-400 font-medium tabular-nums">1 credit</span>
                      </div>
                      <div className="flex justify-between items-center py-2">
                        <span className="text-white/70">Revamp slide</span>
                        <span className="text-amber-400 font-medium tabular-nums">1 credit</span>
                      </div>
                    </div>
                  </div>
                  <p className="mt-4 text-[14px] text-white/40">
                    Everything else—editing, presenting, publishing, embedding—is completely free.
                  </p>
                </div>
              </section>

              {/* Footer */}
              <footer className="mt-20 pt-8 border-t border-white/[0.06]">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <p className="text-[14px] text-white/30">
                    Need help? Reach out at{' '}
                    <a href="mailto:hello@riff.im" className="text-amber-400/80 hover:text-amber-400">
                      hello@riff.im
                    </a>
                  </p>
                  <div className="flex items-center gap-6 text-[13px] text-white/30">
                    <Link href="/terms" className="hover:text-white/50 transition-colors">Terms</Link>
                    <Link href="/privacy" className="hover:text-white/50 transition-colors">Privacy</Link>
                  </div>
                </div>
              </footer>
            </div>
          </main>
        </div>
      </div>

      {/* Custom prose styles */}
      <style jsx global>{`
        .prose-custom p {
          color: rgba(255, 255, 255, 0.6);
          line-height: 1.75;
          margin-bottom: 1rem;
        }
        .prose-custom code {
          background: rgba(255, 255, 255, 0.06);
          padding: 0.2em 0.4em;
          border-radius: 4px;
          font-size: 0.9em;
          color: rgba(255, 255, 255, 0.8);
          font-family: 'SF Mono', 'Fira Code', monospace;
        }
        .prose-custom strong {
          color: rgba(255, 255, 255, 0.9);
        }
        .prose-custom a {
          color: #fbbf24;
          text-decoration: none;
        }
        .prose-custom a:hover {
          color: #fcd34d;
        }
      `}</style>
    </div>
  );
}
