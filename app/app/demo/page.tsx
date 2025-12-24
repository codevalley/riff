// ============================================
// RIFF - Demo Video Redirect
// Redirects to Loom video
// ============================================

import { redirect } from 'next/navigation';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Demo - Riff',
  description: 'Watch a demo of Riff - the markdown presentation tool',
};

export default function DemoPage() {
  redirect('https://www.loom.com/share/46fdab1604f24901ac1e99b78ba2de6a');
}
