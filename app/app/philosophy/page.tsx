'use client';

// ============================================
// RIFF - Philosophy Page
// A thoughtful essay on our values and approach
// ============================================

import { motion } from 'framer-motion';
import Link from 'next/link';
import { RiffIcon } from '@/components/RiffIcon';
import { SnowTrigger } from '@/components/SnowfallEffect';
import { ArrowLeft } from 'lucide-react';

// Elegant fade-in animation
const fadeIn = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: [0.25, 0.1, 0.25, 1] },
};

// Staggered children animation
const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

export default function PhilosophyPage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white relative overflow-hidden">
      {/* Background dot pattern */}
      <div
        className="fixed inset-0 pointer-events-none opacity-100"
        style={{
          backgroundImage: 'radial-gradient(circle, rgba(255, 255, 255, 0.07) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
        }}
      />

      {/* Top gradient glow */}
      <div
        className="fixed top-0 left-0 right-0 h-[500px] pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 60% 40% at 50% 0%, rgba(251, 191, 36, 0.06), transparent)',
        }}
      />

      {/* Side vignette */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(0,0,0,0.4) 100%)',
        }}
      />

      {/* Subtle grain texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.015]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        }}
      />

      {/* Minimal header */}
      <nav className="fixed top-0 left-0 right-0 z-50 px-6 h-16 flex items-center border-b border-white/[0.04] bg-[#030303]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto w-full flex items-center justify-between">
          <div className="flex items-center gap-1">
            <Link href="/" className="flex items-center gap-3 hover:opacity-70 transition-opacity">
              <RiffIcon size={24} primaryColor="rgba(255, 255, 255, 0.85)" secondaryColor="rgba(255, 255, 255, 0.4)" />
              <span
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-lg font-medium tracking-tight"
              >
                Riff
              </span>
            </Link>
            <SnowTrigger className="ml-0.5 mb-2" />
          </div>
          <Link
            href="/"
            className="flex items-center gap-2 text-[13px] text-white/40 hover:text-white/70 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back
          </Link>
        </div>
      </nav>

      {/* Main content */}
      <main className="relative pt-32 pb-24 px-6">
        <motion.article
          className="max-w-[680px] mx-auto"
          initial="initial"
          animate="animate"
          variants={stagger}
        >
          {/* Header */}
          <motion.header variants={fadeIn} className="mb-6">
            <p className="text-[13px] uppercase tracking-[0.2em] text-amber-500/70 mb-4 font-medium">
              Our Philosophy
            </p>
            <h1
              style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
              className="text-[clamp(2.5rem,5vw,3.5rem)] font-medium leading-[1.1] tracking-tight text-white/95 mb-5"
            >
              Worth staying for
            </h1>
            <p className="text-[19px] leading-relaxed text-white/50 mb-5">
              Most software is designed to keep you. We&apos;d rather build something worth staying for.
            </p>
            {/* Jump link to values */}
            <a
              href="#values"
              className="inline-flex items-center gap-2 text-[13px] text-amber-500/70 hover:text-amber-400 transition-colors group"
            >
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
              <span>Our values</span>
            </a>
          </motion.header>

          {/* Decorative divider */}
          <motion.div variants={fadeIn} className="flex items-center gap-4 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500/40" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>

          {/* Essay content */}
          <div className="space-y-12">
            {/* Section: The Trap */}
            <motion.section variants={fadeIn}>
              <p className="text-[17px] leading-[1.8] text-white/60 mb-6">
                There&apos;s a playbook that most software companies follow. Lock users in with annual contracts.
                Make cancellation difficult. Build features that create dependency rather than value. Charge for
                access, not usage. The assumption is that friction keeps customers.
              </p>
              <p className="text-[17px] leading-[1.8] text-white/60">
                We think this gets it backwards. Friction doesn&apos;t create loyalty—it creates resentment.
                The moment a better option appears, or the moment someone realizes they&apos;re paying for
                something they barely use, trust evaporates.
              </p>
            </motion.section>

            {/* Pull quote - attributed to Kepano */}
            <motion.blockquote
              variants={fadeIn}
              className="relative py-8 my-12"
            >
              <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-amber-500/50 via-amber-500/20 to-transparent" />
              <p
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[24px] leading-[1.5] text-white/80 pl-8 italic"
              >
                &ldquo;If you make it easy for people to leave, it forces you to improve in ways that make
                people want to stay.&rdquo;
              </p>
              <footer className="pl-8 mt-4">
                <a
                  href="https://x.com/kepano/status/1968331862021177852"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[14px] text-white/40 hover:text-amber-500/70 transition-colors"
                >
                  — Steph Ango, creator of Obsidian
                </a>
              </footer>
            </motion.blockquote>

            {/* Section: Our Approach */}
            <motion.section variants={fadeIn}>
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[22px] font-medium text-white/90 mb-6"
              >
                What we believe
              </h2>
              <p className="text-[17px] leading-[1.8] text-white/60 mb-6">
                We started with a simple question: what if we built software assuming users could leave
                at any moment? What if we had to earn every session, every return visit?
              </p>
              <p className="text-[17px] leading-[1.8] text-white/60">
                This isn&apos;t idealism—it&apos;s alignment. When your business model depends on
                customers forgetting to cancel, you&apos;re building for the wrong outcome. We&apos;d
                rather build something people actively choose to use.
              </p>
            </motion.section>

            {/* Principles */}
            <motion.section id="values" variants={fadeIn} className="py-8 scroll-mt-24">
              <div className="space-y-8">
                <Principle
                  title="Your work is yours"
                  description="Your presentations are stored as markdown. Export them anytime. Take them anywhere. We don't hold your work hostage to keep you subscribed."
                />
                <Principle
                  title="Pay for value, not access"
                  description="We don't charge you monthly for the privilege of maybe using our software. You pay when you use AI features that actually cost us money. Everything else is free."
                />
                <Principle
                  title="No dark patterns"
                  description="No countdown timers. No 'limited time offers.' No guilt-tripping cancellation flows. No emails begging you to come back. If you leave, we hope it's because you found something better."
                />
                <Principle
                  title="Simplicity is respect"
                  description="Every feature we add is a cognitive cost to you. We'd rather do fewer things well than overwhelm you with options you'll never use."
                />
              </div>
            </motion.section>

            {/* Section: The Honest Part */}
            <motion.section variants={fadeIn}>
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[22px] font-medium text-white/90 mb-6"
              >
                The honest part
              </h2>
              <p className="text-[17px] leading-[1.8] text-white/60 mb-6">
                We want to build something that works for both of us. You get a tool worth using;
                we get to keep building it. That&apos;s the whole equation.
              </p>
              <p className="text-[17px] leading-[1.8] text-white/60 mb-6">
                When you buy credits, we don&apos;t create anxiety of parked money. We discourage you
                to buy more when you already have enough. Your credits never expire. We&apos;d rather 
                you buy less and trust us more.
              </p>
              <p className="text-[17px] leading-[1.8] text-white/60">
                This is the deal: we&apos;ll be transparent about what things cost and why. We&apos;ll
                make it easy to leave. In return, we hope you stay because you want to—not because
                you have to.
              </p>
            </motion.section>

            {/* Cost transparency box */}
            <motion.div
              variants={fadeIn}
              className="p-6 rounded-xl bg-white/[0.02] border border-white/[0.06]"
            >
              <p className="text-[13px] uppercase tracking-[0.15em] text-white/30 mb-4 font-medium">
                Our actual costs (per image/deck)
              </p>
              <div className="space-y-2.5 text-[15px]">
                <CostRow label="AI model costs" value="~$0.10-0.15" />
                <CostRow label="Infrastructure" value="~$0.02" />
                <CostRow label="Risk buffer" value="~$0.03" />
                <CostRow label="Margin to keep running" value="~$0.05" />
                <div className="pt-2.5 mt-2.5 border-t border-white/[0.06]">
                  <CostRow label="What we charge" value="$0.25" highlight />
                </div>
              </div>
              <p className="mt-4 text-[14px] text-white/40">
                Per AI image or deck operation. $1 gets you 4 images.
              </p>
            </motion.div>

            {/* Section: An Invitation */}
            <motion.section variants={fadeIn}>
              <h2
                style={{ fontFamily: "'Playfair Display', Georgia, serif" }}
                className="text-[22px] font-medium text-white/90 mb-6"
              >
                An invitation
              </h2>
              <p className="text-[17px] leading-[1.8] text-white/60 mb-6">
                We&apos;re still figuring this out. If you have ideas about how we can make Riff
                cheaper, simpler, or more honest—we want to hear them.
              </p>
              <p className="text-[17px] leading-[1.8] text-white/60">
                This isn&apos;t a manifesto carved in stone. It&apos;s a conversation. And
                you&apos;re part of it.
              </p>
            </motion.section>

            {/* Contact link */}
            <motion.div variants={fadeIn} className="pt-8">
              <a
                href="mailto:hello@riff.im"
                className="inline-flex items-center gap-2 text-[15px] text-amber-500/80 hover:text-amber-400 transition-colors"
              >
                <span>Tell us what you think</span>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </motion.div>
          </div>

          {/* Footer divider */}
          <motion.div variants={fadeIn} className="flex items-center gap-4 mt-20 mb-8">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="w-1.5 h-1.5 rounded-full bg-white/10" />
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
          </motion.div>

          {/* Footer note */}
          <motion.footer variants={fadeIn} className="text-center">
            <p className="text-[13px] text-white/25">
              Last updated December 2025
            </p>
          </motion.footer>
        </motion.article>
      </main>
    </div>
  );
}

// Principle component with elegant styling
function Principle({ title, description }: { title: string; description: string }) {
  return (
    <div className="group">
      <h3 className="text-[16px] font-medium text-white/80 mb-2 flex items-center gap-3">
        <span className="w-1 h-1 rounded-full bg-amber-500/60 group-hover:bg-amber-500 transition-colors" />
        {title}
      </h3>
      <p className="text-[15px] leading-[1.75] text-white/50 pl-4">
        {description}
      </p>
    </div>
  );
}

// Cost row component
function CostRow({ label, value, highlight = false }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between items-center">
      <span className={highlight ? 'text-white/70 font-medium' : 'text-white/50'}>{label}</span>
      <span className={highlight ? 'text-amber-500 font-medium tabular-nums' : 'text-white/40 tabular-nums'}>
        {value}
      </span>
    </div>
  );
}
