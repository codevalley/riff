# Deck Editor V2: Layout System & Features

> Simplified layout system with alignment markers, grid cards, and text effects

## Overview

This document covers Riff's v2 deck creation format:

- **Alignment System** - Simple `[horizontal, vertical]` markers
- **Image Positioning** - Split layouts with `[image: desc, position]`
- **Grid Cards** - Card layouts with icons and progressive reveals
- **Text Effects** - Animations like `[anvil]`, `[typewriter]`, `[glow]`
- **Background Effects** - `[bg:type-position-color]` decorative patterns

---

## Alignment System

### Syntax

Place alignment markers at the start of any slide:

```markdown
[left, top]

# Left-aligned Title

### Content flows from top-left
```

### Options

| Horizontal | Vertical | Use For |
|------------|----------|---------|
| `left` | `top` | Content-heavy slides |
| `center` | `center` | Impact statements (default) |
| `right` | `center` | Alternative visual balance |
| `left` | `center` | Balanced left-aligned |
| `center` | `top` | Lists and grids |

### Examples

```markdown
[center, center]
[bg:glow-center]

# The Future is Now [anvil]

---

[left, top]

# Key Metrics

- Revenue: +45%
- Users: 2.3M
- NPS: 72

---

[center, top]

# Our Values

[grid]
- [icon: heart]
  ## Care
  We put people first
- [icon: zap]
  ## Speed
  Ship fast, learn faster
- [icon: shield]
  ## Trust
  Security by design
```

---

## Image Positioning

### Syntax

```markdown
[image: description, position]
```

### Positions

| Position | Layout | Aspect |
|----------|--------|--------|
| (none) | Inline in content stack | 16:9 |
| `left` | 30% image left, 70% content right | Portrait |
| `right` | 70% content left, 30% image right | Portrait |
| `top` | 70% image top, 30% content bottom | Landscape |
| `bottom` | 30% content top, 70% image bottom | Landscape |

### Examples

```markdown
[left, center]

# How AI Works

### Machine learning enables systems to learn from data patterns

[image: Neural network diagram with glowing nodes, right]

---

[image: Team collaborating in modern office, top]

# Our Team

### Building the future together
```

---

## Grid Cards

Grid cards create horizontal card layouts for features, benefits, or comparisons.

### Syntax

```markdown
[grid]
- [icon: name]
  ## Heading
  Body text
- [icon: name]
  ## Heading
  Body text
```

### Grid Item Structure

Each bullet (`-`) starts a new card. Within a card:
- `[icon: name]` - Lucide icon (optional)
- `[image: desc]` - Small image (optional)
- `## Heading` - Card title
- `### Subheading` - Secondary text
- Plain text - Body content

### Progressive Reveals

Use `**pause**` between grid items for step-by-step reveals:

```markdown
[grid]
- [icon: search]
  ## Discover
  Find the perfect solution

**pause**

- [icon: code]
  ## Build
  Create with confidence

**pause**

- [icon: rocket]
  ## Launch
  Ship to production
```

### Icon Names

Icons use [Lucide](https://lucide.dev/icons) names (kebab-case):
- `rocket`, `zap`, `star`, `heart`, `check-circle`
- `alert-triangle`, `info`, `lightbulb`, `bookmark`
- `arrow-right`, `chevron-down`, `external-link`
- `user`, `users`, `settings`, `search`, `home`
- `shield`, `lock`, `key`, `database`, `cloud`

---

## Text Effects

Apply animation effects to titles by appending effect markers.

### Available Effects

| Effect | Syntax | Description |
|--------|--------|-------------|
| Anvil | `# Title [anvil]` | Drops from above with bounce |
| Typewriter | `# Title [typewriter]` | Characters appear sequentially |
| Glow | `# Title [glow]` | Pulsing glow animation |
| Shake | `# Title [shake]` | Quick attention shake |

### Examples

```markdown
[center, center]
[bg:glow-center]

# Welcome to Riff [anvil]

---

[center, center]

# The results are in... [typewriter]

---

[center, center]

# Important Update [glow]

---

# Don't miss this! [shake]
```

---

## Background Effects

Add decorative background patterns to slides.

### Syntax

```markdown
[bg:type-position-color]
```

### Types

| Type | Description |
|------|-------------|
| `glow` | Radial gradient glow |
| `grid` | Orthogonal grid lines |
| `hatch` | Diagonal cross-hatch |
| `dashed` | Dashed grid pattern |

### Positions

- `center` - Centered in slide
- `top-left`, `top-right` - Corner positions
- `bottom-left`, `bottom-right` - Corner positions

### Colors

| Color | Preview |
|-------|---------|
| `accent` | Theme accent color (default) |
| `amber` | Warm orange |
| `blue` | Cool blue |
| `purple` | Deep purple |
| `rose` | Pink/rose |
| `emerald` | Green |
| `cyan` | Teal/cyan |
| `orange` | Bright orange |
| `pink` | Light pink |

### Examples

```markdown
[bg:glow-center]

# Main Title

---

[bg:grid-top-right-blue]

# Technical Overview

---

[bg:hatch-bottom-left-amber]

# Key Takeaway
```

---

## Additional Features

### Section Headers

Mark important section transitions:

```markdown
[section]

# Part 2: Implementation
```

Section slides use special styling (larger text, centered).

### Speaker Notes

Hidden notes only visible in presenter mode:

```markdown
# Sales Pitch

### Our solution saves 40% on costs

> Remember to pause here for questions
> Mention the case study from Acme Corp
```

### Highlighted Text

Use backticks for accent-colored emphasis:

```markdown
Our product delivers `3x faster` results
```

### Footers

Add slide footers with `$<text>`:

```markdown
# Company Overview

Content here...

$<Confidential - Internal Use Only>
```

### Spacers

Add vertical spacing with `[space:n]`:

```markdown
# Title

[space:2]

### Subtitle with extra spacing above
```

---

## Legacy Deck Detection

Riff automatically detects legacy decks (pre-v2 format) and offers an upgrade option. Legacy decks are identified by the absence of v2 markers like:

- Alignment: `[left, top]`, `[center, center]`
- Grid: `[grid]`
- Background: `[bg:]`
- Effects: `[anvil]`, `[typewriter]`, `[glow]`, `[shake]`
- Icons: `[icon:]`
- Positioned images: `[image: desc, left]`

When a legacy deck is detected, the Revamp button shows a pulsing indicator and the dialog offers an "Upgrade to v2" option.

---

## File References

| File | Purpose |
|------|---------|
| `lib/types.ts` | Type definitions for all elements |
| `lib/parser.ts` | Markdown parsing and `isLegacyDeck()` |
| `lib/prompts.ts` | AI prompts for generation/revamp |
| `components/SlideRenderer.tsx` | Slide rendering with all features |
| `components/FormatHelpDialog.tsx` | In-app syntax handbook |
| `components/RevampDeckDialog.tsx` | Deck upgrade/revamp UI |

---

## Example Complete Deck

```markdown
[center, center]
[bg:glow-center]

# Building Products People Love [anvil]

> Welcome everyone to this presentation

---

[center, center]

# What We'll Cover

**pause**

- Understanding `user needs`

**pause**

- Designing `delightful experiences`

**pause**

- Measuring `real impact`

---

[center, center]
[bg:grid-center]

# Part 1: Discovery [typewriter]

---

[left, center]

# The Research Process

### Start with empathy, end with insights

[image: User interview session with sticky notes, right]

---

[center, top]

# Our Approach

[grid]
- [icon: users]
  ## Listen
  Deep user interviews

**pause**

- [icon: search]
  ## Analyze
  Pattern recognition

**pause**

- [icon: lightbulb]
  ## Synthesize
  Actionable insights

---

[center, center]
[bg:hatch-bottom-right-amber]

# Key Insight [glow]

### Users don't want more features
### They want fewer problems

---

[center, center]

# Questions?

$<Q2 2024 Product Strategy>
```
