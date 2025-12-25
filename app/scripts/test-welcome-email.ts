#!/usr/bin/env npx tsx
// ============================================
// Test Welcome Email
// Sends welcome email to a single user by email address
//
// Usage: npx tsx scripts/test-welcome-email.ts your@email.com
// ============================================

import { config } from 'dotenv';
// Support custom env file via CLI arg: npx tsx script.ts your@email.com --env=.env.production
const envArg = process.argv.find(a => a.startsWith('--env='));
const envFile = envArg ? envArg.split('=')[1] : null;
if (envFile) {
  config({ path: envFile, override: true }); // override existing env vars
} else {
  config({ path: '.env.local' });
  config({ path: '.env' });
}

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();

// Lazy init - env vars loaded by now
let resend: Resend;
function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY);
  }
  return resend;
}

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

function getWelcomeEmailContent(userName?: string): { subject: string; html: string } {
  const name = userName?.split(' ')[0] || 'there';

  return {
    subject: 'Welcome to Riff',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>Thanks for signing up to Riff.</p>

<p>I spend a lot of time making pitches and presentations. The process was always painful — once I had my script, it still took 3-7 days to turn it into something visually engaging. So I built Riff to fix that. What started as scratching my own itch has grown into something I think others will find useful too.</p>

<p>Here are some resources to get started:</p>

<p>
<a href="https://riff.im/demo">Onboarding Video</a> — A short walkthrough covering the basics<br/>
<a href="https://riff.im/docs">Documentation</a> — Understand the markdown syntax and get more from the platform<br/>
<a href="https://riff.im/philosophy">Philosophy</a> — Why Riff exists and how it's built differently
</p>

<p>I'm excited to hear what's working and what can be improved. Feel free to write back.</p>

<p>Cheers,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}

function stripHtml(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '- ')
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&rarr;/g, '→')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  // Get email arg (skip --env= args)
  const targetEmail = process.argv.slice(2).find(a => !a.startsWith('--'));

  if (!targetEmail) {
    console.error('Usage: npx tsx scripts/test-welcome-email.ts your@email.com');
    process.exit(1);
  }

  if (!process.env.RESEND_API_KEY || !FROM_EMAIL) {
    console.error('❌ RESEND_API_KEY or RESEND_FROM_EMAIL not configured');
    process.exit(1);
  }

  console.log(`🔍 Looking up user: ${targetEmail}`);

  const user = await prisma.user.findUnique({
    where: { email: targetEmail },
    select: { id: true, email: true, name: true },
  });

  if (!user) {
    console.error(`❌ User not found: ${targetEmail}`);
    process.exit(1);
  }

  console.log(`✅ Found user: ${user.name || 'no name'} (${user.id})`);

  // Check if already sent
  const existingLog = await prisma.emailLog.findUnique({
    where: { userId_emailType: { userId: user.id, emailType: 'welcome' } },
  });

  if (existingLog) {
    console.log(`⚠️  Welcome email already sent on ${existingLog.sentAt.toISOString()}`);
    console.log(`   To resend, delete the EmailLog entry first.`);
    process.exit(0);
  }

  console.log(`📤 Sending welcome email...`);

  const { subject, html } = getWelcomeEmailContent(user.name || undefined);

  const { data, error } = await getResend().emails.send({
    from: `${FROM_NAME} <${FROM_EMAIL}>`,
    to: user.email!,
    ...(BCC_EMAIL && { bcc: BCC_EMAIL }),
    ...(REPLY_TO && { replyTo: REPLY_TO }),
    subject,
    html,
    text: stripHtml(html),
  });

  if (error) {
    console.error(`❌ Failed to send: ${error.message}`);
    process.exit(1);
  }

  console.log(`✅ Email sent! ID: ${data?.id}`);

  // Log it
  await prisma.emailLog.create({
    data: {
      userId: user.id,
      emailType: 'welcome',
    },
  });

  console.log(`📝 Logged to EmailLog (won't send again)`);
  console.log(`\n✨ Test complete! Check your inbox.`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
