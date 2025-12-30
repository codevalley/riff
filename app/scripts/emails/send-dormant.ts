#!/usr/bin/env npx tsx
// ============================================
// Send Dormant User Emails
// Re-engages users who signed up but never created a deck
//
// Usage:
//   npx tsx scripts/emails/send-dormant.ts --dry-run
//   npx tsx scripts/emails/send-dormant.ts
//   npx tsx scripts/emails/send-dormant.ts --env=.env.production
//   npx tsx scripts/emails/send-dormant.ts --env=.env.production --dry-run
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
import { getDormantEmailContent, stripHtml } from '../../lib/email';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

const DELAY_BETWEEN_EMAILS_MS = 1500;
const isDryRun = process.argv.includes('--dry-run');

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function main() {
  console.log('📧 Dormant User Re-engagement Emails\n');

  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent\n');
  }

  if (!isDryRun && (!process.env.RESEND_API_KEY || !FROM_EMAIL)) {
    console.error('❌ RESEND_API_KEY or RESEND_FROM_EMAIL not configured.');
    process.exit(1);
  }

  // Find dormant users: signed up, have email, no decks, haven't received dormant email
  const dormantUsers = await prisma.user.findMany({
    where: {
      email: { not: null },
      decks: { none: {} },
      emailLogs: { none: { emailType: 'dormant' } },
    },
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'asc' },
  });

  console.log(`Found ${dormantUsers.length} dormant users (signed up, no decks)\n`);

  if (dormantUsers.length === 0) {
    console.log('✅ No dormant users to email.');
    return;
  }

  console.log('Users to email:');
  dormantUsers.forEach((u, i) => {
    const daysSinceSignup = Math.floor((Date.now() - u.createdAt.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`  ${i + 1}. ${u.email} (${u.name || 'no name'}) - signed up ${daysSinceSignup} days ago`);
  });
  console.log('');

  if (isDryRun) {
    console.log('🔍 DRY RUN - Would send to the above users.');
    console.log('\nTo actually send, run without --dry-run flag.');
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const user of dormantUsers) {
    if (!user.email) continue;

    console.log(`📤 Sending to ${user.email}...`);

    try {
      const { subject, html } = getDormantEmailContent(user.name || undefined);

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
          data: { userId: user.id, emailType: 'dormant' },
        });
        console.log(`   ✅ Sent and logged`);
        sent++;
      }
    } catch (err) {
      console.log(`   ❌ Error: ${err}`);
      failed++;
    }

    if (dormantUsers.indexOf(user) < dormantUsers.length - 1) {
      await sleep(DELAY_BETWEEN_EMAILS_MS);
    }
  }

  console.log('\n📊 Summary:');
  console.log(`   ✅ Sent: ${sent}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log('\n✨ Done!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
