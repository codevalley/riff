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

---

## Where Events Are Tracked

| File | Events |
|------|--------|
| `app/editor/page.tsx` | `deck_created`, `theme_generated`, `revamp_used`, `tip_sent` |
| `components/sharing/PublishPopover.tsx` | `deck_published` |
| `components/ImagePlaceholder.tsx` | `image_generated` |
| `components/ExportDropdown.tsx` | `deck_exported` |
| `components/Presenter.tsx` | `slide_viewed`, `deck_completed` |

---

## Vercel Analytics Limits

- **Event names**: Up to 50 unique event names
- **Properties**: Up to 5 properties per event
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
- [ ] Track authentication events (signup, login)
- [ ] Track onboarding completion rates
- [ ] A/B test tracking for feature experiments
