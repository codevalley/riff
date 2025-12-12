'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  LayoutGrid,
  PanelLeft,
  FileText,
  FileSymlink,
  Plus,
  ImageIcon,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { DocumentUploader } from './DocumentUploader';

// Demo content for the animated preview
const demoMarkdown = `# Quarterly Review

### Key achievements this quarter

**pause**

### Revenue up 23%

---

[image: growth chart]

# Looking Ahead`;

const demoSlides = [
  { title: 'Quarterly Review', subtitle: 'Key achievements this quarter' },
  { title: 'Quarterly Review', subtitle: 'Revenue up 23%' },
  { title: 'Looking Ahead', hasImage: true },
];

export function Landing() {
  const [showUploader, setShowUploader] = useState(false);
  const [currentDemoSlide, setCurrentDemoSlide] = useState(0);
  const [typedText, setTypedText] = useState('');
  const [isTyping, setIsTyping] = useState(true);

  // Typing animation effect
  useEffect(() => {
    if (!isTyping) return;

    const lines = demoMarkdown.split('\n');
    let currentLine = 0;
    let currentChar = 0;
    let text = '';

    const typeInterval = setInterval(() => {
      if (currentLine >= lines.length) {
        setIsTyping(false);
        clearInterval(typeInterval);
        return;
      }

      if (currentChar < lines[currentLine].length) {
        text += lines[currentLine][currentChar];
        currentChar++;
      } else {
        text += '\n';
        currentLine++;
        currentChar = 0;
      }

      setTypedText(text);
    }, 30);

    return () => clearInterval(typeInterval);
  }, [isTyping]);

  // Slide cycling effect
  useEffect(() => {
    const slideInterval = setInterval(() => {
      setCurrentDemoSlide((prev) => (prev + 1) % demoSlides.length);
    }, 3000);

    return () => clearInterval(slideInterval);
  }, []);

  // Restart typing animation periodically
  useEffect(() => {
    const restartInterval = setInterval(() => {
      setTypedText('');
      setIsTyping(true);
    }, 15000);

    return () => clearInterval(restartInterval);
  }, []);

  return (
    <>
      {/* Custom styles for this page */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;500;600;700;800;900&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400&display=swap');
      `}</style>

      <div className="min-h-screen bg-[#030303] text-[#fafafa]" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 bg-[#030303]/80 backdrop-blur-xl border-b border-white/[0.05]">
          <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <LayoutGrid className="w-5 h-5 text-white/80" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-xl font-semibold tracking-tight">
                Riff
              </span>
            </Link>
            <Link
              href="/editor"
              className="inline-flex items-center gap-2 text-[13px] text-white/50 hover:text-white transition-colors duration-200"
            >
              <PanelLeft className="w-4 h-4" />
              <span>Editor</span>
            </Link>
          </div>
        </nav>

        {/* Hero Section */}
        <section className="relative pt-36 pb-24 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
              backgroundSize: '40px 40px',
              mask: 'linear-gradient(to bottom, black 0%, transparent 70%)',
              WebkitMask: 'linear-gradient(to bottom, black 0%, transparent 70%)',
            }}
          />
          <div className="max-w-4xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* <span className="inline-flex items-center px-3.5 py-1.5 mb-10 text-[11px] uppercase tracking-[0.15em] text-white/40 bg-white/[0.03] border border-white/[0.06] rounded-full">
                Documents to slides
              </span> */}

              <h1
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[clamp(3rem,8vw,6rem)] font-bold leading-[0.95] mb-8 tracking-tight"
              >
                Turn your notes
                <br />
                <span className="text-white/25">to a stunning deck.</span>
              </h1>

              <p className="text-[20px] text-white/50 mb-14 max-w-lg mx-auto leading-relaxed font-normal" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Turn your notes, document, scribbles and ideas into polished presentations.
                Simple markdown syntax, beautiful output.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowUploader(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-black rounded-xl font-medium text-[14px] hover:bg-white/90 transition-all duration-200"
                >
                  <FileSymlink className="w-4 h-4" />
                  I have content
                </button>

                <Link
                  href="/editor"
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/70 text-[14px] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Empty deck
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Live Demo Section */}
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
            >
              {/* Browser mockup */}
              <div className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50">
                {/* Browser chrome */}
                <div className="flex items-center gap-2 px-4 py-3 bg-[#080808] border-b border-white/[0.05]">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                    <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                    <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                  </div>
                  <div className="flex-1 flex justify-center">
                    <div className="px-4 py-1.5 bg-white/[0.03] rounded-lg text-[11px] text-white/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      riff.app/editor
                    </div>
                  </div>
                </div>

                {/* Editor mockup */}
                <div className="flex min-h-[400px]">
                  {/* Markdown editor side */}
                  <div className="w-[42%] border-r border-white/[0.05] p-6 bg-[#050505]">
                    <div className="text-[10px] text-white/30 mb-4 uppercase tracking-[0.2em] font-medium">
                      Markdown
                    </div>
                    <pre className="text-[13px] text-white/50 whitespace-pre-wrap leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                      {typedText}
                      <span className="animate-pulse text-white">|</span>
                    </pre>
                  </div>

                  {/* Preview side */}
                  <div className="flex-1 p-6 bg-[#080808]">
                    <div className="text-[10px] text-white/30 mb-4 uppercase tracking-[0.2em] font-medium">
                      Preview
                    </div>
                    <div className="aspect-video bg-[#0a0a0a] rounded-xl border border-white/[0.05] flex items-center justify-center overflow-hidden">
                      <motion.div
                        key={currentDemoSlide}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                        className="text-center p-8"
                      >
                        {demoSlides[currentDemoSlide].hasImage && (
                          <div className="w-20 h-14 mx-auto mb-4 bg-white/[0.02] rounded-lg border border-white/[0.05] flex items-center justify-center">
                            <ImageIcon className="w-5 h-5 text-white/20" />
                          </div>
                        )}
                        <h3 style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="text-2xl mb-2 text-white font-semibold">
                          {demoSlides[currentDemoSlide].title}
                        </h3>
                        {demoSlides[currentDemoSlide].subtitle && (
                          <p className="text-sm text-white/40">
                            {demoSlides[currentDemoSlide].subtitle}
                          </p>
                        )}
                      </motion.div>
                    </div>

                    {/* Slide indicators */}
                    <div className="flex justify-center gap-2 mt-5">
                      {demoSlides.map((_, i) => (
                        <div
                          key={i}
                          className={`h-1 rounded-full transition-all duration-300 ${
                            i === currentDemoSlide ? 'bg-white w-6' : 'bg-white/20 w-1'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="relative py-32 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.12) 25%, transparent 25%), linear-gradient(-45deg, rgba(255,255,255,0.12) 25%, transparent 25%)',
              backgroundSize: '30px 30px',
              mask: 'linear-gradient(to top right, black 0%, transparent 60%)',
              WebkitMask: 'linear-gradient(to top right, black 0%, transparent 60%)',
            }}
          />
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tight mb-5"
              >
                How it works
              </h2>
              <p className="text-[20px] text-white/50 max-w-md mx-auto" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                From document to presentation in four simple steps
              </p>
            </motion.div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-[1080px] mx-auto">
              <FeatureCard
                title="Import your doc"
                description="Drop in any document. We convert it to slides automatically."
                visual={<ImportVisual />}
                delay={0}
              />
              <FeatureCard
                title="Edit in markdown"
                description="Familiar syntax. Headings become titles, lists become bullets."
                visual={<MarkdownVisual />}
                delay={0.1}
              />
              <FeatureCard
                title="Describe visuals"
                description="Type [image: description] and images appear where you need them."
                visual={<ImageVisual />}
                delay={0.15}
              />
              <FeatureCard
                title="Present anywhere"
                description="Full-screen mode with keyboard shortcuts. Works on any device."
                visual={<PresentVisual />}
                delay={0.2}
              />
            </div>
          </div>
        </section>

        {/* Capabilities Section */}
        <section className="relative py-32 px-6 bg-[#050505] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.18) 1.5px, transparent 1.5px)',
              backgroundSize: '20px 20px',
              mask: 'linear-gradient(to left, black 0%, transparent 60%)',
              WebkitMask: 'linear-gradient(to left, black 0%, transparent 60%)',
            }}
          />
          <div className="max-w-5xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tight mb-5"
              >
                Built for speed
              </h2>
              <p className="text-[20px] text-white/50 max-w-md mx-auto" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Everything you need to create presentations fast
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              <CapabilityCard
                title="Document import"
                description="Drop in a doc or paste text. It becomes slides automatically."
                delay={0}
              />
              <CapabilityCard
                title="Theme generation"
                description="Describe the mood. Get matching colors, fonts, and styling."
                delay={0.05}
              />
              <CapabilityCard
                title="Smart images"
                description="Describe what you need. Images appear where you put them."
                delay={0.1}
              />
              <CapabilityCard
                title="Background effects"
                description="Glows, grids, patterns. One line of syntax."
                delay={0.15}
              />
              <CapabilityCard
                title="Code highlighting"
                description="Syntax highlighting for any language. Just use code blocks."
                delay={0.2}
              />
              <CapabilityCard
                title="Cloud sync"
                description="Your decks are saved automatically. Access from anywhere."
                delay={0.25}
              />
            </div>
          </div>
        </section>

        {/* Syntax Preview Section */}
        <section className="relative py-32 px-6 overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
              backgroundSize: '50px 50px',
              mask: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
              WebkitMask: 'radial-gradient(ellipse at center, black 0%, transparent 80%)',
            }}
          />
          <div className="max-w-4xl mx-auto relative z-10">
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[clamp(2.25rem,5vw,3.5rem)] font-semibold tracking-tight mb-5"
              >
                The syntax
              </h2>
              <p className="text-[20px] text-white/50 max-w-md mx-auto" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                If you know markdown, you already know Riff
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="bg-[#0a0a0a] border border-white/10 rounded-2xl overflow-hidden shadow-2xl shadow-black/50"
            >
              <div className="flex items-center justify-between px-4 py-3 bg-[#080808] border-b border-white/[0.05]">
                <span className="text-[11px] text-white/30" style={{ fontFamily: "'JetBrains Mono', monospace" }}>slides.md</span>
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-[#ff5f57]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#febc2e]" />
                  <div className="w-2.5 h-2.5 rounded-full bg-[#28c840]" />
                </div>
              </div>
              <div className="p-6">
                <pre className="text-[13px] text-white/50 overflow-x-auto leading-relaxed" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                  <code>{`# Main Title [anvil]
### Subtitle with animation effect

> Speaker notes go here (hidden during presentation)

**pause**

### This appears on click

---

[bg:glow-bottom-left]

# Section Header
[section]

---

## Feature Highlights

- First bullet point
- Second with \`highlighted\` text
- Third point

**pause**

[image: A futuristic cityscape at sunset]`}</code>
                </pre>
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="relative py-32 px-6 bg-[#050505] overflow-hidden">
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'repeating-linear-gradient(-45deg, transparent, transparent 20px, rgba(255,255,255,0.12) 20px, rgba(255,255,255,0.12) 22px)',
              mask: 'linear-gradient(to top, black 0%, transparent 60%)',
              WebkitMask: 'linear-gradient(to top, black 0%, transparent 60%)',
            }}
          />
          <div className="max-w-2xl mx-auto text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[clamp(2.5rem,6vw,4rem)] font-semibold tracking-tight mb-6"
              >
                Ready?
              </h2>
              <p className="text-[20px] text-white/50 mb-12" style={{ fontFamily: "ui-sans-serif, system-ui, sans-serif" }}>
                Start from scratch or bring your existing content.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <button
                  onClick={() => setShowUploader(true)}
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white text-black rounded-xl font-medium text-[14px] hover:bg-white/90 transition-all duration-200"
                >
                  <FileSymlink className="w-4 h-4" />
                  I have content
                </button>
                <Link
                  href="/editor"
                  className="inline-flex items-center gap-2.5 px-6 py-3 bg-white/[0.03] border border-white/[0.08] rounded-xl text-white/70 text-[14px] hover:bg-white/[0.06] hover:border-white/[0.12] transition-all duration-200"
                >
                  <Plus className="w-4 h-4" />
                  Empty deck
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-white/[0.05]">
          <div className="max-w-6xl mx-auto flex items-center justify-between text-[13px] text-white/30">
            <div className="flex items-center gap-2.5">
              <LayoutGrid className="w-4 h-4" strokeWidth={1.5} />
              <span style={{ fontFamily: "'Playfair Display', Georgia, serif" }} className="font-medium">Riff</span>
            </div>
            <span className="text-[#444]">Built with vibes. Present with style.</span>
          </div>
        </footer>

        {/* Document Uploader Modal */}
        {showUploader && <DocumentUploader onClose={() => setShowUploader(false)} />}
      </div>
    </>
  );
}

// Feature card with visual illustration - ai-sdk.dev style
function FeatureCard({
  title,
  description,
  visual,
  delay = 0,
}: {
  title: string;
  description: string;
  visual: React.ReactNode;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="h-[360px] relative text-left transition-transform scale-100 hover:scale-[1.02] duration-300"
    >
      <div className="bg-[#0a0a0a] size-full flex flex-col transition-all border shadow-sm border-[#1f1f1f] hover:border-[#2e2e2e] relative hover:shadow-lg p-4 rounded-md">
        {/* Visual area - fixed height */}
        <div className="h-[220px] flex items-center justify-center overflow-hidden">
          {visual}
        </div>
        {/* Text area - fixed at bottom */}
        <div className="h-[80px] mt-auto">
          <p className="text-lg font-semibold leading-tight tracking-tight text-[#f5f5f5]">{title}</p>
          <p className="mt-1 text-sm text-[#737373] line-clamp-2">{description}</p>
        </div>
      </div>
    </motion.div>
  );
}

// Grid capability card
function CapabilityCard({
  title,
  description,
  delay = 0,
}: {
  title: string;
  description: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      transition={{ delay }}
      className="bg-[#0a0a0a] border shadow-sm border-[#1f1f1f] hover:border-[#2e2e2e] rounded-md p-5 hover:shadow-lg transition-all duration-200"
    >
      <p className="text-lg font-semibold leading-tight tracking-tight text-[#f5f5f5] mb-2">{title}</p>
      <p className="text-sm text-[#737373]">{description}</p>
    </motion.div>
  );
}

// Visual components for feature cards - compact versions
function ImportVisual() {
  return (
    <div className="w-36 h-40 relative flex items-center justify-center">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Document icon - top left */}
        <div className="absolute top-0 left-2 w-9 h-9 rounded-lg bg-black border border-[rgba(255,255,255,0.14)] shadow-sm flex items-center justify-center">
          <FileText className="w-3.5 h-3.5 text-[#ededed]" />
        </div>

        {/* Text lines icon - top right */}
        <div className="absolute top-0 right-2 w-9 h-9 rounded-lg bg-black border border-[rgba(255,255,255,0.14)] shadow-sm flex items-center justify-center">
          <div className="space-y-0.5">
            <div className="w-3 h-0.5 bg-[#ededed] rounded-full" />
            <div className="w-2.5 h-0.5 bg-[#ededed]/60 rounded-full" />
            <div className="w-3 h-0.5 bg-[#ededed]/40 rounded-full" />
          </div>
        </div>

        {/* Slides icon - bottom left */}
        <div className="absolute bottom-0 left-2 w-9 h-9 rounded-lg bg-black border border-[rgba(255,255,255,0.14)] shadow-sm flex items-center justify-center">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1.5 h-1 bg-[#ededed] rounded-sm" />
            <div className="w-1.5 h-1 bg-[#ededed]/60 rounded-sm" />
            <div className="w-1.5 h-1 bg-[#ededed]/40 rounded-sm" />
            <div className="w-1.5 h-1 bg-[#ededed]/20 rounded-sm" />
          </div>
        </div>

        {/* Arrow icon - bottom right */}
        <div className="absolute bottom-0 right-2 w-9 h-9 rounded-lg bg-black border border-[rgba(255,255,255,0.14)] shadow-sm flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-[#ededed]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M5 12h14m-7-7l7 7-7 7" />
          </svg>
        </div>

        {/* Center Riff logo */}
        <div className="w-12 h-12 rounded-lg bg-black border border-[rgba(255,255,255,0.14)] shadow-md flex items-center justify-center">
          <div className="w-6 h-6 rounded-full bg-[#ededed] flex items-center justify-center">
            <LayoutGrid className="w-3 h-3 text-[#0a0a0a]" />
          </div>
        </div>
      </div>
    </div>
  );
}

function MarkdownVisual() {
  return (
    <div className="w-36 h-40 flex items-center justify-center">
      <div className="w-full h-36 border rounded-md shadow bg-black border-[#404040]">
        <div className="flex bg-[rgba(75,85,99,0.05)] p-1 border-b gap-1 border-[#404040]">
          <div className="border rounded-full size-1.5 bg-[#dc2626] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#f59e0b] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#16a34a] border-[#1f1f1f]" />
        </div>
        <div className="p-2 text-[9px]" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          <div className="text-[#ededed]"># Title</div>
          <div className="text-[#737373] mt-0.5">### Subtitle</div>
          <div className="text-[#525252] mt-0.5">- Point one</div>
          <div className="text-[#525252]">- Point two</div>
          <div className="text-[#404040] mt-1">---</div>
        </div>
      </div>
    </div>
  );
}

function ImageVisual() {
  return (
    <div className="w-36 h-40 flex items-center justify-center">
      <div className="w-full h-36 border rounded-md shadow bg-black border-[#404040] flex flex-col">
        <div className="flex bg-[rgba(75,85,99,0.05)] p-1 border-b gap-1 border-[#404040]">
          <div className="border rounded-full size-1.5 bg-[#dc2626] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#f59e0b] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#16a34a] border-[#1f1f1f]" />
        </div>
        <div className="flex-1 flex items-center justify-center p-2">
          <div className="w-full h-full border border-dashed border-[#404040] rounded flex items-center justify-center">
            <ImageIcon className="w-5 h-5 text-[#525252]" />
          </div>
        </div>
        <div className="px-2 pb-1.5 text-[8px] text-[#525252] text-center" style={{ fontFamily: "'JetBrains Mono', monospace" }}>
          [image: desc]
        </div>
      </div>
    </div>
  );
}

function PresentVisual() {
  return (
    <div className="w-36 h-40 flex items-center justify-center">
      <div className="w-full h-36 border rounded-md shadow bg-black border-[#404040] flex flex-col">
        <div className="flex bg-[rgba(75,85,99,0.05)] p-1 border-b gap-1 border-[#404040]">
          <div className="border rounded-full size-1.5 bg-[#dc2626] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#f59e0b] border-[#1f1f1f]" />
          <div className="border rounded-full size-1.5 bg-[#16a34a] border-[#1f1f1f]" />
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-3">
          <div className="w-16 h-1.5 bg-[#525252] rounded mb-1.5" />
          <div className="w-10 h-1 bg-[#404040] rounded mb-3" />
          <div className="w-6 h-6 rounded-full bg-[#1f1f1f] flex items-center justify-center">
            <Play className="w-3 h-3 text-[#ededed] ml-0.5" fill="currentColor" />
          </div>
        </div>
      </div>
    </div>
  );
}
