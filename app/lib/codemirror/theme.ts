// ============================================
// CodeMirror Theme - Dark theme matching app aesthetic
// ============================================

import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language';
import { tags as t } from '@lezer/highlight';

// App color palette (from globals.css)
const colors = {
  background: '#0a0a0a',
  surface: '#111111',
  surfaceHover: '#1a1a1a',
  border: 'rgba(255, 255, 255, 0.08)',
  textPrimary: '#ededed',
  textSecondary: '#a1a1a1',
  textTertiary: '#666666',
  selection: 'rgba(255, 255, 255, 0.15)',
  cursor: '#ededed',
  // Accent colors for syntax
  amber: '#f59e0b',
  rose: '#f43f5e',
  emerald: '#10b981',
  cyan: '#06b6d4',
  violet: '#8b5cf6',
  blue: '#3b82f6',
};

/**
 * Base editor theme - styling the chrome
 */
export const slideEditorTheme = EditorView.theme({
  // Root container
  '&': {
    color: colors.textPrimary,
    backgroundColor: colors.background,
    fontSize: '14px',
    fontFamily: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",
  },

  // Content area
  '.cm-content': {
    caretColor: colors.cursor,
    padding: '16px 0',
    lineHeight: '24px',
  },

  // Gutters (line numbers)
  '.cm-gutters': {
    backgroundColor: colors.background,
    color: colors.textTertiary,
    border: 'none',
    paddingRight: '8px',
  },

  '.cm-lineNumbers .cm-gutterElement': {
    padding: '0 8px 0 16px',
    minWidth: '40px',
  },

  // Active line
  '.cm-activeLine': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
  },

  '.cm-activeLineGutter': {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    color: colors.textSecondary,
  },

  // Selection
  '&.cm-focused .cm-selectionBackground, .cm-selectionBackground': {
    backgroundColor: colors.selection,
  },

  '.cm-selectionMatch': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },

  // Cursor
  '.cm-cursor': {
    borderLeftColor: colors.cursor,
    borderLeftWidth: '2px',
  },

  // Matching brackets
  '.cm-matchingBracket': {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    color: colors.textPrimary,
    outline: `1px solid ${colors.textTertiary}`,
  },

  // Placeholder text
  '.cm-placeholder': {
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // Scrollbar styling - ensure editor scrolls properly
  '.cm-scroller': {
    overflow: 'auto !important',
    fontFamily: "'Geist Mono', 'SF Mono', 'Fira Code', monospace",
  },

  // Ensure editor fills container
  '&.cm-editor': {
    height: '100%',
  },

  // Autocomplete dropdown
  '.cm-tooltip': {
    backgroundColor: colors.surface,
    border: `1px solid ${colors.border}`,
    borderRadius: '8px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)',
    overflow: 'hidden',
  },

  '.cm-tooltip-autocomplete': {
    '& > ul': {
      fontFamily: "'Geist Mono', monospace",
      fontSize: '13px',
      maxHeight: '200px',
    },
    '& > ul > li': {
      padding: '6px 12px',
      color: colors.textSecondary,
    },
    '& > ul > li[aria-selected]': {
      backgroundColor: colors.surfaceHover,
      color: colors.textPrimary,
    },
  },

  '.cm-completionLabel': {
    color: colors.textPrimary,
  },

  '.cm-completionDetail': {
    color: colors.textTertiary,
    marginLeft: '12px',
    fontStyle: 'italic',
  },

  // Panels
  '.cm-panels': {
    backgroundColor: colors.surface,
    color: colors.textSecondary,
  },

  // Search
  '.cm-searchMatch': {
    backgroundColor: 'rgba(245, 158, 11, 0.3)',
  },

  '.cm-searchMatch.cm-searchMatch-selected': {
    backgroundColor: 'rgba(245, 158, 11, 0.5)',
  },
}, { dark: true });

/**
 * Syntax highlighting - token colors
 */
export const slideHighlighting = syntaxHighlighting(
  HighlightStyle.define([
    // Headings
    { tag: t.heading1, color: colors.textPrimary, fontWeight: 'bold' },
    { tag: t.heading2, color: colors.textPrimary, fontWeight: '600' },
    { tag: t.heading3, color: colors.textSecondary, fontWeight: '500' },
    { tag: t.heading4, color: colors.textSecondary, fontWeight: '500' },

    // Emphasis
    { tag: t.emphasis, fontStyle: 'italic', color: colors.textSecondary },
    { tag: t.strong, fontWeight: 'bold', color: colors.textPrimary },
    { tag: t.strikethrough, textDecoration: 'line-through', color: colors.textTertiary },

    // Code
    { tag: t.monospace, fontFamily: "'Geist Mono', monospace", color: colors.amber },
    { tag: t.processingInstruction, color: colors.textTertiary }, // Code block markers

    // Links - subtle styling to not clash with bracket syntax
    { tag: t.link, color: colors.textSecondary },
    { tag: t.url, color: colors.textTertiary, fontStyle: 'italic' },

    // Lists
    { tag: t.list, color: colors.textSecondary },

    // Quote
    { tag: t.quote, color: colors.textTertiary, fontStyle: 'italic' },

    // Content
    { tag: t.content, color: colors.textPrimary },

    // Special markers (these are extended in slideLanguage.ts)
    { tag: t.separator, color: colors.amber, fontWeight: 'bold' }, // ---
    { tag: t.keyword, color: colors.rose }, // **pause**
    { tag: t.labelName, color: colors.emerald }, // [image: ...]
    { tag: t.typeName, color: colors.cyan }, // [section], [grid]
    { tag: t.attributeName, color: colors.violet }, // [bg:...], effects
    { tag: t.comment, color: colors.textTertiary, fontStyle: 'italic' }, // > speaker notes
  ])
);

/**
 * Combined theme extension
 */
export const slideTheme: Extension = [
  slideEditorTheme,
  slideHighlighting,
];
