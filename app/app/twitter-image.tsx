import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Riff - Turn your notes to stunning decks';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Load Playfair Display font from fontsource CDN (reliable for edge runtime)
  const playfairBold = fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf'
  ).then((res) => res.arrayBuffer());

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
          backgroundColor: '#030303',
          position: 'relative',
        }}
      >
        {/* Grid pattern - matching landing hero */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'linear-gradient(to right, rgba(255,255,255,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.15) 1px, transparent 1px)',
            backgroundSize: '40px 40px',
            mask: 'linear-gradient(to bottom, black 0%, transparent 70%)',
          }}
        />

        {/* Logo - centered */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '24px',
            marginBottom: 48,
          }}
        >
          <svg
            width="80"
            height="80"
            viewBox="0 0 24 24"
            fill="none"
            stroke="rgba(255,255,255,0.7)"
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
              fontSize: 72,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
            }}
          >
            Riff
          </span>
        </div>

        {/* Hero text - centered */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              fontSize: 70,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
              lineHeight: 0.95,
            }}
          >
            Turn your notes
          </div>
          <div
            style={{
              fontSize: 70,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.25)',
              letterSpacing: '-0.02em',
              lineHeight: 0.95,
              marginTop: 8,
            }}
          >
            to a stunning deck.
          </div>
        </div>

        {/* Domain - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 64,
            fontSize: 24,
            color: '#ffffff',
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
