# Riff Scripts

Utility scripts for analytics and email operations. All scripts support `--env=.env.production` to run against production database.

## Structure

```
scripts/
├── analytics/
│   ├── user-metrics.ts    # User performance analytics
│   └── daily-funnel.ts    # Daily funnel snapshot (appends to CSV)
├── emails/
│   ├── test.ts            # Test sending any email type
│   ├── backfill.ts        # Backfill emails to qualifying users
│   └── send-dormant.ts    # Re-engage dormant users
└── README.md
```

---

## Analytics Scripts

### User Metrics

Pull user performance data from the database.

```bash
# Local database
npx tsx scripts/analytics/user-metrics.ts

# Production database
npx tsx scripts/analytics/user-metrics.ts --env=.env.production
```

**Output includes:**
- User signup counts (total, last 7 days, daily breakdown)
- Deck creation and publishing metrics
- Engagement funnel (signup → create → publish → purchase)
- Top performing decks by views
- Credits & revenue summary
- Full user list with activity

---

### Daily Funnel Snapshot

Append daily funnel metrics to a CSV file for tracking trends over time.

```bash
# Local database
npx tsx scripts/analytics/daily-funnel.ts

# Production database
npx tsx scripts/analytics/daily-funnel.ts --env=.env.production
```

**Output:** Saves a row to `data/funnel-metrics.csv` with:
- date, signups, users_created_deck, users_published
- total_decks, published_decks, total_views
- purchasers, tippers

**Idempotent:** Safe to run multiple times per day. If today's row exists, it updates it instead of duplicating.

**Note:** The `data/` directory is gitignored and stored locally only.

---

### Visualizing the CSV

**Quick terminal view:**
```bash
# Pretty print with column
column -s, -t data/funnel-metrics.csv

# Just the funnel columns
cut -d, -f1-4 data/funnel-metrics.csv | column -s, -t
```

**Google Sheets (free):**
1. Upload `data/funnel-metrics.csv` to Google Drive
2. Open with Google Sheets
3. Select data → Insert → Chart → Line chart

**Python one-liner:**
```bash
# Requires: pip install pandas matplotlib
python3 -c "
import pandas as pd
import matplotlib.pyplot as plt
df = pd.read_csv('data/funnel-metrics.csv', parse_dates=['date'])
df.plot(x='date', y=['signups','users_created_deck','users_published'], marker='o')
plt.savefig('data/funnel.png')
print('Saved data/funnel.png')
"
```

---

## Email Scripts

All email scripts use templates from `lib/email.ts` and log to the `EmailLog` table to prevent duplicates.

### Test Email

Send a specific email type to a user for testing.

```bash
npx tsx scripts/emails/test.ts <type> <email> [--env=.env.production]
```

**Email types:** `welcome`, `credit-purchase`, `tip`, `dormant`

**Examples:**
```bash
# Test welcome email locally
npx tsx scripts/emails/test.ts welcome your@email.com

# Test dormant email on production
npx tsx scripts/emails/test.ts dormant your@email.com --env=.env.production
```

**Notes:**
- Checks if email was already sent (won't resend)
- Logs to EmailLog after successful send
- To resend, manually delete the EmailLog entry first

---

### Backfill Emails

Send emails to all qualifying users who haven't received them yet.

```bash
npx tsx scripts/emails/backfill.ts <type> [--dry-run] [--env=.env.production]
```

**Email types:** `welcome`, `credit-purchase`, `tip`

**Qualifying criteria:**
- `welcome` - All users with email, no welcome email sent
- `credit-purchase` - Users with purchase transactions, no credit email sent
- `tip` - Users with donation transactions, no tip email sent

**Examples:**
```bash
# Dry run - see who would receive emails (no sending)
npx tsx scripts/emails/backfill.ts welcome --dry-run --env=.env.production

# Actually send
npx tsx scripts/emails/backfill.ts welcome --env=.env.production
```

---

### Send Dormant Emails

Re-engage users who signed up but never created a deck.

```bash
npx tsx scripts/emails/send-dormant.ts [--dry-run] [--env=.env.production]
```

**Qualifying criteria:**
- Has email
- Has zero decks
- Hasn't received dormant email before

**Examples:**
```bash
# Dry run - see dormant users
npx tsx scripts/emails/send-dormant.ts --dry-run --env=.env.production

# Actually send
npx tsx scripts/emails/send-dormant.ts --env=.env.production
```

---

## Common Flags

| Flag | Description |
|------|-------------|
| `--env=.env.production` | Use production environment/database |
| `--dry-run` | Show what would happen without sending |

---

## Email Configuration

Scripts use these environment variables:

```env
RESEND_API_KEY=re_xxx          # Resend API key
RESEND_FROM_EMAIL=nyn@riff.im  # Sender email
RESEND_FROM_NAME=Riff          # Sender name
RESEND_REPLY_TO=nyn@riff.im    # Reply-to address
RESEND_BCC_EMAIL=nyn@riff.im   # BCC for logging
```

---

## Adding New Email Types

1. Add template function in `lib/email.ts`:
   ```typescript
   export function getNewEmailContent(userName?: string): { subject: string; html: string } {
     // ...
   }
   ```

2. Add type to `EmailType` in `lib/email.ts`

3. Update scripts as needed (backfill.ts needs qualifying criteria)

4. Run migration if new emailType needs to be tracked
