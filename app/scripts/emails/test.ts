#!/usr/bin/env npx tsx
// ============================================
// Test Email
// Sends a specific email type to a user for testing
//
// Usage:
//   npx tsx scripts/emails/test.ts welcome your@email.com
//   npx tsx scripts/emails/test.ts credit-purchase your@email.com
//   npx tsx scripts/emails/test.ts tip your@email.com
//   npx tsx scripts/emails/test.ts dormant your@email.com
//   npx tsx scripts/emails/test.ts welcome your@email.com --env=.env.production
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
  getDormantEmailContent,
  stripHtml,
} from '../../lib/email';

const prisma = new PrismaClient();
const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

type EmailType = 'welcome' | 'credit-purchase' | 'tip' | 'dormant';

function getEmailContent(type: EmailType, userName?: string): { subject: string; html: string } {
  switch (type) {
    case 'welcome':
      return getWelcomeEmailContent(userName);
    case 'credit-purchase':
      return getCreditPurchaseEmailContent(userName);
    case 'tip':
      return getTipEmailContent(userName);
    case 'dormant':
      return getDormantEmailContent(userName);
  }
}

async function main() {
  const args = process.argv.slice(2).filter(a => !a.startsWith('--'));
  const emailType = args[0] as EmailType;
  const targetEmail = args[1];

  if (!emailType || !targetEmail) {
    console.error('Usage: npx tsx scripts/emails/test.ts <type> <email>');
    console.error('Types: welcome, credit-purchase, tip, dormant');
    process.exit(1);
  }

  if (!['welcome', 'credit-purchase', 'tip', 'dormant'].includes(emailType)) {
    console.error(`Invalid email type: ${emailType}`);
    console.error('Valid types: welcome, credit-purchase, tip, dormant');
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

  const { data, error } = await resend.emails.send({
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
