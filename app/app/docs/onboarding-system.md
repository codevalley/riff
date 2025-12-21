# Onboarding System

A scalable, configuration-driven onboarding system for Riff. Supports welcome dialogs, multi-step tours, and contextual tooltips.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      OnboardingProvider                      │
│  (Wraps app, manages state, syncs to backend + localStorage) │
└─────────────────────────┬───────────────────────────────────┘
                          │
         ┌────────────────┼────────────────┐
         │                │                │
         ▼                ▼                ▼
   ┌──────────┐    ┌──────────┐    ┌──────────┐
   │  Dialog  │    │ Tooltip  │    │  Tour    │
   │ Component│    │Component │    │ Wrapper  │
   └──────────┘    └──────────┘    └──────────┘
```

## Key Files

| File | Purpose |
|------|---------|
| `lib/onboarding-config.ts` | Step definitions and types |
| `hooks/useOnboarding.tsx` | Provider + hook with backend sync |
| `components/onboarding/OnboardingDialog.tsx` | Modal dialog component |
| `components/onboarding/illustrations/*.tsx` | SVG illustrations |
| `app/api/user/onboarding/route.ts` | GET/PATCH/DELETE API |
| `prisma/schema.prisma` | `User.onboardingState` JSON field |

## State Persistence

### Authenticated Users
- State stored in `User.onboardingState` (JSON field)
- Fetched from API on mount
- Synced to API on each completion
- Also cached in localStorage for offline access

### Guests
- State stored in `localStorage` only
- Key: `riff-onboarding-state`

### State Shape

```typescript
interface OnboardingState {
  completedSteps: string[];  // Step IDs that have been completed
  skippedAll: boolean;       // User clicked "Skip all tutorials"
  lastCompletedAt?: string;  // ISO timestamp
}
```

## Step Configuration

Steps are defined in `lib/onboarding-config.ts`:

```typescript
export const ONBOARDING_STEPS: Record<OnboardingStepId, OnboardingStep> = {
  'welcome-editor': {
    id: 'welcome-editor',
    type: 'dialog',           // 'dialog' | 'tooltip' | 'tour-step'
    title: 'Welcome to Riff',
    description: 'Create beautiful presentations...',
    trigger: 'first-visit',   // 'first-visit' | 'first-feature-use' | 'manual'
    route: '/editor',         // For first-visit trigger
    primaryAction: { label: 'Get started', action: 'dismiss' },
    secondaryAction: { label: 'Skip all tutorials', action: 'skip-all' },
  },
  // ... more steps
};
```

### Trigger Types

| Trigger | Description | Required Field |
|---------|-------------|----------------|
| `first-visit` | Shows on first visit to a route | `route` |
| `first-feature-use` | Shows on first use of a feature | `featureKey` |
| `manual` | Only shown via help menu | None |

### Step Types

| Type | Component | Use Case |
|------|-----------|----------|
| `dialog` | `OnboardingDialog` | Major feature introductions |
| `tooltip` | `OnboardingTooltip` | Small contextual hints |
| `tour-step` | Part of multi-step tour | Guided walkthroughs |

## Usage in Components

### Triggering Feature-Based Onboarding

```tsx
import { useOnboarding } from '@/hooks/useOnboarding';

function ImagePanel() {
  const { recordFeatureUse } = useOnboarding();

  const handleImageClick = () => {
    recordFeatureUse('image-placeholder-click');
    // ... rest of handler
  };
}
```

### Rendering the Dialog

```tsx
import { useOnboarding } from '@/hooks/useOnboarding';
import { OnboardingDialog, WelcomeIllustration } from '@/components/onboarding';

function EditorPage() {
  const { activeStep, dismissActiveStep, skipAll, activeTour } = useOnboarding();

  return (
    <>
      {/* Page content */}

      {activeStep && activeStep.type === 'dialog' && (
        <OnboardingDialog
          isOpen={true}
          onDismiss={dismissActiveStep}
          onSecondaryAction={skipAll}
          title={activeStep.title}
          description={activeStep.description}
          primaryLabel={activeStep.primaryAction.label}
          secondaryLabel={activeStep.secondaryAction?.label}
          illustration={<WelcomeIllustration />}
          tourProgress={activeTour ? {
            current: activeTour.currentIndex,
            total: activeTour.steps.length
          } : undefined}
        />
      )}
    </>
  );
}
```

### Resetting Onboarding

For a "Show tutorials again" option in settings:

```tsx
const { resetOnboarding } = useOnboarding();

<button onClick={resetOnboarding}>
  Reset tutorials
</button>
```

## API Endpoints

### GET /api/user/onboarding
Returns current onboarding state for authenticated user.

```json
{
  "state": {
    "completedSteps": ["welcome-editor"],
    "skippedAll": false,
    "lastCompletedAt": "2024-12-21T10:30:00Z"
  }
}
```

### PATCH /api/user/onboarding
Updates onboarding state (merges completedSteps).

```json
// Request body
{
  "completedSteps": ["markdown-intro"],
  "skippedAll": false
}
```

### DELETE /api/user/onboarding
Resets onboarding state to default.

## Adding New Steps

1. **Add step ID to type** in `onboarding-config.ts`:
   ```typescript
   export type OnboardingStepId =
     | 'welcome-editor'
     | 'your-new-step'  // Add here
     | ...
   ```

2. **Add step definition**:
   ```typescript
   'your-new-step': {
     id: 'your-new-step',
     type: 'dialog',
     title: 'Your Step Title',
     description: 'Description...',
     trigger: 'first-feature-use',
     featureKey: 'your-feature-key',
     primaryAction: { label: 'Got it', action: 'dismiss' },
   },
   ```

3. **Add feature key** (if using `first-feature-use`):
   ```typescript
   export type FeatureKey =
     | 'image-placeholder-click'
     | 'your-feature-key'  // Add here
     | ...
   ```

4. **Trigger in component**:
   ```tsx
   const { recordFeatureUse } = useOnboarding();
   recordFeatureUse('your-feature-key');
   ```

## Design Guidelines

- **Dark theme**: Background `#0c0c0c`, border `white/[0.08]`
- **Typography**: Playfair Display for titles, system font for body
- **Animations**: Ease `[0.22, 1, 0.36, 1]`, duration 0.25s
- **No "AI" terminology**: Use "Riff creates", "Generated images", etc.
- **No Sparkles icon**: Use Wand2, Zap, Palette instead

## Inline Code Highlighting

Descriptions support backtick-wrapped text for keyword highlighting:

```typescript
description: 'Use `---` to separate slides, `#` for headings...'
```

Renders with cyan background and monospace font, matching the app's syntax highlighting.

## Current Steps

| Step ID | Type | Tour | Trigger | Route/Feature |
|---------|------|------|---------|---------------|
| `welcome-editor` | tour-step | editor-intro (0) | first-visit | /editor |
| `markdown-intro` | tour-step | editor-intro (1) | first-visit | /editor |
| `slash-commands` | tour-step | editor-intro (2) | first-visit | /editor |
| `image-generation` | tooltip | - | first-feature-use | image-placeholder-click |
| `theme-customization` | tooltip | - | first-feature-use | theme-panel-open |
| `publishing` | dialog | - | first-feature-use | publish-click |
| `pricing-philosophy` | dialog | - | first-feature-use | first-credit-spend |

## Tours

Steps can be grouped into multi-step tours using `tourId` and `tourOrder`:

```typescript
'markdown-intro': {
  id: 'markdown-intro',
  type: 'tour-step',
  tourId: 'editor-intro',  // Group identifier
  tourOrder: 1,            // Order within tour (0-indexed)
  // ...
},
```

Tour navigation shows progress dots and changes the primary button to "Next" / "Done".

### Resetting Tours

Users can replay the full tour via "Show tutorials" in the user menu, which calls `resetOnboarding()`.

## Illustrations

Custom SVG illustrations for each tour step:

| Step | Illustration | Description |
|------|--------------|-------------|
| welcome-editor | `WelcomeIllustration` | Split view: editor left, slide preview right |
| markdown-intro | `MarkdownIllustration` | Two slides with `#`, `-`, `---`, `**pause**` |
| slash-commands | `SlashCommandsIllustration` | `/` triggering command dropdown |

All illustrations use:
- Framer Motion for animations
- Consistent viewBox `280×140`
- Amber accent color (`#f59e0b`)
- Cyan highlight for commands (`#06b6d4`)

## OnboardingTooltip

Contextual hints that anchor to target elements:

```tsx
import { OnboardingTooltip } from '@/components/onboarding';

function FeatureComponent() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const { activeStep, dismissActiveStep } = useOnboarding();

  const showTooltip = activeStep?.id === 'image-generation' && activeStep.type === 'tooltip';

  return (
    <>
      <button ref={buttonRef}>Generate</button>

      <OnboardingTooltip
        isOpen={showTooltip}
        onDismiss={dismissActiveStep}
        title={activeStep?.title || ''}
        description={activeStep?.description || ''}
        targetRef={buttonRef}
        preferredPosition="bottom"
      />
    </>
  );
}
```

### Positioning

- `preferredPosition`: Direction the arrow points FROM (`top`, `bottom`, `left`, `right`)
- Tooltip appears on the opposite side
- Auto-flips if not enough space

## Phase Implementation Status

- [x] Phase 1: Core infrastructure (schema, API, config, hook, provider)
- [x] Phase 2: Welcome dialog + illustrations + multi-step tour
- [x] Phase 3: OnboardingTooltip component
- [x] Phase 4: Feature triggers (recordFeatureUse) in components
  - ThemeCustomizer: `recordFeatureUse('theme-panel-open')`
  - ImagePlaceholder: `recordFeatureUse('image-placeholder-click')`
- [ ] Phase 5: Polish & keyboard navigation
