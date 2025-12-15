import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Philosophy - Riff',
  description:
    'Our approach to building software: no subscriptions, no dark patterns, no lock-in. We believe in earning your stay, not trapping it.',
  openGraph: {
    title: 'Worth staying for - Riff Philosophy',
    description:
      'Most software is designed to keep you. We would rather build something worth staying for. Our values on trust, transparency, and aligned incentives.',
    type: 'article',
    siteName: 'Riff',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Worth staying for - Riff Philosophy',
    description:
      'Most software is designed to keep you. We would rather build something worth staying for.',
  },
};

export default function PhilosophyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
