# Session 25: CodeMirror 6 Editor with Syntax Highlighting & Slash Commands

## Date: 2025-12-21

## Summary

Replaced the plain `<textarea>` in SlideEditor with CodeMirror 6, providing:
1. **Syntax highlighting** - Markdown + custom slide tokens (---,  **pause**, [image:], etc.)
2. **Current slide highlighting** - Amber background tint on active slide
3. **Slash commands** - Type `/` for autocomplete (26 commands across 5 categories)
4. **Bidirectional sync** - Preview ↔ Editor navigation stays in sync

Key challenges solved:
- SSR-safe dynamic import with `next/dynamic`
- Ref forwarding limitation with `onCreateEditor` callback
- First-click highlight delay (added `focusChanged` to update triggers)
- Cursor movement on external navigation (dispatch both `selection` and `scrollIntoView`)

---

## Part 1: Architecture Overview

### Technology Choice

| Aspect | Value |
|--------|-------|
| Library | `@uiw/react-codemirror` + CodeMirror 6 packages |
| Bundle | ~125KB gzipped (acceptable for rich editor) |
| Approach | Code editor with visible markdown |
| SSR | Dynamic import with `ssr: false` |

### File Structure

```
lib/codemirror/
├── index.ts                  # Barrel export
├── theme.ts                  # Dark theme matching app
├── slideLanguage.ts          # Custom token highlighting
├── slashCommands.ts          # / command autocomplete
└── currentSlideHighlight.ts  # Background decoration + scroll

components/
├── CodeMirrorEditor.tsx      # SSR-safe wrapper (dynamic import)
└── SlideEditor.tsx           # Modified to use CodeMirror
```

---

## Part 2: Custom Theme (`lib/codemirror/theme.ts`)

Matches app colors from `globals.css`:

```typescript
const slideEditorTheme = EditorView.theme({
  '&': {
    backgroundColor: '#0a0a0a',
    color: '#ededed',
  },
  '.cm-cursor': {
    borderLeftColor: '#f59e0b', // Amber cursor
  },
  '.cm-selectionBackground': {
    backgroundColor: 'rgba(255, 255, 255, 0.15) !important',
  },
  // ... gutter, line numbers, etc.
});
```

### Token Colors

| Token | Color | Regex |
|-------|-------|-------|
| `---` slide delimiter | Amber `#f59e0b`, bold | `^---$` |
| `**pause**` | Rose `#f43f5e` | `\*\*pause\*\*` |
| `[image: ...]` | Emerald `#10b981` | `\[image:.*?\]` |
| `[section]`, `[grid]` | Cyan `#06b6d4` | `\[section\]`, `\[grid\]` |
| `[bg:...]` backgrounds | Violet `#8b5cf6` | `\[bg:.*?\]` |
| `[anvil]`, `[glow]` effects | Rose `#fb7185` | `\[anvil\]`, etc. |
| `$<footer>` | Amber `#fbbf24` | `\$<.*?>` |

---

## Part 3: Slide Language Decorations (`lib/codemirror/slideLanguage.ts`)

ViewPlugin-based decorations that parse document and apply styles:

```typescript
const createSlideDecorationPlugin = ViewPlugin.fromClass(
  class {
    decorations: DecorationSet;

    constructor(view: EditorView) {
      this.decorations = this.buildDecorations(view);
    }

    update(update: ViewUpdate) {
      if (update.docChanged || update.viewportChanged) {
        this.decorations = this.buildDecorations(update.view);
      }
    }

    buildDecorations(view: EditorView): DecorationSet {
      // Apply regex patterns to visible lines
      // Return RangeSet of mark decorations
    }
  }
);
```

### Pattern Matching

Uses regex to find tokens and apply `Decoration.mark()` with CSS classes:

```typescript
const patterns = [
  { pattern: /^---$/gm, class: 'cm-slide-delimiter' },
  { pattern: /\*\*pause\*\*/g, class: 'cm-pause' },
  { pattern: /\[image:[^\]]*\]/g, class: 'cm-image-placeholder' },
  // ... more patterns
];
```

---

## Part 4: Slash Commands (`lib/codemirror/slashCommands.ts`)

Type `/` to trigger autocomplete with 26 commands:

### Categories

| Category | Badge | Commands |
|----------|-------|----------|
| Content | `•` | `/pause`, `/code`, `/quote`, `/slide`, `/highlight` |
| Layout | `▢` | `/section`, `/grid`, `/space`, `/footer`, `/align-*` |
| Image | `◐` | `/image`, `/image-left`, `/image-right`, `/image-top`, `/image-bottom`, `/icon` |
| Effect | `✦` | `/anvil`, `/typewriter`, `/glow`, `/shake` |
| Background | `▤` | `/bg-glow`, `/bg-grid`, `/bg-retrogrid`, `/bg-hatch`, `/bg-dots`, `/bg-noise` |

### Implementation

```typescript
function slashCommandCompletion(context: CompletionContext): CompletionResult | null {
  const word = context.matchBefore(/\/[\w-]*/);
  if (!word) return null;

  const query = word.text.toLowerCase();
  const matches = SLASH_COMMANDS.filter(cmd =>
    cmd.label.toLowerCase().startsWith(query)
  );

  return {
    from: word.from,
    options: matches.map(cmd => ({
      label: cmd.label,
      detail: cmd.detail,
      type: cmd.category,
      apply: (view, _completion, from, to) => {
        view.dispatch({
          changes: { from, to, insert: cmd.template },
          selection: { anchor: from + cmd.template.length - (cmd.cursorOffset ?? 0) },
        });
      },
    })),
    filter: false,
  };
}
```

### Custom Styling

Dropdown uses category-based colors:
- Badge icons with colored backgrounds
- Label colors matching category

---

## Part 5: Current Slide Highlight (`lib/codemirror/currentSlideHighlight.ts`)

ViewPlugin that:
1. Tracks cursor position
2. Calculates which slide cursor is in
3. Applies amber background tint to current slide lines
4. Calls `onSlideChange` callback for store sync

```typescript
const currentSlideMark = Decoration.line({ class: 'cm-current-slide' });

// CSS
'.cm-current-slide': {
  backgroundColor: 'rgba(245, 158, 11, 0.08)',
  borderLeft: '2px solid rgba(245, 158, 11, 0.4)',
}
```

### Bidirectional Sync

Two directions of sync:
1. **Cursor → Preview**: ViewPlugin detects slide change, calls `onSlideChange`
2. **Preview → Editor**: `scrollToSlide()` function moves cursor AND scrolls

Key fix for first-click responsiveness:
```typescript
update(update: ViewUpdate) {
  // Added focusChanged for immediate response on first click
  if (update.selectionSet || update.docChanged || update.focusChanged) {
    // ... update logic
  }
}
```

---

## Part 6: SSR-Safe Wrapper (`components/CodeMirrorEditor.tsx`)

Dynamic import with SSR disabled:

```typescript
const ReactCodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then(mod => mod.default),
  {
    ssr: false,
    loading: () => <LoadingSkeleton />,
  }
);
```

### Ref Forwarding Problem

**Problem**: `next/dynamic` returns `LoadableComponent` which doesn't forward refs.

**Solution**: Use `onCreateEditor` callback instead of ref:

```typescript
// Store EditorView in state (not ref)
const [editorView, setEditorView] = useState<EditorView | null>(null);

// Capture via callback
const handleCreateEditor = useCallback((view: EditorView) => {
  setEditorView(view);
}, []);

// Use in JSX
<ReactCodeMirror
  onCreateEditor={handleCreateEditor}
  // ...
/>
```

### External Navigation

When user clicks slide thumbnail, editor scrolls to that slide:

```typescript
useEffect(() => {
  if (currentSlide !== undefined && editorView) {
    isExternalScroll.current = true;
    scrollToSlide(editorView, currentSlide);
    setTimeout(() => {
      isExternalScroll.current = false;
    }, 100);
  }
}, [currentSlide, editorView]);
```

---

## Part 7: SlideEditor Integration

Replaced `<textarea>` with `<CodeMirrorEditor>`:

```tsx
<CodeMirrorEditor
  value={localContent}
  onChange={handleChange}
  onSlideChange={handleSlideChange}
  currentSlide={presentation.currentSlide}
  onSave={handleSave}
/>
```

### Simplified State Management

Removed complex `isEditorDriven` ref logic - now `CodeMirrorEditor` handles loop prevention internally with `isExternalScroll` and `lastScrolledSlide` refs.

---

## Files Summary

### New Files Created

| File | Purpose |
|------|---------|
| `lib/codemirror/index.ts` | Barrel export |
| `lib/codemirror/theme.ts` | Dark theme (125 lines) |
| `lib/codemirror/slideLanguage.ts` | Syntax decorations (180 lines) |
| `lib/codemirror/slashCommands.ts` | / autocomplete (365 lines) |
| `lib/codemirror/currentSlideHighlight.ts` | Slide tracking (190 lines) |
| `components/CodeMirrorEditor.tsx` | SSR wrapper (215 lines) |

### Modified Files

| File | Changes |
|------|---------|
| `package.json` | Added 7 CodeMirror dependencies |
| `components/SlideEditor.tsx` | Replaced textarea with CodeMirror |

---

## Dependencies Added

```json
{
  "@codemirror/autocomplete": "^6.20.0",
  "@codemirror/commands": "^6.10.1",
  "@codemirror/lang-markdown": "^6.5.0",
  "@codemirror/language": "^6.11.3",
  "@codemirror/state": "^6.5.2",
  "@codemirror/view": "^6.39.4",
  "@uiw/react-codemirror": "^4.25.4"
}
```

---

## Key Insights

1. **Dynamic Import Refs**: `next/dynamic` wraps components in `LoadableComponent` which doesn't forward refs. Always use callback props like `onCreateEditor` for dynamically imported editor components.

2. **ViewUpdate Flags**: CodeMirror's `ViewUpdate` has boolean flags (`selectionSet`, `docChanged`, `focusChanged`, `viewportChanged`) to know exactly what changed. Using the right combination prevents missed updates.

3. **Dispatch Batching**: Combine `selection` and `effects` in a single `dispatch()` for atomic state updates when scrolling + moving cursor.

4. **Decoration vs Syntax Highlighting**: For custom tokens not in the base grammar, ViewPlugin-based decorations with regex matching is simpler than extending the language parser.

5. **Autocomplete UX**: Setting `filter: false` in CompletionResult lets you handle filtering yourself, useful when matching `/` prefix patterns.

---

## Status

### Complete
- [x] Custom dark theme matching app
- [x] Slide syntax highlighting (---, **pause**, [image:], etc.)
- [x] Current slide amber highlight
- [x] 26 slash commands with category badges
- [x] SSR-safe dynamic import
- [x] Bidirectional editor ↔ preview sync
- [x] Keyboard shortcuts (Cmd+S save)
- [x] Line wrapping and history (undo/redo)

### UX Improvements
- [x] Fixed white background flash (proper theme)
- [x] Fixed first-click highlight delay
- [x] Fixed preview→editor sync
- [x] Unicode badges instead of emojis in autocomplete
