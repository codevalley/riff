#!/usr/bin/env npx tsx
// ============================================
// Test Email
// Sends a specific email type to a user
//
// Usage:
//   npx tsx scripts/test-email.ts welcome your@email.com
//   npx tsx scripts/test-email.ts credit-purchase your@email.com
//   npx tsx scripts/test-email.ts tip your@email.com
//   npx tsx scripts/test-email.ts welcome your@email.com --env=.env.production
// ============================================

import { config } from 'dotenv';
// Support custom env file via CLI arg
const envArg = process.argv.find(a => a.startsWith('--env='));
const envFile = envArg ? envArg.split('=')[1] : null;
if (envFile) {
  config({ path: envFile, override: true });
} else {
  config({ path: '.env.local' });
  config({ path: '.env' });
}

import { PrismaClient } from '@prisma/client';
import { Resend } from 'resend';

const prisma = new PrismaClient();

// Lazy init Resend
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

type EmailType = 'welcome' | 'credit-purchase' | 'tip';

// ============================================
// Helpers
// ============================================

function capitalizeName(name: string): string {
  if (!name) return 'there';
  const firstName = name.split(' ')[0];
  return firstName.charAt(0).toUpperCase() + firstName.slice(1).toLowerCase();
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

// ============================================
// Email Templates
// ============================================

function getWelcomeEmailContent(userName?: string): { subject: string; html: string } {
  const name = capitalizeName(userName || '');
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

function getCreditPurchaseEmailContent(userName?: string): { subject: string; html: string } {
  const name = capitalizeName(userName || '');
  return {
    subject: 'Thanks for the support',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>Thanks for buying credits.</p>

<p>I want to keep Riff as close to free as possible — credits only exist because AI and servers cost real money. I'd rather you buy small amounts as you need them than load up a big balance.</p>

<p>You'll never see "credits running low!" warnings or any anxiety-inducing nudges from me. We stand by our core <a href="https://riff.im/philosophy">philosophy</a>.</p>

<p>If you ever think I can bring the price down further, I'm curious to hear how — just reply here.</p>

<p>And check out the <a href="https://riff.im/docs">docs</a> to make the most of Riff's capabilities.</p>

<p>Cheers,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}

function getTipEmailContent(userName?: string): { subject: string; html: string } {
  const name = capitalizeName(userName || '');
  return {
    subject: 'Thank you',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>I just saw your tip come through.</p>

<p>Honestly, the gesture means more than the money itself. Someone appreciating my work with no expectation of anything in return — that's the highest form of praise I can receive.</p>

<p>It motivates me to keep putting time into Riff and making it better.</p>

<p>Thank you for this.</p>

<p>//Nyn</p>

<p>PS: You might enjoy reading the <a href="https://riff.im/philosophy">philosophy</a> behind how Riff is built, or explore the <a href="https://riff.im/docs">docs</a> for tips on getting more from the platform.</p>
</div>
    `.trim(),
  };
}

function getEmailContent(type: EmailType, userName?: string): { subject: string; html: string } {
  switch (type) {
    case 'welcome':
      return getWelcomeEmailContent(userName);
    case 'credit-purchase':
      return getCreditPurchaseEmailContent(userName);
    case 'tip':
      return getTipEmailContent(userName);
  }
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const emailType = args[0] as EmailType;
  const targetEmail = args[1];

  if (!emailType || !targetEmail) {
    console.error('Usage: npx tsx scripts/test-email.ts <type> <email>');
    console.error('Types: welcome, credit-purchase, tip');
    process.exit(1);
  }

  if (!['welcome', 'credit-purchase', 'tip'].includes(emailType)) {
    console.error(`Invalid email type: ${emailType}`);
    console.error('Valid types: welcome, credit-purchase, tip');
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
  console.log(`📧 Email type: ${emailType}`);

  // Map email type to db type
  const dbEmailType = emailType === 'credit-purchase' ? 'creditPurchase' : emailType;

  // Check if already sent
  const existingLog = await prisma.emailLog.findUnique({
    where: { userId_emailType: { userId: user.id, emailType: dbEmailType } },
  });

  if (existingLog) {
    console.log(`⚠️  ${emailType} email already sent on ${existingLog.sentAt.toISOString()}`);
    console.log(`   To resend, delete the EmailLog entry first.`);
    process.exit(0);
  }

  console.log(`📤 Sending ${emailType} email...`);

  const { subject, html } = getEmailContent(emailType, user.name || undefined);

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
      emailType: dbEmailType,
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
