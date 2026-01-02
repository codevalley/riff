#!/usr/bin/env npx tsx
// ============================================
// Daily Funnel Snapshot
// Appends user funnel metrics to a CSV file for tracking over time
//
// Usage:
//   npx tsx scripts/analytics/daily-funnel.ts
//   npx tsx scripts/analytics/daily-funnel.ts --env=.env.production
// ============================================

import { config } from 'dotenv';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const envArg = process.argv.find(a => a.startsWith('--env='));
const envFile = envArg ? envArg.split('=')[1] : null;
if (envFile) {
  config({ path: envFile, override: true });
} else {
  config({ path: '.env.local' });
  config({ path: '.env' });
}

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DATA_DIR = join(process.cwd(), 'data');
const CSV_FILE = join(DATA_DIR, 'funnel-metrics.csv');

async function main() {
  const date = new Date().toISOString().split('T')[0];

  // Gather funnel metrics
  const signups = await prisma.user.count();
  const createdDeck = await prisma.user.count({ where: { decks: { some: {} } } });
  const published = await prisma.user.count({
    where: { decks: { some: { publishedAt: { not: null } } } },
  });
  const totalDecks = await prisma.deck.count();
  const publishedDecks = await prisma.deck.count({ where: { publishedAt: { not: null } } });
  const totalViews = await prisma.deck.aggregate({ _sum: { views: true } });

  // Purchasers and tippers
  const purchasers = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'purchase' },
  });
  const tippers = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'donation' },
  });

  const row = [
    date,
    signups,
    createdDeck,
    published,
    totalDecks,
    publishedDecks,
    totalViews._sum.views || 0,
    purchasers.length,
    tippers.length,
  ];

  const header = [
    'date',
    'signups',
    'created',
    'published',
    'decks',
    'live',
    'views',
    'paid',
    'tipped',
  ].join(',');

  // Idempotent: read existing, update or append today's row
  let lines: string[] = [];
  let updated = false;

  if (existsSync(CSV_FILE)) {
    const content = readFileSync(CSV_FILE, 'utf-8');
    lines = content.trim().split('\n');

    // Find and replace today's row if it exists
    lines = lines.map(line => {
      if (line.startsWith(date + ',')) {
        updated = true;
        return row.join(',');
      }
      return line;
    });
  } else {
    lines = [header];
  }

  // Append if not updated
  if (!updated) {
    lines.push(row.join(','));
  }

  writeFileSync(CSV_FILE, lines.join('\n') + '\n');

  console.log('');
  console.log(`Funnel Snapshot for ${date}`);
  console.log('─'.repeat(40));
  console.log(`Signups:              ${signups}`);
  console.log(`Created deck:         ${createdDeck} (${((createdDeck / signups) * 100).toFixed(1)}%)`);
  console.log(`Published:            ${published} (${((published / createdDeck) * 100).toFixed(1)}% of creators)`);
  console.log(`Total decks:          ${totalDecks}`);
  console.log(`Published decks:      ${publishedDecks}`);
  console.log(`Total views:          ${totalViews._sum.views || 0}`);
  console.log(`Purchasers:           ${purchasers.length}`);
  console.log(`Tippers:              ${tippers.length}`);
  console.log('');
  console.log(updated ? `Updated ${date} in ${CSV_FILE}` : `Added ${date} to ${CSV_FILE}`);
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
