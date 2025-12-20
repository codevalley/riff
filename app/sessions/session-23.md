# Session 23: Credits System Revamp

## Date: 2025-12-20

## Summary

Complete overhaul of the credits/coins system with three major improvements:
1. **Pricing Update**: Adjusted credit costs to cover real API costs (~$0.20-0.25 per operation)
2. **Credits Ledger**: Beautiful transaction history modal with accordion grouping
3. **Clickable Credits**: All credit displays now open the ledger on click

---

## Part 1: Pricing Adjustment

### Problem
Original pricing was too cheap - operations cost 1.68-2.92 credits worth in actual API costs but only charged 0.2-2 credits.

### Solution
Keep exchange rate ($1 = 20 credits), increase operation costs:

| Operation | Before | After | Real Price |
|-----------|--------|-------|------------|
| IMAGE_GENERATION | 1 | **5** | $0.25 |
| IMAGE_RESTYLE | 1 | **5** | $0.25 |
| DOCUMENT_CONVERSION | 2 | **5** | $0.25 |
| DECK_REVAMP | 1.5 | **5** | $0.25 |
| THEME_GENERATION | 0.2 | **1** | $0.05 |
| ADD_SLIDE | 0.2 | **1** | $0.05 |
| SLIDE_REVAMP | 0.2 | **1** | $0.05 |

### Files Updated
- `lib/credits-config.ts` - Core cost definitions
- `docs/monetize.md` - User documentation
- `docs/credits-technical.md` - Technical documentation
- `app/philosophy/page.tsx` - Public cost breakdown
- `app/docs/page.tsx` - Docs page credit costs table
- `components/PurchaseCreditsModal.tsx` - Tier descriptions

---

## Part 2: Credits Ledger Modal

### New Component: `CreditsLedgerModal.tsx`

A premium transaction history view with:

**Header**:
- Playfair Display font for title (matches PurchaseCreditsModal)
- Coins icon + animated NumberFlow balance
- Compact "Add" button (not full-width CTA)

**Mileage Widget**:
- "That's enough for" section
- Grid showing: X images, Y themes, Z revamps
- Color-coded icons (emerald/violet/amber)

**History Section**:
- Accordion-style grouping: Today, This Week, This Month, Earlier
- Collapsed by default (all groups)
- Summary in headers: spent/earned per period (−12, +50)
- Compact rows (not cards): icon + description + time + amount
- Smart icons per transaction type:
  - `Image` for generation
  - `Paintbrush` for restyle
  - `Palette` for themes
  - `Wand2` for revamps
  - `FileText` for documents
  - `PlusCircle` for add slide

**Footer**:
- Lifetime stats: "X used • Y added"
- Trust elements: "No subscriptions" + "Never expire" with icons

### Context Integration

Updated `useCredits.tsx` to include:
```typescript
interface CreditsContextType {
  // ... existing
  showLedgerModal: boolean;
  setShowLedgerModal: (show: boolean) => void;
}
```

Editor page now uses context instead of local state for modals.

---

## Part 3: Clickable Credit Displays

### Goal
Make existing credit text clickable → opens Ledger (not purchase modal directly)

### Flow
```
User clicks credit display
         ↓
   CreditsLedgerModal opens
   - Shows balance + history
   - Has "Add" button
         ↓
   User clicks "Add"
         ↓
   PurchaseCreditsModal opens
```

### Components Updated

| Component | Change |
|-----------|--------|
| `RevampSlideDialog.tsx` | Credit notice → button with `setShowLedgerModal(true)` |
| `RevampDeckDialog.tsx` | Credit notice → clickable button |
| `AddSlideDialog.tsx` | Credit notice → clickable button |
| `SweepGenerateDialog.tsx` | 3 credit displays made clickable |
| `ImagePlaceholder.tsx` | Added credit display to restyle modal footer |
| `CreditsDisplay.tsx` | Click opens ledger instead of purchase modal |

---

## Part 4: API & Hook Updates

### `/api/credits/route.ts`
- Increased transaction limit from 10 to 50
- Returns `metadata` field for richer display

### `lib/credits.ts`
- `getTransactionHistory()` now includes `metadata` in response

### `hooks/useCredits.tsx`
- Added `CreditTransaction` interface with all fields
- Hook returns `transactions` array
- Context includes `showLedgerModal` state

---

## Part 5: Documentation

### New: `docs/credits-implementation-guide.md`
Comprehensive guide for implementing the credits system in other projects:
- Database schema (Prisma)
- Configuration file
- DodoPayments client
- Credits library (server-side)
- API routes (balance, purchase, webhook)
- React hook & context
- Environment variables
- DodoPayments setup steps
- Usage patterns
- Checklist

---

## Files Summary

### Created
| File | Description |
|------|-------------|
| `components/CreditsLedgerModal.tsx` | Transaction history modal |
| `docs/credits-implementation-guide.md` | Implementation guide for other projects |

### Modified
| File | Changes |
|------|---------|
| `lib/credits-config.ts` | Updated CREDIT_COSTS values |
| `lib/credits.ts` | Added metadata to transaction history |
| `hooks/useCredits.tsx` | Added CreditTransaction type, ledger modal state |
| `app/api/credits/route.ts` | Increased transaction limit |
| `docs/monetize.md` | Updated pricing table |
| `docs/credits-technical.md` | Updated technical docs |
| `app/philosophy/page.tsx` | Updated cost breakdown |
| `app/docs/page.tsx` | Updated credit costs display |
| `components/PurchaseCreditsModal.tsx` | Dynamic tier descriptions |
| `app/editor/page.tsx` | Integrated ledger modal, use context |
| `components/RevampSlideDialog.tsx` | Clickable credit display |
| `components/RevampDeckDialog.tsx` | Clickable credit display |
| `components/AddSlideDialog.tsx` | Clickable credit display |
| `components/SweepGenerateDialog.tsx` | 3 clickable credit displays |
| `components/ImagePlaceholder.tsx` | Added credit display to restyle modal |

---

## Architecture: Credits Flow

```
┌─────────────────────────────────────────────────────────────┐
│                     CreditsProvider                          │
│  ┌────────────┐  ┌──────────────┐  ┌─────────────────────┐  │
│  │ balance    │  │ transactions │  │ showLedgerModal     │  │
│  │ isLoading  │  │ (50 max)     │  │ showPurchaseModal   │  │
│  │ refetch()  │  │              │  │ setShowLedgerModal  │  │
│  └────────────┘  └──────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌─────────────────┐    ┌──────────────────┐
│ CreditsDisplay│    │ Dialogs (Revamp,│    │ CreditsLedger   │
│ (toolbar)     │    │ AddSlide, etc.) │    │ Modal           │
│               │    │                 │    │                  │
│ Click → Ledger│    │ Credit text →   │    │ [+ Add] →       │
│               │    │ Click → Ledger  │    │ PurchaseModal   │
└──────────────┘    └─────────────────┘    └──────────────────┘
```

---

## Design Decisions

1. **Ledger First, Purchase Second**: Clicking credits opens ledger (see history) → then "Add" button opens purchase. More transparent than jumping straight to payment.

2. **Accordion for History**: Collapsed by default, grouped by time period. Reduces visual noise while allowing deep exploration.

3. **Smart Transaction Icons**: Icons match operation type (not generic arrows). Users can scan history visually.

4. **Whole Numbers Only**: All credit displays use `Math.round()` to avoid floating point display issues (42.40000002 → 42).

5. **Context Not Props**: Modal state lives in CreditsProvider, not passed through component tree. Any component can trigger ledger/purchase.

---

## Status

### Complete
- [x] Pricing update (5 credits = $0.25 for major ops)
- [x] Documentation updates (monetize.md, credits-technical.md, docs page)
- [x] Philosophy page cost breakdown
- [x] Purchase modal tier calculations
- [x] API transaction history (50 limit, metadata)
- [x] useCredits hook with transactions
- [x] CreditsLedgerModal component
- [x] Editor integration with context
- [x] All dialogs with clickable credits
- [x] Restyle modal credit display
- [x] Implementation guide for other projects

### UI Polish Applied
- [x] Playfair Display font matching
- [x] Coins icon in header
- [x] Add button aligned with balance
- [x] Smart icons per transaction type
- [x] Whole number display (no decimals)
- [x] Separator between lifetime stats and footer
- [x] Vertical alignment of trust icons
- [x] All accordions collapsed by default
