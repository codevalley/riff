'use client';

// ============================================
// VIBE SLIDES - Slide Background Effects
// ============================================

import { BackgroundEffect, BackgroundColor, BackgroundPosition } from '@/lib/types';
import { RetroGrid } from './ui/retro-grid';

interface SlideBackgroundProps {
  effect: BackgroundEffect;
}

// Color palette - maps color names to CSS values
const COLOR_MAP: Record<BackgroundColor, { primary: string; faded: string }> = {
  amber: { primary: '#f59e0b', faded: 'rgba(245, 158, 11, 0.25)' },
  blue: { primary: '#3b82f6', faded: 'rgba(59, 130, 246, 0.25)' },
  purple: { primary: '#a855f7', faded: 'rgba(168, 85, 247, 0.25)' },
  rose: { primary: '#f43f5e', faded: 'rgba(244, 63, 94, 0.25)' },
  emerald: { primary: '#10b981', faded: 'rgba(16, 185, 129, 0.25)' },
  cyan: { primary: '#06b6d4', faded: 'rgba(6, 182, 212, 0.25)' },
  orange: { primary: '#f97316', faded: 'rgba(249, 115, 22, 0.25)' },
  pink: { primary: '#ec4899', faded: 'rgba(236, 72, 153, 0.25)' },
  accent: { primary: 'var(--slide-accent)', faded: 'rgba(255, 255, 255, 0.2)' },
};

// Position to ellipse for GLOW effect (larger, softer)
const GLOW_ELLIPSE: Record<BackgroundPosition, string> = {
  'top-left': '80% 80% at 0% 0%',
  'top-right': '80% 80% at 100% 0%',
  'bottom-left': '80% 80% at 0% 100%',
  'bottom-right': '80% 80% at 100% 100%',
  'center': '70% 70% at 50% 50%',
};

// Position to mask for GRID effect - tighter masks (less grid, more emptiness)
const GRID_MASK: Record<BackgroundPosition, string> = {
  'top-left': 'ellipse 50% 50% at 0% 0%',
  'top-right': 'ellipse 50% 50% at 100% 0%',
  'bottom-left': 'ellipse 50% 50% at 0% 100%',
  'bottom-right': 'ellipse 50% 50% at 100% 100%',
  'center': 'ellipse 45% 45% at 50% 50%',
};

// Position to mask for HATCH effect - tighter
const HATCH_MASK: Record<BackgroundPosition, string> = {
  'top-left': 'ellipse 45% 45% at 0% 0%',
  'top-right': 'ellipse 45% 45% at 100% 0%',
  'bottom-left': 'ellipse 45% 45% at 0% 100%',
  'bottom-right': 'ellipse 45% 45% at 100% 100%',
  'center': 'ellipse 40% 40% at 50% 50%',
};

// Position to mask for DASHED effect - tighter
const DASHED_MASK: Record<BackgroundPosition, string> = {
  'top-left': 'ellipse 55% 55% at 0% 0%',
  'top-right': 'ellipse 55% 55% at 100% 0%',
  'bottom-left': 'ellipse 55% 55% at 0% 100%',
  'bottom-right': 'ellipse 55% 55% at 100% 100%',
  'center': 'ellipse 50% 50% at 50% 50%',
};

export function SlideBackground({ effect }: SlideBackgroundProps) {
  const { type, position, color = 'accent' } = effect;
  const colors = COLOR_MAP[color] || COLOR_MAP.accent;

  switch (type) {
    case 'glow':
      return <GlowBackground position={position} colors={colors} />;
    case 'grid':
      return <GridBackground position={position} colors={colors} />;
    case 'hatch':
      return <HatchBackground position={position} colors={colors} />;
    case 'dashed':
      return <DashedBackground position={position} colors={colors} />;
    case 'retrogrid':
      return <RetroGrid angle={65} />;
    default:
      return null;
  }
}

// ============================================
// GLOW EFFECT - Radial gradient glow
// ============================================

function GlowBackground({
  position,
  colors,
}: {
  position: BackgroundPosition;
  colors: { primary: string; faded: string };
}) {
  const gradientPos = GLOW_ELLIPSE[position] || GLOW_ELLIPSE['bottom-right'];
  const bgImage = 'radial-gradient(' + gradientPos + ', transparent 40%, ' + colors.faded + ' 100%)';

  return (
    <div
      className="absolute inset-0 z-0 pointer-events-none"
      style={{
        backgroundImage: bgImage,
        backgroundSize: '100% 100%',
      }}
    />
  );
}

// ============================================
// GRID EFFECT - Orthogonal grid with fade
// ============================================

function GridBackground({
  position,
  colors,
}: {
  position: BackgroundPosition;
  colors: { primary: string; faded: string };
}) {
  const c = colors.primary || 'rgba(255, 255, 255, 0.3)';
  const mask = GRID_MASK[position] || GRID_MASK['bottom-right'];

  const bgImage = 'linear-gradient(to right, ' + c + ' 1px, transparent 1px), linear-gradient(to bottom, ' + c + ' 1px, transparent 1px)';
  const maskImage = 'radial-gradient(' + mask + ', #000 40%, transparent 100%)';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: bgImage,
        backgroundSize: '32px 32px',
        opacity: 0.18,
        WebkitMaskImage: maskImage,
        maskImage: maskImage,
      }}
    />
  );
}

// ============================================
// HATCH EFFECT - Diagonal cross pattern
// ============================================

function HatchBackground({
  position,
  colors,
}: {
  position: BackgroundPosition;
  colors: { primary: string; faded: string };
}) {
  const c = colors.primary || 'rgba(255, 255, 255, 0.3)';
  const mask = HATCH_MASK[position] || HATCH_MASK['top-left'];

  const bgImage = 'linear-gradient(45deg, transparent 49%, ' + c + ' 49%, ' + c + ' 51%, transparent 51%), linear-gradient(-45deg, transparent 49%, ' + c + ' 49%, ' + c + ' 51%, transparent 51%)';
  const maskImage = 'radial-gradient(' + mask + ', #000 50%, transparent 100%)';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: bgImage,
        backgroundSize: '40px 40px',
        opacity: 0.18,
        WebkitMaskImage: maskImage,
        maskImage: maskImage,
      }}
    />
  );
}

// ============================================
// DASHED EFFECT - Dashed grid pattern
// ============================================

function DashedBackground({
  position,
  colors,
}: {
  position: BackgroundPosition;
  colors: { primary: string; faded: string };
}) {
  const c = colors.primary || 'rgba(255, 255, 255, 0.3)';
  const mask = DASHED_MASK[position] || DASHED_MASK['bottom-right'];

  const bgImage = 'linear-gradient(to right, ' + c + ' 1px, transparent 1px), linear-gradient(to bottom, ' + c + ' 1px, transparent 1px)';
  const dashMask = 'repeating-linear-gradient(to right, black 0px, black 3px, transparent 3px, transparent 8px), repeating-linear-gradient(to bottom, black 0px, black 3px, transparent 3px, transparent 8px), radial-gradient(' + mask + ', #000 40%, transparent 100%)';

  return (
    <div
      className="absolute inset-0 pointer-events-none"
      style={{
        backgroundImage: bgImage,
        backgroundSize: '20px 20px',
        opacity: 0.18,
        WebkitMaskImage: dashMask,
        maskImage: dashMask,
        WebkitMaskComposite: 'source-in',
        maskComposite: 'intersect',
      } as React.CSSProperties}
    />
  );
}
