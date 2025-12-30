#!/usr/bin/env npx tsx
// ============================================
// User Analytics Script
// Pulls user performance metrics from the database
//
// Usage:
//   npx tsx scripts/user-analytics.ts
//   npx tsx scripts/user-analytics.ts --env=.env.production
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

const prisma = new PrismaClient();

async function main() {
  console.log('📊 Riff User Analytics\n');
  console.log('='.repeat(60));

  // ============================================
  // 1. User Signups
  // ============================================
  const totalUsers = await prisma.user.count();
  const usersWithEmail = await prisma.user.count({ where: { email: { not: null } } });

  // Users by signup date (last 7 days breakdown)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const recentUsers = await prisma.user.findMany({
    where: { createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true },
    orderBy: { createdAt: 'asc' },
  });

  // Group by date
  const usersByDate: Record<string, number> = {};
  recentUsers.forEach(u => {
    const date = u.createdAt.toISOString().split('T')[0];
    usersByDate[date] = (usersByDate[date] || 0) + 1;
  });

  console.log('\n👤 USER SIGNUPS');
  console.log('-'.repeat(40));
  console.log(`Total users: ${totalUsers}`);
  console.log(`Users with email: ${usersWithEmail}`);
  console.log(`New users (last 7 days): ${recentUsers.length}`);
  console.log('\nDaily breakdown:');
  Object.entries(usersByDate).forEach(([date, count]) => {
    console.log(`  ${date}: ${count} users`);
  });

  // ============================================
  // 2. Deck Creation
  // ============================================
  const totalDecks = await prisma.deck.count();
  const publishedDecks = await prisma.deck.count({ where: { publishedAt: { not: null } } });
  const totalViews = await prisma.deck.aggregate({ _sum: { views: true } });

  // Users with decks
  const usersWithDecks = await prisma.user.count({
    where: { decks: { some: {} } },
  });

  // Users with published decks
  const usersWithPublished = await prisma.user.count({
    where: { decks: { some: { publishedAt: { not: null } } } },
  });

  // Conversion rates
  const signupToCreation = totalUsers > 0 ? ((usersWithDecks / totalUsers) * 100).toFixed(1) : '0';
  const creationToPublish = usersWithDecks > 0 ? ((usersWithPublished / usersWithDecks) * 100).toFixed(1) : '0';

  console.log('\n📑 DECK METRICS');
  console.log('-'.repeat(40));
  console.log(`Total decks created: ${totalDecks}`);
  console.log(`Published decks: ${publishedDecks}`);
  console.log(`Total views (all published decks): ${totalViews._sum.views || 0}`);
  console.log(`\nUsers who created decks: ${usersWithDecks} (${signupToCreation}% of signups)`);
  console.log(`Users who published: ${usersWithPublished} (${creationToPublish}% of creators)`);

  // ============================================
  // 3. Top Performing Decks
  // ============================================
  const topDecks = await prisma.deck.findMany({
    where: { publishedAt: { not: null }, views: { gt: 0 } },
    select: {
      name: true,
      views: true,
      publishedAt: true,
      owner: { select: { name: true, email: true } },
    },
    orderBy: { views: 'desc' },
    take: 10,
  });

  console.log('\n🏆 TOP PERFORMING DECKS');
  console.log('-'.repeat(40));
  if (topDecks.length === 0) {
    console.log('No published decks with views yet.');
  } else {
    topDecks.forEach((deck, i) => {
      const ownerName = deck.owner.name || deck.owner.email || 'Unknown';
      console.log(`  ${i + 1}. "${deck.name}" - ${deck.views} views (by ${ownerName})`);
    });
  }

  // ============================================
  // 4. Credits & Revenue
  // ============================================
  const purchaseTransactions = await prisma.creditTransaction.findMany({
    where: { type: 'purchase' },
    select: { amount: true, createdAt: true },
  });

  const donationTransactions = await prisma.creditTransaction.findMany({
    where: { type: 'donation' },
    select: { amount: true, createdAt: true },
  });

  const usageTransactions = await prisma.creditTransaction.aggregate({
    where: { type: 'usage' },
    _sum: { amount: true },
    _count: true,
  });

  const totalPurchasedCredits = purchaseTransactions.reduce((sum, t) => sum + t.amount, 0);
  const uniquePurchasers = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'purchase' },
  });

  const uniqueTippers = await prisma.creditTransaction.groupBy({
    by: ['userId'],
    where: { type: 'donation' },
  });

  console.log('\n💰 CREDITS & REVENUE');
  console.log('-'.repeat(40));
  console.log(`Credit purchases: ${purchaseTransactions.length} transactions`);
  console.log(`Total credits purchased: ${totalPurchasedCredits}`);
  console.log(`Unique purchasers: ${uniquePurchasers.length}`);
  console.log(`\nTips/Donations: ${donationTransactions.length}`);
  console.log(`Unique tippers: ${uniqueTippers.length}`);
  console.log(`\nCredit usage: ${usageTransactions._count} transactions`);
  console.log(`Total credits used: ${Math.abs(usageTransactions._sum.amount || 0)}`);

  // ============================================
  // 5. User Engagement Funnel
  // ============================================
  console.log('\n📈 ENGAGEMENT FUNNEL');
  console.log('-'.repeat(40));
  console.log(`Signups:              ${totalUsers}`);
  console.log(`Created deck:         ${usersWithDecks} (${signupToCreation}%)`);
  console.log(`Published deck:       ${usersWithPublished} (${creationToPublish}% of creators)`);
  console.log(`Purchased credits:    ${uniquePurchasers.length}`);
  console.log(`Tipped:               ${uniqueTippers.length}`);

  // ============================================
  // 6. Recent Activity (last 24 hours)
  // ============================================
  const oneDayAgo = new Date();
  oneDayAgo.setDate(oneDayAgo.getDate() - 1);

  const recentSignups = await prisma.user.count({ where: { createdAt: { gte: oneDayAgo } } });
  const recentDecks = await prisma.deck.count({ where: { createdAt: { gte: oneDayAgo } } });
  const recentPublishes = await prisma.deck.count({ where: { publishedAt: { gte: oneDayAgo } } });

  console.log('\n⏰ LAST 24 HOURS');
  console.log('-'.repeat(40));
  console.log(`New signups: ${recentSignups}`);
  console.log(`Decks created: ${recentDecks}`);
  console.log(`Decks published: ${recentPublishes}`);

  // ============================================
  // 7. User List with Activity
  // ============================================
  const allUsers = await prisma.user.findMany({
    select: {
      name: true,
      email: true,
      createdAt: true,
      _count: {
        select: {
          decks: true,
        },
      },
      decks: {
        where: { publishedAt: { not: null } },
        select: { views: true },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  console.log('\n👥 ALL USERS');
  console.log('-'.repeat(40));
  console.log('Name | Email | Joined | Decks | Published | Total Views');
  console.log('-'.repeat(70));

  allUsers.forEach(user => {
    const name = (user.name || 'N/A').substring(0, 15).padEnd(15);
    const email = (user.email || 'N/A').substring(0, 25).padEnd(25);
    const joined = user.createdAt.toISOString().split('T')[0];
    const deckCount = user._count.decks;
    const publishedCount = user.decks.length;
    const totalViews = user.decks.reduce((sum, d) => sum + d.views, 0);

    console.log(`${name} | ${email} | ${joined} | ${deckCount.toString().padStart(5)} | ${publishedCount.toString().padStart(9)} | ${totalViews.toString().padStart(11)}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('✨ Analytics complete!');
}

main()
  .catch((e) => {
    console.error('Error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
