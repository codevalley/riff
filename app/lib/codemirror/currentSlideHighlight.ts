// ============================================
// Current Slide Highlight - Background tint on active slide
// ============================================

import { Extension, RangeSetBuilder } from '@codemirror/state';
import {
  Decoration,
  DecorationSet,
  EditorView,
  ViewPlugin,
  ViewUpdate,
} from '@codemirror/view';

/**
 * Line decoration for current slide background
 */
const currentSlideMark = Decoration.line({ class: 'cm-current-slide' });

/**
 * Find which slide the cursor is in based on character position
 * Port of existing logic from SlideEditor.tsx
 */
function getSlideFromPosition(content: string, cursorPos: number): number {
  const textBefore = content.substring(0, cursorPos);
  const separators = textBefore.match(/^---$/gm);
  return separators ? separators.length : 0;
}

/**
 * Get line ranges for each slide
 * Returns array of { startLine, endLine } for each slide
 */
function getSlideLineRanges(
  doc: { toString: () => string; lineAt: (pos: number) => { number: number }; lines: number }
): Array<{ startLine: number; endLine: number }> {
  const content = doc.toString();
  const lines = content.split('\n');
  const ranges: Array<{ startLine: number; endLine: number }> = [];

  let currentStart = 1; // CodeMirror lines are 1-indexed

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      // End the current slide
      ranges.push({
        startLine: currentStart,
        endLine: i + 1, // Include the --- line in previous slide
      });
      currentStart = i + 2; // Start next slide after ---
    }
  }

  // Add the last slide (from last --- to end)
  if (currentStart <= doc.lines) {
    ranges.push({
      startLine: currentStart,
      endLine: doc.lines,
    });
  }

  return ranges;
}

/**
 * Create a ViewPlugin that:
 * 1. Tracks cursor position
 * 2. Calculates current slide
 * 3. Applies background decoration
 * 4. Calls callback when slide changes
 */
export function createCurrentSlideHighlight(
  onSlideChange?: (slideIndex: number, totalSlides: number) => void
): Extension {
  return [
    ViewPlugin.fromClass(
      class {
        decorations: DecorationSet;
        currentSlide: number = 0;

        constructor(view: EditorView) {
          this.decorations = this.buildDecorations(view);
        }

        update(update: ViewUpdate) {
          // Check if selection changed, document changed, or focus changed
          // Focus change is important for first-click responsiveness
          if (update.selectionSet || update.docChanged || update.focusChanged) {
            const content = update.view.state.doc.toString();
            const cursorPos = update.view.state.selection.main.head;
            const newSlide = getSlideFromPosition(content, cursorPos);

            // Get total slides for callback
            const ranges = getSlideLineRanges(update.view.state.doc);
            const totalSlides = ranges.length;

            // Clamp to valid range
            const clampedSlide = Math.max(0, Math.min(newSlide, totalSlides - 1));

            if (clampedSlide !== this.currentSlide) {
              this.currentSlide = clampedSlide;

              // Call external callback (deferred to avoid nested updates)
              if (onSlideChange) {
                queueMicrotask(() => onSlideChange(clampedSlide, totalSlides));
              }
            }

            // Rebuild decorations
            this.decorations = this.buildDecorations(update.view);
          }
        }

        buildDecorations(view: EditorView): DecorationSet {
          const builder = new RangeSetBuilder<Decoration>();
          const ranges = getSlideLineRanges(view.state.doc);
          const currentRange = ranges[this.currentSlide];

          if (currentRange) {
            // Apply decoration to each line in the current slide
            for (let lineNum = currentRange.startLine; lineNum <= currentRange.endLine; lineNum++) {
              try {
                const line = view.state.doc.line(lineNum);
                builder.add(line.from, line.from, currentSlideMark);
              } catch {
                // Line might not exist, skip
              }
            }
          }

          return builder.finish();
        }
      },
      {
        decorations: (v) => v.decorations,
      }
    ),
    // CSS for current slide background - more visible highlight
    EditorView.baseTheme({
      '.cm-current-slide': {
        backgroundColor: 'rgba(245, 158, 11, 0.08)', // Amber tint matching slide delimiter
        borderLeft: '2px solid rgba(245, 158, 11, 0.4)',
      },
    }),
  ];
}

/**
 * Utility to scroll editor to a specific slide and move cursor there
 */
export function scrollToSlide(view: EditorView, slideIndex: number): void {
  const content = view.state.doc.toString();
  const lines = content.split('\n');

  let separatorCount = 0;
  let charPos = 0;

  // Find the position of the target slide
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() === '---') {
      separatorCount++;
      if (separatorCount === slideIndex) {
        // Found the start of the target slide (after this ---)
        charPos += lines[i].length + 1; // Include newline
        break;
      }
    }
    charPos += lines[i].length + 1;
  }

  // If slide 0, start at beginning
  if (slideIndex === 0) {
    charPos = 0;
  }

  // Clamp to document length
  const docLength = view.state.doc.length;
  charPos = Math.min(charPos, docLength);

  // Move cursor AND scroll to position - this triggers highlight update
  view.dispatch({
    selection: { anchor: charPos },
    effects: EditorView.scrollIntoView(charPos, {
      y: 'start',
      yMargin: 50,
    }),
  });
}

// Export the position utility for reuse
export { getSlideFromPosition, getSlideLineRanges };
