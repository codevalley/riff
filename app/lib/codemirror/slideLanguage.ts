// ============================================
// Slide Language - Custom syntax highlighting for slide markdown
// Extends markdown with slide-specific tokens
// ============================================

import { markdown, markdownLanguage } from '@codemirror/lang-markdown';
import { Extension, RangeSet } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
  MatchDecorator,
} from '@codemirror/view';

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
 * Match decorator for slide delimiters (---)
 * Must be on its own line
 */
const slideDelimiterMatcher = new MatchDecorator({
  regexp: /^---$/gm,
  decoration: slideDelimiterDeco,
});

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
          slideDelimiterMatcher,
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

        // Create decoration sets from each matcher and join them
        const sets = matchers.map((matcher) => matcher.createDeco(view));
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
 */
export const slideDecorationStyles = EditorView.baseTheme({
  // Slide delimiter --- (amber, bold, full-width highlight)
  '.cm-slide-delimiter': {
    color: '#f59e0b',
    fontWeight: 'bold',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    display: 'inline-block',
    width: '100%',
    borderRadius: '2px',
  },

  // Pause marker **pause** (rose)
  '.cm-pause-marker': {
    color: '#f43f5e',
    fontStyle: 'italic',
    backgroundColor: 'rgba(244, 63, 94, 0.1)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Image placeholder [image: ...] (emerald)
  '.cm-image-marker': {
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Layout markers [section], [grid], alignment (cyan)
  '.cm-layout-marker': {
    color: '#06b6d4',
    backgroundColor: 'rgba(6, 182, 212, 0.1)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Text effects [anvil], [typewriter], etc. (rose)
  '.cm-effect-marker': {
    color: '#f43f5e',
    backgroundColor: 'rgba(244, 63, 94, 0.08)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Background markers [bg:...] (violet)
  '.cm-bg-marker': {
    color: '#8b5cf6',
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Footer syntax $<...> (gray, italic)
  '.cm-footer-marker': {
    color: '#666666',
    fontStyle: 'italic',
    backgroundColor: 'rgba(102, 102, 102, 0.1)',
    borderRadius: '2px',
    padding: '0 2px',
  },

  // Speaker notes > ... (dim, italic)
  '.cm-speaker-note': {
    color: '#444444',
    fontStyle: 'italic',
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
