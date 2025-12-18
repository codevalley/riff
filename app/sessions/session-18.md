# Session 18 - DeckSmith Pipeline & Multi-Stage Progress UI

## Date: 2025-12-18

## Summary
Major overhaul of deck generation system:
1. Replaced single-pass LLM with DeckSmith prompt architecture
2. Split monolithic API into discrete stage-based endpoints
3. Implemented real-time multi-stage progress UI with tips carousel
4. Added premium model support for deck generation (2 credits)

## Problem Statement
- Previous single-pass LLM approach had quality issues
- No visual feedback during long generation times (up to 1 min)
- Template matching and overflow prevention were unreliable
- Users couldn't tell if generation was working or hung

## Solution: DeckSmith Architecture

### New Prompt System
Created deterministic slide-writer prompt with three injected inputs:

```typescript
DECKSMITH_SYSTEM_PROMPT  // Main system prompt
MARKDOWN_SYNTAX_SPEC     // Clean syntax reference
REFERENCE_DECK_TEMPLATE  // Sample deck as style guide (from sample-deck.md)
DECK_METADATA_PROMPT     // For title/theme extraction
```

Key principles:
- Atomic slides (one idea per slide)
- Strict density constraints
- Style inference from reference template
- Forbidden patterns (no [glow] on titles, no overcrowded slides)

### New API Architecture

| API | Purpose | Model | Credits |
|-----|---------|-------|---------|
| `/api/generate-deck` | DeckSmith deck generation | `AI_DECK_MODEL` (premium) | 2 |
| `/api/generate-deck-metadata` | Extract title + themePrompt | `AI_GATEWAY_MODEL` | 0 |
| `/api/generate-theme` | CSS from prompt (existing) | `AI_GATEWAY_MODEL` | 0.2 |
| `/api/save-deck` | Save deck + theme to DB | - | 0 |

### Environment Variables
```bash
AI_DECK_MODEL=openai/gpt-4.5-preview      # Premium for deck gen
AI_GATEWAY_MODEL=groq/llama-3.3-70b-versatile  # Standard for rest
```

### Multi-Stage Progress UI

**Horizontal 4-stage stepper with weighted spacing:**
```
(●)═══════════════(○)════(○)════(○)
DeckSmith (3x)    Packaging  Theming  Finish
       ═══▶ animated pulse travels along the line
```

**Features:**
- Real stage transitions (API-driven, not simulated)
- Animated progress pulse shows activity during long stages
- Stage weights: DeckSmith=3, Packaging=1, Theming=1, Saving=0.5
- Rotating status messages per stage
- Tips carousel above progress showing Riff features

**Tips Carousel:**
- AI Images: `[image: description]` auto-generation
- Custom Themes: Describe any style
- One-Click Publish: Share with a link
- Markdown Native: Export anytime

## Files Changed

### New Files
- `app/api/generate-deck/route.ts` - DeckSmith deck generation
- `app/api/generate-deck-metadata/route.ts` - Title/theme extraction
- `app/api/save-deck/route.ts` - Database persistence

### Modified Files
- `lib/prompts.ts` - Added DeckSmith prompts (DECKSMITH_SYSTEM_PROMPT, MARKDOWN_SYNTAX_SPEC, REFERENCE_DECK_TEMPLATE, DECK_METADATA_PROMPT)
- `lib/credits-config.ts` - DOCUMENT_CONVERSION: 1 → 2 credits
- `app/api/convert-document/route.ts` - Updated to use DeckSmith (legacy endpoint)
- `components/DocumentUploader.tsx` - Complete rewrite with multi-stage UI
- `app/docs/page.tsx` - Updated pricing (2.2 credits for import)
- `app/philosophy/page.tsx` - Updated date

### Removed Files
- `lib/reformatter.ts` - Failed procedural approach
- `lib/reformatter.test.ts` - Test file for reformatter

## UI/UX Improvements

1. **Fixed carousel card height** - No more jumping when tips rotate
2. **Removed Riff icon during generation** - Only shows in success state
3. **Animated progress line** - Visual feedback that generation is working
4. **Weighted stage spacing** - DeckSmith stage visually wider (takes longer)

## Credit Pricing Update

| Action | Old | New |
|--------|-----|-----|
| Import document | 1.2 credits | 2.2 credits |
| (Deck generation) | (1 credit) | (2 credits) |
| (Auto-theme) | (0.2 credits) | (0.2 credits) |

## Client Flow
```
1. POST /api/generate-deck       → markdown
   [UI: ✓ DeckSmith complete]

2. POST /api/generate-deck-metadata → { title, themePrompt }
   [UI: ✓ Packaging complete]

3. POST /api/generate-theme      → css
   [UI: ✓ Theming complete]

4. POST /api/save-deck           → { deck }
   [UI: Success with Riff icon + checkmark]
```

## Technical Notes

- Stage transitions are real (API-driven), not time-simulated
- DeckSmith outputs in ```text``` code block, extracted via regex
- Metadata extraction uses first 3000 chars of deck
- Theme generation is optional (continues if it fails)
- Premium model fallback chain: AI_DECK_MODEL → AI_GATEWAY_MODEL → kimi-k2
