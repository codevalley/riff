// ============================================
// Slide Language - Custom syntax highlighting for slide markdown
// Extends markdown with slide-specific tokens
// ============================================

import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { Extension, RangeSet, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
  WidgetType,
} from '@codemirror/view';

/**
 * Widget that displays a slide number badge after ---
 */
class SlideNumberWidget extends WidgetType {
  constructor(readonly slideNumber: number) {
    super();
  }

  toDOM(): HTMLElement {
    const span = document.createElement('span');
    span.className = 'cm-slide-number-badge';
    span.textContent = `slide ${this.slideNumber}`;
    span.setAttribute('aria-label', `End of slide ${this.slideNumber}`);
    return span;
  }

  eq(other: SlideNumberWidget): boolean {
    return this.slideNumber === other.slideNumber;
  }
}

// Custom decoration styles
const slideDelimiterDeco = Decoration.mark({ class: 'cm-slide-delimiter' });
const pauseMarkerDeco = Decoration.mark({ class: 'cm-pause-marker' });
const imageMarkerDeco = Decoration.mark({ class: 'cm-image-marker' });
const layoutMarkerDeco = Decoration.mark({ class: 'cm-layout-marker' });
const effectMarkerDeco = Decoration.mark({ class: 'cm-effect-marker' });
const footerMarkerDeco = Decoration.mark({ class: 'cm-footer-marker' });
const speakerNoteDeco = Decoration.mark({ class: 'cm-speaker-note' });
const bgMarkerDeco = Decoration.mark({ class: 'cm-bg-marker' });

/**
 * Build slide delimiter decorations with number badges
 * Each --- gets both a mark decoration and a widget showing the slide number
 */
function buildSlideDelimiterDecorations(view: EditorView): DecorationSet {
  const builder = new RangeSetBuilder<Decoration>();
  const content = view.state.doc.toString();
  const lines = content.split('\n');

  let slideNumber = 1;
  let charPos = 0;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.trim() === '---') {
      const lineStart = charPos;
      const lineEnd = charPos + line.length;

      // Add mark decoration for the --- text
      builder.add(lineStart, lineEnd, slideDelimiterDeco);

      // Add widget decoration after the ---
      const widget = Decoration.widget({
        widget: new SlideNumberWidget(slideNumber),
        side: 1, // After the text
      });
      builder.add(lineEnd, lineEnd, widget);

      slideNumber++;
    }
    charPos += line.length + 1; // +1 for newline
  }

  return builder.finish();
}

/**
 * Match decorator for pause markers (**pause**)
 */
const pauseMarkerMatcher = new MatchDecorator({
  regexp: /\*\*pause\*\*/g,
  decoration: pauseMarkerDeco,
});

/**
 * Match decorator for image placeholders [image: ...]
 */
const imageMarkerMatcher = new MatchDecorator({
  regexp: /\[image:\s*[^\]]+\]/g,
  decoration: imageMarkerDeco,
});

/**
 * Match decorator for layout markers [section], [grid], [left, top], etc.
 */
const layoutMarkerMatcher = new MatchDecorator({
  regexp: /\[(section|grid|left|right|center|top|bottom)(?:,\s*(?:left|right|center|top|bottom))?\]/g,
  decoration: layoutMarkerDeco,
});

/**
 * Match decorator for text effects [anvil], [typewriter], [glow], [shake]
 */
const effectMarkerMatcher = new MatchDecorator({
  regexp: /\[(anvil|typewriter|glow|shake)\]/g,
  decoration: effectMarkerDeco,
});

/**
 * Match decorator for background markers [bg:...]
 */
const bgMarkerMatcher = new MatchDecorator({
  regexp: /\[bg:[^\]]+\]/g,
  decoration: bgMarkerDeco,
});

/**
 * Match decorator for footer syntax $<...>
 */
const footerMarkerMatcher = new MatchDecorator({
  regexp: /\$<[^>]+>/g,
  decoration: footerMarkerDeco,
});

/**
 * Match decorator for space markers [space:n]
 */
const spaceMarkerMatcher = new MatchDecorator({
  regexp: /\[space:\d+\]/g,
  decoration: layoutMarkerDeco,
});

/**
 * Match decorator for speaker notes (lines starting with >)
 */
const speakerNoteMatcher = new MatchDecorator({
  regexp: /^>\s.*$/gm,
  decoration: speakerNoteDeco,
});

/**
 * Match decorator for icon syntax [icon: name]
 */
const iconMarkerMatcher = new MatchDecorator({
  regexp: /\[icon:\s*[^\]]+\]/g,
  decoration: layoutMarkerDeco,
});

/**
 * ViewPlugin that applies all custom decorations
 */
function createSlideDecorationPlugin(): Extension {
  return ViewPlugin.fromClass(
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
        // Combine all matchers - use RangeSet.join to merge decoration sets
        const matchers = [
          pauseMarkerMatcher,
          imageMarkerMatcher,
          layoutMarkerMatcher,
          effectMarkerMatcher,
          bgMarkerMatcher,
          footerMarkerMatcher,
          spaceMarkerMatcher,
          speakerNoteMatcher,
          iconMarkerMatcher,
        ];

        // Create decoration sets from each matcher
        const sets = matchers.map((matcher) => matcher.createDeco(view));

        // Add slide delimiter decorations with number badges
        sets.push(buildSlideDelimiterDecorations(view));

        return RangeSet.join(sets);
      }
    },
    {
      decorations: (v) => v.decorations,
    }
  );
}

/**
 * CSS styles for custom decorations
 * Using higher specificity to override markdown's default link styling
 */
export const slideDecorationStyles = EditorView.baseTheme({
  // Slide delimiter --- (amber, bold, full-width highlight)
  '.cm-slide-delimiter': {
    color: '#f59e0b !important',
    fontWeight: 'bold',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    textDecoration: 'none !important',
    display: 'inline-block',
    borderRadius: '2px',
  },

  // Slide number badge after ---
  '.cm-slide-number-badge': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: '8px',
    padding: '0 6px',
    height: '18px',
    fontSize: '11px',
    fontWeight: '500',
    fontFamily: 'system-ui, sans-serif',
    color: 'rgba(245, 158, 11, 0.7)',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderRadius: '9px',
    verticalAlign: 'middle',
  },

  // Pause marker **pause** (rose)
  '.cm-pause-marker': {
    color: '#f43f5e !important',
    fontStyle: 'italic',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    textDecoration: 'none !important',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Image placeholder [image: ...] (muted green, subtle)
  '.cm-image-marker': {
    color: 'rgba(16, 185, 129, 0.7) !important',
    backgroundColor: 'rgba(16, 185, 129, 0.08)',
    textDecoration: 'none !important',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.95em',
  },

  // Layout markers [section], [grid], [space:n], [left, center] etc. (muted, subtle)
  '.cm-layout-marker': {
    color: 'rgba(161, 161, 170, 0.6) !important',
    backgroundColor: 'rgba(161, 161, 170, 0.08)',
    textDecoration: 'none !important',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.9em',
  },

  // Text effects [anvil], [typewriter], etc. (muted rose)
  '.cm-effect-marker': {
    color: 'rgba(244, 63, 94, 0.6) !important',
    backgroundColor: 'rgba(244, 63, 94, 0.06)',
    textDecoration: 'none !important',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.9em',
  },

  // Background markers [bg:...] (muted violet)
  '.cm-bg-marker': {
    color: 'rgba(139, 92, 246, 0.6) !important',
    backgroundColor: 'rgba(139, 92, 246, 0.08)',
    textDecoration: 'none !important',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.9em',
  },

  // Footer syntax $<...> (gray, italic)
  '.cm-footer-marker': {
    color: '#555555 !important',
    fontStyle: 'italic',
    backgroundColor: 'rgba(102, 102, 102, 0.08)',
    textDecoration: 'none !important',
    borderRadius: '3px',
    padding: '1px 4px',
    fontSize: '0.9em',
  },

  // Speaker notes > ... (dim, italic)
  '.cm-speaker-note': {
    color: '#444444 !important',
    fontStyle: 'italic',
    textDecoration: 'none !important',
    opacity: '0.7',
  },
});

/**
 * Complete slide language extension
 * Combines markdown base with custom decorations
 */
export const slideLanguage: Extension = [
  markdown({ base: markdownLanguage }),
  createSlideDecorationPlugin(),
  slideDecorationStyles,
];

/**
 * Export individual extensions for testing
 */
export { createSlideDecorationPlugin };
