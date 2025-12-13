import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Presentation on Riff';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

interface ThemeColors {
  bg: string;
  text: string;
  accent: string;
  muted: string;
  surface: string;
}

// Extract CSS variable value from theme CSS
function extractCSSVar(css: string, varName: string): string | null {
  const regex = new RegExp(`${varName}:\\s*([^;]+)`);
  const match = css.match(regex);
  if (match) {
    return match[1].trim();
  }
  return null;
}

// Parse theme CSS into color object
function parseThemeColors(css: string): ThemeColors {
  return {
    bg: extractCSSVar(css, '--slide-bg') || '#030303',
    text: extractCSSVar(css, '--slide-text') || '#fafafa',
    accent: extractCSSVar(css, '--slide-accent') || '#f59e0b',
    muted: extractCSSVar(css, '--slide-muted') || 'rgba(255,255,255,0.6)',
    surface: extractCSSVar(css, '--slide-surface') || '#1a1a1a',
  };
}

// Truncate title if too long
function truncateTitle(title: string, maxLength: number = 70): string {
  if (title.length <= maxLength) return title;
  return title.substring(0, maxLength - 1).trim() + '…';
}

// Check if a color is light (for contrast decisions)
function isLightColor(color: string): boolean {
  // Handle hex colors
  if (color.startsWith('#')) {
    const hex = color.slice(1);
    const r = parseInt(hex.slice(0, 2), 16);
    const g = parseInt(hex.slice(2, 4), 16);
    const b = parseInt(hex.slice(4, 6), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5;
  }
  // Default to dark assumption for complex colors
  return false;
}

export default async function Image({ params }: { params: { token: string } }) {
  const token = params.token;

  // Default theme colors
  let deckName = 'Untitled Presentation';
  let colors: ThemeColors = {
    bg: '#030303',
    text: '#fafafa',
    accent: '#f59e0b',
    muted: 'rgba(255,255,255,0.6)',
    surface: '#1a1a1a',
  };

  try {
    const baseUrl = process.env.NEXTAUTH_URL || 'https://www.riff.im';
    const res = await fetch(`${baseUrl}/api/shared/${token}`, {
      cache: 'no-store',
    });

    if (res.ok) {
      const data = await res.json();
      if (data.title) {
        deckName = data.title;
      }
      // Extract theme colors if available
      if (data.theme?.css) {
        colors = parseThemeColors(data.theme.css);
      }
    }
  } catch {
    // Fall back to defaults
  }

  // Load Playfair Display font
  const playfairBold = fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf'
  ).then((res) => res.arrayBuffer());

  // Calculate font size based on title length
  const titleLength = deckName.length;
  let titleFontSize = 72;
  if (titleLength > 50) titleFontSize = 48;
  else if (titleLength > 40) titleFontSize = 56;
  else if (titleLength > 30) titleFontSize = 64;

  const displayTitle = truncateTitle(deckName, 80);

  // Determine logo color based on background
  const logoColor = isLightColor(colors.bg) ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)';

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.bg,
          position: 'relative',
        }}
      >
        {/* Grid pattern overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: `linear-gradient(to right, rgba(128,128,128,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(128,128,128,0.15) 1px, transparent 1px)`,
            backgroundSize: '48px 48px',
            opacity: 0.5,
          }}
        />

        {/* Accent glow effect */}
        <div
          style={{
            position: 'absolute',
            top: '40%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: '700px',
            height: '400px',
            background: `radial-gradient(ellipse, ${colors.accent} 0%, transparent 70%)`,
            filter: 'blur(60px)',
            opacity: 0.2,
          }}
        />

        {/* Logo - top */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '20px',
            marginBottom: 48,
          }}
        >
          <svg
            width="56"
            height="56"
            viewBox="0 0 24 24"
            fill="none"
            stroke={logoColor}
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <rect x="3" y="3" width="7" height="7" rx="1" />
            <rect x="14" y="3" width="7" height="7" rx="1" />
            <rect x="3" y="14" width="7" height="7" rx="1" />
            <rect x="14" y="14" width="7" height="7" rx="1" />
          </svg>
          <span
            style={{
              fontSize: 48,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: logoColor,
              letterSpacing: '-0.02em',
            }}
          >
            Riff
          </span>
        </div>

        {/* Deck title */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            maxWidth: '1000px',
            padding: '0 80px',
          }}
        >
          <div
            style={{
              fontSize: titleFontSize,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: colors.text,
              letterSpacing: '-0.02em',
              lineHeight: 1.2,
              textAlign: 'center',
            }}
          >
            {displayTitle}
          </div>
        </div>

        {/* Accent bar at bottom */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '6px',
            background: colors.accent,
          }}
        />

        {/* Domain watermark */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 56,
            fontSize: 24,
            color: colors.muted,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          riff.im
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        {
          name: 'Playfair Display',
          data: await playfairBold,
          style: 'normal',
          weight: 700,
        },
      ],
    }
  );
}
