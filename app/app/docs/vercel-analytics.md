# Vercel Analytics Integration

Riff uses [Vercel Analytics](https://vercel.com/docs/analytics) for tracking user behavior and product metrics.

---

## Setup

Analytics is configured in `app/layout.tsx`:

```tsx
import { Analytics } from '@vercel/analytics/next';

// In RootLayout:
<Analytics />
```

This provides automatic tracking for:
- Page views and navigation
- Core Web Vitals (LCP, FID, CLS)
- Browser, device, and geographic data

---

## Custom Events

Custom events are tracked via `lib/analytics.ts`. This centralizes all tracking calls and ensures consistent event naming.

### Usage

```tsx
import { analytics } from '@/lib/analytics';

// Track when a user creates a deck
analytics.deckCreated('scratch');

// Track when a user publishes
analytics.deckPublished();

// Track image generation
analytics.imageGenerated('photorealistic');
```

---

## Event Reference

### Funnel Events

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `deck_created` | `analytics.deckCreated(source)` | `source`: 'scratch' \| 'import' \| 'content' | New deck created |
| `deck_published` | `analytics.deckPublished()` | — | Deck published successfully |

### Feature Usage

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `image_generated` | `analytics.imageGenerated(style?)` | `style`: optional style name | Image generation completes |
| `theme_generated` | `analytics.themeGenerated()` | — | Theme generation completes |
| `revamp_used` | `analytics.revampUsed()` | — | User triggers deck revamp |

### Monetization

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `credits_purchased` | `analytics.creditsPurchased(amount)` | `amount`: credit count | Payment success redirect |
| `tip_sent` | `analytics.tipSent()` | — | Tip success redirect |

### Sharing

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `deck_exported` | `analytics.deckExported(format)` | `format`: 'pdf' \| 'pptx' \| 'riff' | Export download completes |

### Engagement (Published Decks)

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `slide_viewed` | `analytics.slideViewed(index, total)` | `slide`, `total` | Viewer navigates to slide |
| `deck_completed` | `analytics.deckCompleted()` | — | Viewer reaches last slide |

### Acquisition

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `badge_clicked` | `analytics.badgeClicked()` | — | User clicks "Made with Riff" badge |
| `cta_clicked` | `analytics.ctaClicked(location, type)` | `location`: 'hero' \| 'footer', `type`: 'content' \| 'empty' | User clicks CTA on landing page |

### Milestone Events

| Event | Function | Properties | When Triggered |
|-------|----------|------------|----------------|
| `signup_completed` | Server-side in `lib/auth.ts` | `provider`: OAuth provider name | New user completes signup |
| `first_deck_created` | `analytics.firstDeckCreated()` | — | User creates their first deck ever |
| `first_deck_published` | `analytics.firstDeckPublished()` | — | User publishes a deck for the first time |

---

## Where Events Are Tracked

| File | Events |
|------|--------|
| `lib/auth.ts` | `signup_completed` (server-side) |
| `app/editor/page.tsx` | `deck_created`, `first_deck_created`, `theme_generated`, `revamp_used`, `tip_sent` |
| `components/sharing/PublishPopover.tsx` | `deck_published`, `first_deck_published` |
| `components/ImagePlaceholder.tsx` | `image_generated` |
| `components/ExportDropdown.tsx` | `deck_exported` |
| `components/Presenter.tsx` | `slide_viewed`, `deck_completed` |
| `components/RiffBadge.tsx` | `badge_clicked` |
| `components/Landing.tsx` | `cta_clicked` |

---

## Vercel Analytics Limits

- **Event names**: Up to 50 unique event names (we use 16)
- **Properties**: Up to 5 properties per event (we use max 2)
- **Property values**: Strings only, max 500 characters
- **Rate limiting**: Automatic client-side batching

---

## Viewing Analytics

1. Go to your Vercel dashboard
2. Select the Riff project
3. Navigate to **Analytics** tab
4. Custom events appear in the **Events** panel

---

## Adding New Events

1. Add the tracking function to `lib/analytics.ts`:

```tsx
export const analytics = {
  // ... existing events

  /** Track when user does something new */
  newEvent: (property: string) => {
    track('new_event', { property });
  },
};
```

2. Import and call from the relevant component:

```tsx
import { analytics } from '@/lib/analytics';

// When the action occurs:
analytics.newEvent('value');
```

3. Update this documentation.

---

## Future Enhancements

Potential additions:
- [ ] Track time-on-slide for published decks
- [ ] Track credit purchase amounts (requires success redirect param)
- [x] ~~Track authentication events (signup, login)~~ → `signup_completed`
- [ ] Track onboarding completion rates
- [ ] A/B test tracking for feature experiments
- [ ] Track login events (existing users returning)
