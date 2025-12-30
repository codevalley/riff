#!/usr/bin/env npx tsx
// ============================================
// Backfill Emails
// Sends emails to qualifying users who haven't received them
//
// Usage:
//   npx tsx scripts/emails/backfill.ts welcome
//   npx tsx scripts/emails/backfill.ts credit-purchase
//   npx tsx scripts/emails/backfill.ts tip
//   npx tsx scripts/emails/backfill.ts welcome --env=.env.production
//   npx tsx scripts/emails/backfill.ts welcome --env=.env.production --dry-run
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
import {
  getWelcomeEmailContent,
  getCreditPurchaseEmailContent,
  getTipEmailContent,
  stripHtml,
} from '../../lib/email';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

const DELAY_BETWEEN_EMAILS_MS = 1500;
const isDryRun = process.argv.includes('--dry-run');

type EmailType = 'welcome' | 'credit-purchase' | 'tip';

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
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

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const emailType = args[0] as EmailType;

  if (!emailType || !['welcome', 'credit-purchase', 'tip'].includes(emailType)) {
    console.error('Usage: npx tsx scripts/emails/backfill.ts <type> [--dry-run]');
    console.error('Types: welcome, credit-purchase, tip');
    process.exit(1);
  }

  console.log(`🚀 Starting ${emailType} email backfill...`);
  if (isDryRun) {
    console.log('🔍 DRY RUN MODE - No emails will be sent\n');
  } else {
    console.log('');
  }

  if (!isDryRun && (!process.env.RESEND_API_KEY || !FROM_EMAIL)) {
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

  if (isDryRun) {
    console.log('🔍 DRY RUN - Would send to the above users.');
    console.log('\nTo actually send, run without --dry-run flag.');
    return;
  }

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
