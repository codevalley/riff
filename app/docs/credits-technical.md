# Credits System - Technical Documentation

## Overview

The credits system uses DodoPayments for checkout but maintains the database as the source of truth for balances. This was chosen because the Dodo SDK doesn't expose a wallet API for direct balance manipulation.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        User Actions                          │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Sign Up ──► initializeUserCredits() ──► 50 free credits    │
│                                                              │
│  Generate Image ──► requireCredits(1) ──► deductCredits()   │
│                                                              │
│  Buy Credits ──► Dodo Checkout ──► Webhook ──► addCredits() │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

## Database Schema

### UserCredits
```prisma
model UserCredits {
  id             String   @id @default(cuid())
  userId         String   @unique
  user           User     @relation(...)
  dodoCustomerId String   @unique  // For payment lookup
  cachedBalance  Float    @default(0)
  lastSynced     DateTime @default(now())
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
}
```

### CreditTransaction
```prisma
model CreditTransaction {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(...)
  amount      Float    // Positive = credit, Negative = debit
  type        String   // "purchase" | "usage" | "bonus" | "refund" | "initial"
  description String?
  metadata    Json?    // Store context (deckId, imageDescription, etc)
  dodoLedgerId String? // Reference to Dodo if applicable
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([createdAt])
  @@index([type])
}
```

## API Reference

### lib/credits.ts

#### Constants (lib/credits-config.ts)
```typescript
CREDIT_COSTS = {
  IMAGE_GENERATION: 5,      // Generate new AI image (~$0.25)
  IMAGE_RESTYLE: 5,         // Apply style to existing image (~$0.25)
  DOCUMENT_CONVERSION: 5,   // Convert document to deck (~$0.25)
  DECK_REVAMP: 5,           // Refine existing deck (~$0.25)
  THEME_GENERATION: 1,      // Generate color theme (~$0.05)
  ADD_SLIDE: 1,             // Generate single slide (~$0.05)
  SLIDE_REVAMP: 1,          // Revamp single slide (~$0.05)
}

CREDITS_PER_DOLLAR = 20     // $1 = 20 credits
MIN_PURCHASE_DOLLARS = 1    // Minimum $1 purchase
DEFAULT_INITIAL_FREE_CREDITS = 50
```

Note: `lib/credits-config.ts` is safe for client-side import (no server dependencies).

#### Functions

**initializeUserCredits(userId, email, name?)**
- Creates Dodo customer
- Creates UserCredits record with 50 credits
- Logs initial transaction
- Safe to call multiple times (returns existing if found)

**ensureUserCredits(userId)**
- Lazy initialization for existing users
- Returns `{ dodoCustomerId, balance }`
- Creates credits if user has none

**getBalance(userId)**
- Returns `{ balance, dodoCustomerId }`
- Calls ensureUserCredits internally

**hasEnoughCredits(userId, amount)**
- Returns `{ hasEnough: boolean, balance: number }`
- Quick check without error details

**requireCredits(userId, cost)**
- Returns `{ allowed: true, balance }` or `{ allowed: false, error: InsufficientCreditsError }`
- Use before expensive operations

**deductCredits(userId, amount, description, metadata?)**
- Returns `{ success: true, newBalance, transactionId }` or `InsufficientCreditsError`
- Atomic update + transaction log

**addCredits(userId, amount, type, description?, metadata?)**
- Returns `{ success: true, newBalance, transactionId }`
- Used for purchases, bonuses, refunds

**getTransactionHistory(userId, limit?)**
- Returns array of recent transactions
- Default limit: 50

**isInsufficientCreditsError(result)**
- Type guard for error checking

### lib/dodo.ts

**createCustomer({ email, name? })**
- Creates customer in DodoPayments
- Returns `{ customerId }` (fallback to local ID if API fails)

**getCustomer(customerId)**
- Retrieves customer details
- Returns null for local customers

**createCheckoutSession(params)**
- Creates Dodo checkout session
- Returns `{ checkoutUrl, sessionId }`

**verifyWebhookSignature(payload, signature, secret)**
- Validates webhook authenticity
- Supports multiple signature formats

## API Endpoints

### GET /api/credits
Returns current balance and recent transactions.

Response:
```json
{
  "balance": 45.8,
  "transactions": [
    { "id": "...", "amount": -1, "type": "usage", "description": "AI image generation", "createdAt": "..." }
  ]
}
```

### POST /api/credits/purchase
Creates checkout session for credit purchase.

Request:
```json
{ "dollarAmount": 5 }
```

Response:
```json
{
  "checkoutUrl": "https://checkout.dodopayments.com/...",
  "sessionId": "...",
  "dollarAmount": 5,
  "creditAmount": 100
}
```

Note: Dodo product is priced at $1, quantity = dollarAmount.

### POST /api/webhooks/dodo
Handles Dodo payment webhooks.

Supported events:
- `payment.succeeded` / `payment.completed` - Add credits
- `payment.failed` - Log failure (no action needed)
- `refund.succeeded` / `refund.completed` - Deduct credits

Idempotency: Checks for existing transaction with same payment_id.

## Integration Pattern

Adding credit check to an API:

```typescript
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { requireCredits, deductCredits, CREDIT_COSTS } from '@/lib/credits';

export async function POST(request: NextRequest) {
  // 1. Auth check
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // 2. Credit check BEFORE expensive operation
  const creditCheck = await requireCredits(session.user.id, CREDIT_COSTS.IMAGE_GENERATION);
  if (!creditCheck.allowed) {
    return NextResponse.json(creditCheck.error, { status: 402 });
  }

  // 3. Perform the operation
  const result = await expensiveAIOperation();

  // 4. Deduct credits AFTER success
  await deductCredits(
    session.user.id,
    CREDIT_COSTS.IMAGE_GENERATION,
    'AI image generation',
    { description: result.description, model: result.model }
  );

  return NextResponse.json(result);
}
```

## UI Components

### CreditsDisplay
Balance indicator for toolbar. Shows:
- Current balance with coin icon
- Color-coded states (normal, low < 5, empty)
- Tooltip with status message
- Click to open purchase modal

### PurchaseCreditsModal
Editorial, trust-first purchase flow:

**Features:**
- Slider-based dollar selection ($1-$50)
- NumberFlow animations for smooth digit transitions
- Tier-based value messaging (changes by amount)
- Pre-screen for users with ≥50 credits
- $50+ easter egg (coffee/twitter links)
- Trust promises with icons (Shield, Infinity)

**Value Tiers:**
| Amount | Headline |
|--------|----------|
| $1 | "A quick top-up" |
| $2-4 | "A couple of decks" |
| $5-9 | "Several presentations" |
| $10-19 | "A whole project" |
| $20-49 | "Power user mode" |
| $50+ | "Whoa, big spender!" |

### InsufficientCreditsModal
Triggered when action fails due to low credits:
- Shows required vs available
- Direct link to purchase
- Non-blocking ("Maybe later" option)

### useCredits Hook
```typescript
const { balance, isLoading, error, refetch, hasEnough } = useCredits();
```

### CreditsProvider
Wraps app to provide:
- Shared balance state
- Modal visibility controls
- `triggerInsufficientModal(required, actionName)`

## Environment Variables

```env
# Required for payments (SDK reads DODO_PAYMENTS_API_KEY by default)
DODO_PAYMENTS_API_KEY=your_api_key_here
DODO_PAYMENTS_ENVIRONMENT=test_mode  # or live_mode
DODO_WEBHOOK_SECRET=your_webhook_secret
DODO_CREDITS_PRODUCT_ID=prod_...

# Optional
INITIAL_FREE_CREDITS=50  # Default: 50
```

## Testing

### Manual Testing
1. Create new user → Should get 50 credits
2. Generate image → Should deduct 1 credit
3. Check balance → Should show 49
4. Try with 0 credits → Should get 402 error

### Webhook Testing
Use Dodo's test mode and webhook simulator, or:
```bash
curl -X POST http://localhost:3000/api/webhooks/dodo \
  -H "Content-Type: application/json" \
  -d '{"type":"payment.succeeded","data":{"payment_id":"test","metadata":{"type":"credit_purchase","user_id":"...","credit_amount":"10"}}}'
```

## Error Handling

### Insufficient Credits (402)
```json
{
  "error": "insufficient_credits",
  "required": 1,
  "balance": 0.4,
  "message": "You need 1 credit but have 0.4"
}
```

### Dodo API Failures
- Customer creation: Falls back to local ID (`local_timestamp_random`)
- Checkout creation: Throws error, user can retry
- Webhooks: Logged, returns 500 (Dodo will retry)

## Security Considerations

1. **Webhook verification** - Signature checked before processing
2. **Idempotency** - Duplicate payments don't double-credit
3. **Auth required** - All credit-costing APIs require session
4. **Race conditions** - Balance check then deduct isn't atomic, but acceptable for this use case (worst case: slight over-usage)
