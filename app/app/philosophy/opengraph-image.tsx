import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export const alt = 'Riff Philosophy - Worth staying for';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  // Load Playfair Display font
  const playfairBold = fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-700-normal.ttf'
  ).then((res) => res.arrayBuffer());

  const playfairRegular = fetch(
    'https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/latin-400-normal.ttf'
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
        {/* Dot pattern */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)',
            backgroundSize: '32px 32px',
          }}
        />

        {/* Top amber glow */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '400px',
            background: 'radial-gradient(ellipse 60% 50% at 50% 0%, rgba(251, 191, 36, 0.08), transparent)',
          }}
        />

        {/* Side vignette */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'radial-gradient(ellipse 100% 100% at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
          }}
        />

        {/* Content */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            textAlign: 'center',
            padding: '0 80px',
          }}
        >
          {/* Label */}
          <div
            style={{
              fontSize: 18,
              fontFamily: 'system-ui, sans-serif',
              fontWeight: 500,
              color: 'rgba(251, 191, 36, 0.8)',
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              marginBottom: 32,
            }}
          >
            Our Philosophy
          </div>

          {/* Main headline */}
          <div
            style={{
              fontSize: 84,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: '#fafafa',
              letterSpacing: '-0.02em',
              lineHeight: 1,
              marginBottom: 32,
            }}
          >
            Worth staying for
          </div>

          {/* Subtitle */}
          <div
            style={{
              fontSize: 28,
              fontFamily: 'Playfair Display',
              fontWeight: 400,
              color: 'rgba(255,255,255,0.45)',
              letterSpacing: '-0.01em',
              lineHeight: 1.4,
              maxWidth: '800px',
            }}
          >
            Most software is designed to keep you.
            <br />
            We&apos;d rather build something worth staying for.
          </div>
        </div>

        {/* Logo - bottom left */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            left: 64,
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
          }}
        >
          <svg
            width="36"
            height="36"
            viewBox="0 0 512 512"
            fill="none"
          >
            {/* Back page */}
            <path
              d="M451.755 105.052L415.896 377.78C413.449 396.325 396.381 409.253 377.968 406.806L358.815 404.244L323.072 132.731C320.018 109.916 300.503 92.717 277.455 92.717C275.5 92.717 273.43 92.8328 271.476 93.0789L196.951 102.836L200.975 71.9718C203.422 53.4271 220.374 40.3837 238.903 42.8156L422.597 67.0932C441.141 69.5542 454.199 86.5066 451.753 105.051L451.755 105.052Z"
              fill="rgba(255, 255, 255, 0.35)"
            />
            {/* Front page */}
            <path
              d="M346.87 407.08L310.982 134.352C308.55 115.836 291.554 102.793 273.039 105.225L89.3715 129.386C70.8557 131.819 57.8122 148.814 60.2441 167.329L96.132 440.057C98.5641 458.573 115.56 471.616 134.075 469.184L317.743 445.023C336.258 442.591 349.302 425.595 346.87 407.08Z"
              fill="rgba(255, 255, 255, 0.7)"
            />
          </svg>
          <span
            style={{
              fontSize: 28,
              fontFamily: 'Playfair Display',
              fontWeight: 700,
              color: 'rgba(255,255,255,0.7)',
              letterSpacing: '-0.02em',
            }}
          >
            Riff
          </span>
        </div>

        {/* Domain - bottom right */}
        <div
          style={{
            position: 'absolute',
            bottom: 48,
            right: 64,
            fontSize: 20,
            color: 'rgba(255,255,255,0.4)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          riff.im/philosophy
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
        {
          name: 'Playfair Display',
          data: await playfairRegular,
          style: 'normal',
          weight: 400,
        },
      ],
    }
  );
}
