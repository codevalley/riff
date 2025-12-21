# Session 26: Onboarding System - Multi-Step Tour & Illustrations

## Date: 2025-12-21

## Summary

Built a complete onboarding system for Riff with:
1. **Backend-synced state** - Prisma JSON field + localStorage hybrid
2. **Multi-step tour** - 3-step editor intro with progress dots
3. **Custom SVG illustrations** - Animated visuals for each step
4. **Inline code highlighting** - Backtick syntax in descriptions

Key implementation: Configuration-driven architecture using TypeScript types, matching the existing `CreditsProvider` pattern.

---

## Part 1: Architecture Overview

### State Persistence

| User Type | Storage | Sync |
|-----------|---------|------|
| Authenticated | `User.onboardingState` (Prisma JSON) | API on each completion |
| Guest | `localStorage` | Local only |

### File Structure

```
lib/
  onboarding-config.ts          # Step definitions, types, helpers

hooks/
  useOnboarding.tsx             # Provider + hook (matches CreditsProvider)

components/onboarding/
  index.ts                      # Barrel export
  OnboardingDialog.tsx          # Modal with illustration + progress
  illustrations/
    WelcomeIllustration.tsx     # Split view: editor + preview
    MarkdownIllustration.tsx    # Two slides with markdown syntax
    SlashCommandsIllustration.tsx # / triggering dropdown

app/api/user/onboarding/
  route.ts                      # GET/PATCH/DELETE endpoints
```

---

## Part 2: Configuration System

### Step Types

```typescript
type OnboardingStepId =
  | 'welcome-editor'
  | 'markdown-intro'
  | 'slash-commands'
  | 'image-generation'
  | 'theme-customization'
  | 'publishing'
  | 'pricing-philosophy';

type OnboardingType = 'dialog' | 'tooltip' | 'tour-step';
type OnboardingTrigger = 'first-visit' | 'first-feature-use' | 'manual';
```

### Tour Configuration

Steps grouped via `tourId` and `tourOrder`:

```typescript
'markdown-intro': {
  id: 'markdown-intro',
  type: 'tour-step',
  tourId: 'editor-intro',
  tourOrder: 1,
  title: 'Write in Markdown',
  description: 'Use `---` to separate slides, `#` for headings...',
  primaryAction: { label: 'Next', action: 'next' },
},
```

### Helper Functions

| Function | Purpose |
|----------|---------|
| `getTourSteps(tourId)` | Get all steps in a tour, sorted |
| `getFirstVisitSteps(route)` | Steps triggered by route visit |
| `getFeatureStep(featureKey)` | Step for feature-based trigger |
| `getWelcomeStep()` | Returns welcome-editor step |

---

## Part 3: Provider Implementation

### Context Shape

```typescript
interface OnboardingContextType {
  // State
  completedSteps: Set<OnboardingStepId>;
  skippedAll: boolean;
  activeStep: OnboardingStep | null;
  activeTour: {
    id: string;
    currentIndex: number;
    steps: OnboardingStep[];
  } | null;

  // Actions
  dismissActiveStep: () => void;
  skipAll: () => void;
  resetOnboarding: () => void;
  recordFeatureUse: (featureKey: FeatureKey) => void;
  nextTourStep: () => void;
}
```

### Tour Navigation Logic

```typescript
const nextTourStep = useCallback(() => {
  if (!activeTour || !activeStep) return;

  // Mark current step as completed
  completeStep(activeStep.id);

  const nextIndex = activeTour.currentIndex + 1;
  if (nextIndex < activeTour.steps.length) {
    // Move to next step
    setActiveTour({ ...activeTour, currentIndex: nextIndex });
    setActiveStep(activeTour.steps[nextIndex]);
  } else {
    // Tour complete
    setActiveTour(null);
    setActiveStep(null);
  }
}, [activeTour, activeStep, completeStep]);
```

### Reset + Immediate Replay

```typescript
const resetOnboarding = useCallback(async () => {
  setCompletedSteps(new Set());
  setSkippedAll(false);

  // Clear storage
  if (session?.user) {
    await fetch('/api/user/onboarding', { method: 'DELETE' });
  }
  localStorage.removeItem('riff-onboarding-state');

  // Immediately start the tour
  const welcomeStep = ONBOARDING_STEPS['welcome-editor'];
  if (welcomeStep?.tourId) {
    const tourSteps = getTourSteps(welcomeStep.tourId);
    setActiveTour({ id: welcomeStep.tourId, currentIndex: 0, steps: tourSteps });
    setActiveStep(tourSteps[0]);
  }
}, [session]);
```

---

## Part 4: OnboardingDialog Component

### Inline Code Highlighting

Backtick-wrapped text renders as highlighted code:

```typescript
function parseDescription(text: string): ReactNode[] {
  const parts = text.split(/`([^`]+)`/);
  return parts.map((part, index) => {
    if (index % 2 === 1) {
      return (
        <code
          key={index}
          className="px-1.5 py-0.5 mx-0.5 rounded bg-cyan-500/15 text-cyan-400 font-mono text-[13px]"
        >
          {part}
        </code>
      );
    }
    return part;
  });
}
```

### Tour Progress Dots

```tsx
{tourProgress && tourProgress.total > 1 && (
  <div className="flex items-center justify-center gap-2 mb-5">
    {Array.from({ length: tourProgress.total }).map((_, i) => (
      <div
        key={i}
        className={`
          h-1.5 rounded-full transition-all duration-300
          ${i === tourProgress.current
            ? 'w-6 bg-white'          // Current: wide white
            : i < tourProgress.current
              ? 'w-1.5 bg-white/40'   // Completed: small dim
              : 'w-1.5 bg-white/20'   // Future: smaller dim
          }
        `}
      />
    ))}
  </div>
)}
```

---

## Part 5: SVG Illustrations

### WelcomeIllustration

Split view showing editor (left) and slide preview (right):

- **Left panel**: Code lines with amber title, blinking cursor
- **Right panel**: Centered slide content with navigation dots
- **Center**: Arrow connecting the two
- **Animation**: Staggered entrance, elements fade in sequentially

### MarkdownIllustration

Two slides demonstrating markdown syntax:

- **Slide 1**: `#` heading with bullet points (`-`)
- **Separator**: Highlighted `---` between slides
- **Slide 2**: `##` subheading with `**pause**` directive

### SlashCommandsIllustration

Command palette visualization:

- **Editor**: Text lines with `/` character highlighted in cyan
- **Dropdown**: Command options with category badges
- **Selected**: `/image` with "Generate image" description
- **Unselected**: `/pause` dimmed below

### Animation Specs

| Element | Duration | Delay | Easing |
|---------|----------|-------|--------|
| Panel entrance | 0.5s | 0.1-0.2s | `[0.22, 1, 0.36, 1]` |
| Content stagger | 0.08s between | 0.3-0.6s | Same |
| Cursor blink | 1.2s | - | linear, infinite |
| Sync indicator | 2s | - | easeInOut, infinite |

---

## Part 6: API Endpoints

### GET /api/user/onboarding

Returns current state for authenticated user:

```json
{
  "state": {
    "completedSteps": ["welcome-editor", "markdown-intro"],
    "skippedAll": false,
    "lastCompletedAt": "2025-12-21T10:30:00Z"
  }
}
```

### PATCH /api/user/onboarding

Merges new completed steps:

```typescript
// Merge instead of replace
const mergedSteps = [
  ...new Set([...(existing?.completedSteps || []), ...completedSteps]),
];
```

### DELETE /api/user/onboarding

Resets state to `null`.

---

## Part 7: Integration Points

### Editor Page

```tsx
const { activeStep, activeTour, nextTourStep, skipAll } = useOnboarding();

{activeStep && (
  <OnboardingDialog
    isOpen={true}
    onDismiss={activeTour ? nextTourStep : dismissActiveStep}
    onSecondaryAction={skipAll}
    title={activeStep.title}
    description={activeStep.description}
    primaryLabel={
      activeTour
        ? activeTour.currentIndex === activeTour.steps.length - 1
          ? 'Done'
          : 'Next'
        : activeStep.primaryAction.label
    }
    illustration={/* step-specific illustration */}
    tourProgress={activeTour ? {
      current: activeTour.currentIndex,
      total: activeTour.steps.length
    } : undefined}
  />
)}
```

### User Menu

"Show tutorials" button calls `resetOnboarding()`:

```tsx
<button onClick={() => { setIsOpen(false); resetOnboarding(); }}>
  <RotateCcw className="w-4 h-4" />
  Show tutorials
</button>
```

---

## Files Summary

### New Files

| File | Lines | Purpose |
|------|-------|---------|
| `lib/onboarding-config.ts` | 230 | Step definitions, types, helpers |
| `hooks/useOnboarding.tsx` | 280 | Provider + hook with backend sync |
| `components/onboarding/index.ts` | 11 | Barrel export |
| `components/onboarding/OnboardingDialog.tsx` | 200 | Modal component |
| `components/onboarding/illustrations/WelcomeIllustration.tsx` | 310 | Split view SVG |
| `components/onboarding/illustrations/MarkdownIllustration.tsx` | 232 | Markdown syntax SVG |
| `components/onboarding/illustrations/SlashCommandsIllustration.tsx` | 209 | Command palette SVG |
| `app/api/user/onboarding/route.ts` | 120 | API endpoints |
| `app/docs/onboarding-system.md` | 290 | System documentation |

### Modified Files

| File | Changes |
|------|---------|
| `prisma/schema.prisma` | Added `onboardingState Json?` to User |
| `app/layout.tsx` | Wrapped with OnboardingProvider |
| `app/editor/page.tsx` | Integrated tour with navigation |
| `components/auth/UserMenu.tsx` | Added "Show tutorials" button |

---

## Key Insights

1. **JSON Fields in Prisma**: Use `as unknown as Prisma.JsonObject` for type safety when updating JSON fields with complex TypeScript types.

2. **Tour State Machine**: Keep `activeTour` separate from `activeStep` - the tour tracks overall progress while activeStep is the current display.

3. **Backtick Parsing**: Regex `split(/`([^`]+)`/)` captures alternating text/code segments - odd indices are code.

4. **SVG Animation Staggering**: Framer Motion's `staggerChildren` in parent variants creates elegant cascading effects.

5. **Hybrid Persistence**: Auth users get API sync, guests get localStorage - same hook API for both.

---

## Status

### Complete
- [x] Prisma schema + API endpoints
- [x] Configuration system with tour support
- [x] Provider with backend sync
- [x] OnboardingDialog with progress dots
- [x] 3 custom SVG illustrations
- [x] Inline code highlighting in descriptions
- [x] Reset + replay from user menu
- [x] Documentation

### Next Phase
- [ ] Phase 3: Contextual tooltips (OnboardingTooltip component)
- [ ] Phase 4: Feature triggers (recordFeatureUse integration)
- [ ] Phase 5: Keyboard navigation (Esc to dismiss, Enter to proceed)
