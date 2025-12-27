#!/usr/bin/env npx tsx
// ============================================
// Backfill Emails
// Sends emails to qualifying users who haven't received them
//
// Usage:
//   npx tsx scripts/backfill-emails.ts welcome
//   npx tsx scripts/backfill-emails.ts credit-purchase
//   npx tsx scripts/backfill-emails.ts tip
//   npx tsx scripts/backfill-emails.ts welcome --env=.env.production
// ============================================

import { config } from 'dotenv';
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
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

const DELAY_BETWEEN_EMAILS_MS = 1500;

type EmailType = 'welcome' | 'credit-purchase' | 'tip';

// ============================================
// Helpers
// ============================================

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
Hey ${name},<br><br>
Thanks for signing up to Riff.<br><br>
I spend a lot of time making pitches and presentations. The process was always painful — once I had my script, it still took 3-7 days to turn it into something visually engaging. So I built Riff to fix that. What started as scratching my own itch has grown into something I think others will find useful too.<br><br>
Here are some resources to get started:<br><br>
<a href="https://riff.im/demo">Onboarding Video</a> — A short walkthrough covering the basics<br>
<a href="https://riff.im/docs">Documentation</a> — Understand the markdown syntax and get more from the platform<br>
<a href="https://riff.im/philosophy">Philosophy</a> — Why Riff exists and how it's built differently<br><br>
I'm excited to hear what's working and what can be improved. Feel free to write back.<br><br>
Cheers,<br>
//Nyn
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
Hey ${name},<br><br>
Thanks for buying credits.<br><br>
I want to keep Riff as close to free as possible — credits only exist because AI and servers cost real money. I'd rather you buy small amounts as you need them than load up a big balance.<br><br>
You'll never see "credits running low!" warnings or any anxiety-inducing nudges from me. We stand by our core <a href="https://riff.im/philosophy">philosophy</a>.<br><br>
If you ever think I can bring the price down further, I'm curious to hear how — just reply here.<br><br>
And check out the <a href="https://riff.im/docs">docs</a> to make the most of Riff's capabilities.<br><br>
Cheers,<br>
//Nyn
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
Hey ${name},<br><br>
I just saw your tip come through.<br><br>
Honestly, the gesture means more than the money itself. Someone appreciating my work with no expectation of anything in return — that's the highest form of praise I can receive.<br><br>
It motivates me to keep putting time into Riff and making it better.<br><br>
Thank you for this.<br><br>
//Nyn<br><br>
PS: You might enjoy reading the <a href="https://riff.im/philosophy">philosophy</a> behind how Riff is built, or explore the <a href="https://riff.im/docs">docs</a> for tips on getting more from the platform.
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
// Find Qualifying Users
// ============================================

async function getQualifyingUsers(emailType: EmailType) {
  const dbEmailType = emailType === 'credit-purchase' ? 'creditPurchase' : emailType;

  switch (emailType) {
    case 'welcome':
      // All users with email who haven't received welcome email
      return prisma.user.findMany({
        where: {
          email: { not: null },
          emailLogs: { none: { emailType: 'welcome' } },
        },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

    case 'credit-purchase':
      // Users who have made a purchase AND haven't received creditPurchase email
      return prisma.user.findMany({
        where: {
          email: { not: null },
          transactions: { some: { type: 'purchase' } },
          emailLogs: { none: { emailType: 'creditPurchase' } },
        },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });

    case 'tip':
      // Users who have tipped AND haven't received tip email
      return prisma.user.findMany({
        where: {
          email: { not: null },
          transactions: { some: { type: 'donation' } },
          emailLogs: { none: { emailType: 'tip' } },
        },
        select: { id: true, email: true, name: true, createdAt: true },
        orderBy: { createdAt: 'asc' },
      });
  }
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const emailType = args[0] as EmailType;

  if (!emailType || !['welcome', 'credit-purchase', 'tip'].includes(emailType)) {
    console.error('Usage: npx tsx scripts/backfill-emails.ts <type>');
    console.error('Types: welcome, credit-purchase, tip');
    process.exit(1);
  }

  console.log(`🚀 Starting ${emailType} email backfill...\n`);

  if (!process.env.RESEND_API_KEY || !FROM_EMAIL) {
    console.error('❌ RESEND_API_KEY or RESEND_FROM_EMAIL not configured.');
    process.exit(1);
  }

  const dbEmailType = emailType === 'credit-purchase' ? 'creditPurchase' : emailType;
  const users = await getQualifyingUsers(emailType);

  console.log(`📧 Found ${users.length} qualifying users for ${emailType} email\n`);

  if (users.length === 0) {
    console.log('✅ All qualifying users have received this email. Nothing to do.');
    return;
  }

  console.log('Users to email:');
  users.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.name || 'no name'}) - joined ${u.createdAt.toISOString().split('T')[0]}`);
  });
  console.log('');

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of users) {
    if (!user.email) {
      skipped++;
      continue;
    }

    console.log(`📤 Sending to ${user.email}...`);

    try {
      const { subject, html } = getEmailContent(emailType, user.name || undefined);

      const { error } = await resend.emails.send({
        from: `${FROM_NAME} <${FROM_EMAIL}>`,
        to: user.email,
        ...(BCC_EMAIL && { bcc: BCC_EMAIL }),
        ...(REPLY_TO && { replyTo: REPLY_TO }),
        subject,
        html,
        text: stripHtml(html),
      });

      if (error) {
        console.log(`   ❌ Failed: ${error.message}`);
        failed++;
      } else {
        await prisma.emailLog.create({
          data: { userId: user.id, emailType: dbEmailType },
        });
        console.log(`   ✅ Sent and logged`);
        sent++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
      failed++;
    }

    if (users.indexOf(user) < users.length - 1) {
      await sleep(DELAY_BETWEEN_EMAILS_MS);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   ⏭️  Skipped: ${skipped}`);
  console.log('\n✨ Backfill complete!');
}

main()
  .catch((e) => {
    console.error('Fatal error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
