// ============================================
// RIFF - Email Service (Resend)
// Sends automated yet human-looking emails
// See docs/customer-communication.md for philosophy
// See docs/email-templates.md for template content
// ============================================

import { Resend } from 'resend';
import { prisma } from './prisma';

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

// Email configuration (all from env - no hardcoded emails)
const FROM_EMAIL = process.env.RESEND_FROM_EMAIL;
const FROM_NAME = process.env.RESEND_FROM_NAME || 'Riff';
const REPLY_TO = process.env.RESEND_REPLY_TO;
const BCC_EMAIL = process.env.RESEND_BCC_EMAIL;

// Email types (must match EmailLog.emailType)
export type EmailType = 'welcome' | 'firstDeck' | 'firstPublish' | 'creditPurchase' | 'tip';

interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

// ============================================
// Core Email Functions
// ============================================

/**
 * Send an email via Resend (low-level)
 */
async function sendEmailRaw({ to, subject, html, text }: SendEmailOptions) {
  if (!process.env.RESEND_API_KEY || !FROM_EMAIL) {
    console.warn('[Email] RESEND_API_KEY or RESEND_FROM_EMAIL not configured, skipping email');
    return { success: false, error: 'Email not configured' };
  }

  try {
    const { data, error } = await resend.emails.send({
      from: `${FROM_NAME} <${FROM_EMAIL}>`,
      to,
      ...(BCC_EMAIL && { bcc: BCC_EMAIL }),
      ...(REPLY_TO && { replyTo: REPLY_TO }),
      subject,
      html,
      text: text || stripHtml(html),
    });

    if (error) {
      console.error('[Email] Failed to send:', error);
      return { success: false, error: error.message };
    }

    console.log('[Email] Sent successfully:', data?.id);
    return { success: true, id: data?.id };
  } catch (err) {
    console.error('[Email] Error:', err);
    return { success: false, error: String(err) };
  }
}

/**
 * Check if email was already sent to user
 */
async function wasEmailSent(userId: string, emailType: EmailType): Promise<boolean> {
  const existing = await prisma.emailLog.findUnique({
    where: { userId_emailType: { userId, emailType } },
  });
  return !!existing;
}

/**
 * Log that an email was sent
 */
async function logEmailSent(userId: string, emailType: EmailType, metadata?: object) {
  await prisma.emailLog.create({
    data: {
      userId,
      emailType,
      metadata: metadata ? JSON.parse(JSON.stringify(metadata)) : undefined,
    },
  });
}

/**
 * Strip HTML tags for plain text fallback
 */
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

// ============================================
// High-Level Email Senders (with duplicate check)
// ============================================

/**
 * Send welcome email to a user (checks for duplicates)
 */
export async function sendWelcomeEmail(userId: string): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  // Check if already sent
  if (await wasEmailSent(userId, 'welcome')) {
    console.log(`[Email] Welcome email already sent to user ${userId}, skipping`);
    return { success: true, skipped: true };
  }

  // Get user info
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return { success: false, error: 'User not found or no email' };
  }

  // Send email
  const { subject, html } = getWelcomeEmailContent(user.name || undefined);
  const result = await sendEmailRaw({ to: user.email, subject, html });

  // Log if successful
  if (result.success) {
    await logEmailSent(userId, 'welcome');
  }

  return result;
}

/**
 * Send first deck email to a user (checks for duplicates)
 */
export async function sendFirstDeckEmail(userId: string, deckName?: string): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (await wasEmailSent(userId, 'firstDeck')) {
    return { success: true, skipped: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return { success: false, error: 'User not found or no email' };
  }

  const { subject, html } = getFirstDeckEmailContent(user.name || undefined, deckName);
  const result = await sendEmailRaw({ to: user.email, subject, html });

  if (result.success) {
    await logEmailSent(userId, 'firstDeck', { deckName });
  }

  return result;
}

/**
 * Send first publish email to a user (checks for duplicates)
 */
export async function sendFirstPublishEmail(userId: string, shareUrl?: string): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (await wasEmailSent(userId, 'firstPublish')) {
    return { success: true, skipped: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return { success: false, error: 'User not found or no email' };
  }

  const { subject, html } = getFirstPublishEmailContent(user.name || undefined, shareUrl);
  const result = await sendEmailRaw({ to: user.email, subject, html });

  if (result.success) {
    await logEmailSent(userId, 'firstPublish', { shareUrl });
  }

  return result;
}

/**
 * Send credit purchase thank you email (checks for duplicates)
 */
export async function sendCreditPurchaseEmail(userId: string, credits: number): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (await wasEmailSent(userId, 'creditPurchase')) {
    return { success: true, skipped: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return { success: false, error: 'User not found or no email' };
  }

  const { subject, html } = getCreditPurchaseEmailContent(user.name || undefined, credits);
  const result = await sendEmailRaw({ to: user.email, subject, html });

  if (result.success) {
    await logEmailSent(userId, 'creditPurchase', { credits });
  }

  return result;
}

/**
 * Send tip/coffee thank you email (checks for duplicates)
 */
export async function sendTipEmail(userId: string): Promise<{ success: boolean; skipped?: boolean; error?: string }> {
  if (await wasEmailSent(userId, 'tip')) {
    return { success: true, skipped: true };
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true },
  });

  if (!user?.email) {
    return { success: false, error: 'User not found or no email' };
  }

  const { subject, html } = getTipEmailContent(user.name || undefined);
  const result = await sendEmailRaw({ to: user.email, subject, html });

  if (result.success) {
    await logEmailSent(userId, 'tip');
  }

  return result;
}

// ============================================
// Email Templates
// Human-looking, personal emails
// ============================================

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

function getFirstDeckEmailContent(userName?: string, deckName?: string): { subject: string; html: string } {
  const name = userName?.split(' ')[0] || 'there';

  return {
    subject: 'Your first deck is ready',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>Nice — you just created your first deck${deckName ? `: "${deckName}"` : ''}!</p>

<p>A few things you might want to try:</p>

<p>
<b>Generate a theme</b> — Click the palette icon and describe the vibe you want<br/>
<b>Add images</b> — Use the wand icon on any slide to generate visuals<br/>
<b>Present or publish</b> — Share with a link or present directly from Riff
</p>

<p>If anything feels confusing or broken, just reply to this email. I read everything.</p>

<p>Cheers,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}

function getFirstPublishEmailContent(userName?: string, shareUrl?: string): { subject: string; html: string } {
  const name = userName?.split(' ')[0] || 'there';

  return {
    subject: 'Your deck is live',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>Congrats — you just published your first deck! It's now live and anyone with the link can view it.</p>

${shareUrl ? `<p><a href="${shareUrl}">View your published deck →</a></p>` : ''}

<p>A few things to know:</p>

<p>
You can update and re-publish anytime — the link stays the same<br/>
View count is tracked on your dashboard<br/>
You can unpublish anytime if you change your mind
</p>

<p>Would love to see what you've created. Feel free to share the link!</p>

<p>Cheers,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}

function getCreditPurchaseEmailContent(userName?: string, credits?: number): { subject: string; html: string } {
  const name = userName?.split(' ')[0] || 'there';

  return {
    subject: 'Thanks for the support',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>Just wanted to say thanks for buying credits. It means a lot.</p>

<p>Riff doesn't have investors or a growth team — it's just me trying to build something useful. Every purchase helps keep this going and motivates me to make it better.</p>

<p>Your ${credits ?? ''} credits are ready to use. If you ever run into issues or have ideas for improvements, just reply here.</p>

<p>Cheers,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}

function getTipEmailContent(userName?: string): { subject: string; html: string } {
  const name = userName?.split(' ')[0] || 'there';

  return {
    subject: 'Thank you',
    html: `
<div style="color: #222; line-height: 1.6;">
<p>Hey ${name},</p>

<p>I just saw your tip come through. Honestly, this made my day.</p>

<p>Building Riff has been a labor of love, and knowing someone values it enough to send a tip is incredibly motivating. Thank you for being part of this.</p>

<p>If there's ever anything I can help with, just reply to this email.</p>

<p>With gratitude,<br/>
//Nyn</p>
</div>
    `.trim(),
  };
}
