/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    screens: {
      // Standard breakpoints
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
      // Mobile-first slide breakpoints (for portrait phones)
      'slide-sm': { 'raw': '(min-height: 600px) and (orientation: portrait)' },
      'slide-md': { 'raw': '(min-height: 800px) and (orientation: portrait)' },
      // Landscape mode (tablets, desktops)
      'landscape': { 'raw': '(orientation: landscape)' },
      // Portrait mode (phones, portrait tablets)
      'portrait': { 'raw': '(orientation: portrait)' },
      // Specific: small mobile in portrait
      'mobile-portrait': { 'raw': '(max-width: 480px) and (orientation: portrait)' },
      // Tablet portrait
      'tablet-portrait': { 'raw': '(min-width: 481px) and (max-width: 1024px) and (orientation: portrait)' },
    },
    extend: {
      colors: {
        // Core palette
        background: 'var(--background)',
        'background-secondary': 'var(--background-secondary)',
        surface: 'var(--surface)',
        'surface-hover': 'var(--surface-hover)',

        // Borders
        border: 'var(--border)',
        'border-hover': 'var(--border-hover)',
        'border-focus': 'var(--border-focus)',

        // Text
        'text-primary': 'var(--text-primary)',
        'text-secondary': 'var(--text-secondary)',
        'text-tertiary': 'var(--text-tertiary)',
        'text-quaternary': 'var(--text-quaternary)',

        // Functional
        success: 'var(--success)',
        error: 'var(--error)',
        warning: 'var(--warning)',

        // Slide colors (for presentations)
        slide: {
          bg: 'var(--slide-bg)',
          text: 'var(--slide-text)',
          accent: 'var(--slide-accent)',
          muted: 'var(--slide-muted)',
          surface: 'var(--slide-surface)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)'],
        mono: ['var(--font-mono)'],
        display: ['var(--font-display)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
        body: ['var(--font-body)', 'var(--font-sans)', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
      },
      transitionDuration: {
        fast: '150ms',
        base: '200ms',
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out forwards',
        'slide-up': 'slideUp 0.4s ease-out forwards',
        shimmer: 'shimmer 1.5s infinite',
        grid: 'grid 15s linear infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        grid: {
          '0%': { transform: 'translateY(-50%)' },
          '100%': { transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
