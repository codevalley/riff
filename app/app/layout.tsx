import type { Metadata } from 'next';
import { Analytics } from '@vercel/analytics/next';
import './globals.css';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { CreditsProvider } from '@/hooks/useCredits';
import { OnboardingProvider } from '@/hooks/useOnboarding';

export const metadata: Metadata = {
  title: {
    default: 'Riff - Turn your notes to stunning decks',
    template: '%s | Riff',
  },
  description: 'AI-powered presentation editor. Turn documents, notes, and ideas into polished presentations with prompt-driven theming and auto-generated images.',
  keywords: ['presentation', 'slides', 'markdown', 'AI', 'deck', 'editor'],
  authors: [{ name: 'Riff' }],
  metadataBase: new URL('https://www.riff.im'),
  openGraph: {
    title: 'Riff - Turn your notes to stunning decks',
    description: 'AI-powered presentation editor. Turn documents, notes, and ideas into polished presentations.',
    url: 'https://www.riff.im',
    siteName: 'Riff',
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Riff - Turn your notes to stunning decks',
    description: 'AI-powered presentation editor. Turn documents, notes, and ideas into polished presentations.',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        {/* Preload fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;600&family=Outfit:wght@400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <AuthProvider>
          <CreditsProvider>
            <OnboardingProvider>{children}</OnboardingProvider>
          </CreditsProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
