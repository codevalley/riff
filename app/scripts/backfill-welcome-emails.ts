#!/usr/bin/env npx tsx
// ============================================
// Backfill Welcome Emails
// Sends welcome emails to all existing users who haven't received one
//
// Usage: npx tsx scripts/backfill-welcome-emails.ts
//
// Safe to run multiple times - checks EmailLog before sending
// ============================================

import { config } from 'dotenv';
// Support custom env file via CLI arg: npx tsx script.ts --env=.env.production
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

// Initialize Resend
const resend = new Resend(process.env.RESEND_API_KEY);
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

// Rate limiting: Resend free tier is 100 emails/day, 1 email/second
const DELAY_BETWEEN_EMAILS_MS = 1500; // 1.5 seconds to be safe

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

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
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&rarr;/g, '→')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function main() {
  console.log('🚀 Starting welcome email backfill...\n');

  // Check if Resend is configured
  if (!process.env.RESEND_API_KEY || !FROM_EMAIL) {
    console.error('❌ RESEND_API_KEY or RESEND_FROM_EMAIL not configured.');
    process.exit(1);
  }

  // Get all users who haven't received a welcome email
  const usersWithoutWelcome = await prisma.user.findMany({
    where: {
      email: { not: null },
      emailLogs: {
        none: {
          emailType: 'welcome',
        },
      },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: {
      createdAt: 'asc', // Oldest first
    },
  });

  console.log(`📧 Found ${usersWithoutWelcome.length} users without welcome email\n`);

  if (usersWithoutWelcome.length === 0) {
    console.log('✅ All users have received welcome emails. Nothing to do.');
    return;
  }

  // Confirm before sending
  console.log('Users to email:');
  usersWithoutWelcome.forEach((u, i) => {
    console.log(`  ${i + 1}. ${u.email} (${u.name || 'no name'}) - joined ${u.createdAt.toISOString().split('T')[0]}`);
  });
  console.log('');

  // In non-interactive mode, we'll proceed
  // In interactive mode, you could add a readline prompt here

  let sent = 0;
  let failed = 0;
  let skipped = 0;

  for (const user of usersWithoutWelcome) {
    if (!user.email) {
      skipped++;
      continue;
    }

    console.log(`📤 Sending to ${user.email}...`);

    try {
      const { subject, html } = getWelcomeEmailContent(user.name || undefined);

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
        // Log the email as sent
        await prisma.emailLog.create({
          data: {
            userId: user.id,
            emailType: 'welcome',
          },
        });
        console.log(`   ✅ Sent and logged`);
        sent++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
      failed++;
    }

    // Rate limit
    if (usersWithoutWelcome.indexOf(user) < usersWithoutWelcome.length - 1) {
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
