# Session 01: Section Slides, Theme System, and System Prompt Exposure

**Date:** December 10, 2025
**Focus:** Quality-of-life improvements and user control over AI generation

---

## Overview

This session focused on two main areas:
1. **Visual Enhancements** - Section header slides with distinctive styling
2. **User Control** - Exposing AI system prompts for theme and slide generation

---

## Features Implemented

### 1. Section Header Slides

**Problem:** No way to visually distinguish major section breaks in presentations.

**Solution:** Added `[section]` marker support that transforms slides into bold section headers.

**Implementation:**
- Added `isSection?: boolean` to `Slide` interface (`lib/types.ts:89`)
- Parser recognizes `[section]` marker and flags slides accordingly (`lib/parser.ts:111-119`)
- `SlideRenderer` renders section slides with:
  - RetroGrid animated background effect
  - Bolder, larger typography via `SectionElementRenderer`
  - Full-viewport centered layout

**Usage in markdown:**
```markdown
---
[section]

# Your Section Title

## Optional subtitle
```

**Files Modified:**
- `lib/types.ts` - Added `isSection` to Slide interface
- `lib/parser.ts` - Parse `[section]` marker
- `components/SlideRenderer.tsx` - Section-specific rendering with RetroGrid
- `components/ui/retro-grid.tsx` - New animated grid component using CSS variables

---

### 2. Background Color for Image Generation

**Problem:** AI-generated images didn't account for slide background colors, causing visual clashes.

**Solution:** Pass the current `--slide-bg` CSS variable value to image generation prompts.

**Implementation:**
- `ImagePlaceholder` reads computed `--slide-bg` from DOM
- Background color is passed to `/api/generate-image` endpoint
- `getPromptForStyle()` incorporates background color instruction into prompts

**Files Modified:**
- `components/ImagePlaceholder.tsx:89-102` - Extract CSS variable, pass to API
- `app/api/generate-image/route.ts:10-24` - Handle backgroundColor in prompts

---

### 3. Theme CSS in Preview Mode

**Problem:** Theme CSS only loaded in presenter mode, not in the main editor preview.

**Solution:** Inject theme CSS into `SlidePreview` component, matching presenter behavior.

**Implementation:**
- `SlidePreview` now reads `currentTheme` from store
- Theme CSS injected via `<style>` tag (same pattern as `Presenter.tsx:155`)
- `loadDeck()` in page.tsx fetches saved theme from `/api/theme/{id}`

**Files Modified:**
- `components/SlidePreview.tsx:33,91-92` - Theme CSS injection
- `app/page.tsx:74-122` - Fetch theme on deck load

**New Endpoint:**
- `app/api/theme/[id]/route.ts` - GET endpoint for saved themes

---

### 4. RetroGrid Theme Compatibility

**Problem:** RetroGrid used hardcoded dark colors, breaking on light themes.

**Solution:** Use CSS variables with fallbacks for dynamic theming.

**Implementation:**
```css
/* Grid lines use accent color */
background: var(--slide-accent, rgba(255,255,255,0.2));

/* Gradient uses background color */
background: linear-gradient(to top, var(--slide-bg, #000) 0%, transparent 80%);
```

**Files Modified:**
- `components/ui/retro-grid.tsx:25-36` - CSS variable integration

---

### 5. Reset to Default Theme

**Problem:** No way to revert to the original dark theme after generating a custom theme.

**Solution:** Added "Reset to Default Theme" button in ThemeCustomizer.

**Implementation:**
- `resetTheme()` function clears theme state and calls DELETE API
- `deleteTheme()` utility removes theme from blob storage
- DELETE endpoint added to `/api/theme/[id]`

**Files Modified:**
- `app/page.tsx:223-239` - `resetTheme()` function
- `lib/blob.ts:277-293` - `deleteTheme()` utility
- `app/api/theme/[id]/route.ts:37-53` - DELETE endpoint
- `components/ThemeCustomizer.tsx:78-81,145-159` - Reset button UI

---

### 6. Editable Theme System Prompt

**Problem:** Users couldn't customize how the AI generates themes - only the description.

**Solution:** Expose the full system prompt in a collapsible editor within ThemeCustomizer.

**Implementation:**
- Created `lib/prompts.ts` with `DEFAULT_THEME_SYSTEM_PROMPT`
- ThemeCustomizer shows collapsible "System Prompt" section
- "Modified" badge when prompt differs from default
- Custom prompts persisted in localStorage and Zustand store
- API accepts `customSystemPrompt` parameter

**Store Changes:**
```typescript
// New state fields
customThemeSystemPrompt: string | null;

// New actions
setCustomThemeSystemPrompt: (prompt: string | null) => void;
```

**Files Modified:**
- `lib/prompts.ts` (new) - Default prompts
- `lib/types.ts:181-183,210-211` - State and action types
- `lib/store.ts:37-38,154-163` - State and actions with localStorage
- `components/ThemeCustomizer.tsx` - Full rewrite with prompt editor
- `app/api/generate-theme/route.ts` - Accept custom system prompt

---

### 7. Editable Slide System Prompt

**Problem:** Users couldn't control how AI generates individual slides in "Generated" mode.

**Solution:** New SlideGeneratorSettings component with system prompt editor.

**Implementation:**
- Created `SlideGeneratorSettings` component with settings icon
- Appears next to Standard/Generated toggle when in Generated mode
- Collapsible prompt editor with reset functionality
- Custom prompts persisted in localStorage and store
- `GeneratedSlide` passes custom prompt to API

**Store Changes:**
```typescript
// New state fields
customSlideSystemPrompt: string | null;

// New actions
setCustomSlideSystemPrompt: (prompt: string | null) => void;
```

**Files Created:**
- `components/SlideGeneratorSettings.tsx` - Settings panel UI
- `lib/prompts.ts` - `DEFAULT_SLIDE_SYSTEM_PROMPT`

**Files Modified:**
- `lib/types.ts:182-183,212-213` - State and action types
- `lib/store.ts:39,164-174` - State and actions
- `components/SlidePreview.tsx:21,202-203` - Import and render settings
- `components/GeneratedSlide.tsx:40,138-144,176` - Pass custom prompt to API
- `app/api/generate-slide/route.ts` - Accept custom system prompt

---

## Architecture Notes

### System Prompt Flow

```
User edits prompt in UI
        ↓
Saved to localStorage (persistence)
        ↓
Saved to Zustand store (runtime state)
        ↓
Passed to API on generation request
        ↓
API uses custom prompt OR falls back to default
```

### Theme System

```
Theme Generator UI
        ↓
POST /api/generate-theme (with optional customSystemPrompt)
        ↓
Claude generates CSS with :root variables
        ↓
CSS saved to blob storage via saveTheme()
        ↓
CSS injected into SlidePreview and Presenter via <style> tag
        ↓
CSS variables override globals.css defaults
```

### Default Theme Variables (globals.css)

```css
:root {
  --slide-bg: #0a0a0a;
  --slide-text: #ededed;
  --slide-accent: #ffffff;
  --slide-muted: #666666;
  --slide-surface: #111111;
}
```

---

## Dependencies Added

```bash
npm install clsx tailwind-merge
```

Required for the `cn()` utility function used in RetroGrid component.

---

## Files Summary

### New Files
- `lib/prompts.ts` - Default system prompts for theme and slide generation
- `components/SlideGeneratorSettings.tsx` - Slide generation settings panel
- `components/ui/retro-grid.tsx` - Animated grid background component
- `app/api/theme/[id]/route.ts` - Theme GET/DELETE endpoints
- `lib/utils.ts` - `cn()` utility for class name merging

### Modified Files
- `lib/types.ts` - Added `isSection`, custom prompt state and actions
- `lib/store.ts` - Custom prompt state management with localStorage
- `lib/parser.ts` - `[section]` marker parsing
- `lib/blob.ts` - `deleteTheme()` function
- `components/ThemeCustomizer.tsx` - Complete rewrite with prompt editor
- `components/SlideRenderer.tsx` - Section slide rendering
- `components/SlidePreview.tsx` - Theme injection, settings button
- `components/GeneratedSlide.tsx` - Custom prompt support
- `components/ImagePlaceholder.tsx` - Background color extraction
- `app/page.tsx` - Theme loading, reset functionality
- `app/api/generate-theme/route.ts` - Custom system prompt support
- `app/api/generate-slide/route.ts` - Custom system prompt support
- `app/api/generate-image/route.ts` - Background color support
- `tailwind.config.js` - RetroGrid animation config
- `../slides.md` - Added `[section]` markers to 6 section headers

---

## Testing Notes

- Build passes: `npm run build` succeeds
- Section slides render with RetroGrid in both preview and presenter modes
- Theme CSS applies in both preview and presenter modes
- Custom prompts persist across page refreshes (localStorage)
- Reset to default clears both theme and custom prompts
