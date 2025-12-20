// ============================================
// Slash Commands - Autocomplete for slide syntax
// Type / to trigger command menu
// ============================================

import {
  autocompletion,
  CompletionContext,
  CompletionResult,
  Completion,
} from '@codemirror/autocomplete';
import { EditorView } from '@codemirror/view';
import { Extension } from '@codemirror/state';

/**
 * Slash command definition
 */
interface SlashCommand {
  label: string;
  detail: string;
  template: string;
  cursorOffset?: number; // Offset from end to place cursor (for placeholder selection)
  category: 'content' | 'layout' | 'image' | 'effect' | 'background';
}

/**
 * All available slash commands
 * Based on FORMAT_EXAMPLES from FormatHelpDialog.tsx
 */
const SLASH_COMMANDS: SlashCommand[] = [
  // Content
  {
    label: '/pause',
    detail: 'Reveal animation beat',
    template: '**pause**',
    category: 'content',
  },
  {
    label: '/code',
    detail: 'Code block',
    template: '```\n\n```',
    cursorOffset: 4,
    category: 'content',
  },
  {
    label: '/quote',
    detail: 'Speaker note (hidden)',
    template: '> ',
    category: 'content',
  },
  {
    label: '/highlight',
    detail: 'Highlighted text',
    template: '`text`',
    cursorOffset: 1,
    category: 'content',
  },

  // Layout
  {
    label: '/section',
    detail: 'Section header slide',
    template: '[section]',
    category: 'layout',
  },
  {
    label: '/grid',
    detail: 'Grid card layout',
    template: '[grid]\n- ',
    category: 'layout',
  },
  {
    label: '/space',
    detail: 'Vertical spacer',
    template: '[space:2]',
    category: 'layout',
  },
  {
    label: '/footer',
    detail: 'Slide footer text',
    template: '$<footer text>',
    cursorOffset: 1,
    category: 'layout',
  },
  {
    label: '/align-center',
    detail: 'Center content',
    template: '[center, center]',
    category: 'layout',
  },
  {
    label: '/align-left',
    detail: 'Left-align content',
    template: '[left, center]',
    category: 'layout',
  },
  {
    label: '/align-top',
    detail: 'Top-align content',
    template: '[center, top]',
    category: 'layout',
  },

  // Images
  {
    label: '/image',
    detail: 'AI-generated image',
    template: '[image: description]',
    cursorOffset: 12,
    category: 'image',
  },
  {
    label: '/image-left',
    detail: 'Image on left (30/70)',
    template: '[image: description, left]',
    cursorOffset: 18,
    category: 'image',
  },
  {
    label: '/image-right',
    detail: 'Image on right (70/30)',
    template: '[image: description, right]',
    cursorOffset: 19,
    category: 'image',
  },
  {
    label: '/image-top',
    detail: 'Image on top',
    template: '[image: description, top]',
    cursorOffset: 17,
    category: 'image',
  },
  {
    label: '/image-bottom',
    detail: 'Image on bottom',
    template: '[image: description, bottom]',
    cursorOffset: 20,
    category: 'image',
  },
  {
    label: '/icon',
    detail: 'Lucide icon (in grid)',
    template: '[icon: rocket]',
    cursorOffset: 1,
    category: 'image',
  },

  // Text Effects
  {
    label: '/anvil',
    detail: 'Anvil drop animation',
    template: ' [anvil]',
    category: 'effect',
  },
  {
    label: '/typewriter',
    detail: 'Typewriter effect',
    template: ' [typewriter]',
    category: 'effect',
  },
  {
    label: '/glow',
    detail: 'Pulsing glow effect',
    template: ' [glow]',
    category: 'effect',
  },
  {
    label: '/shake',
    detail: 'Attention shake',
    template: ' [shake]',
    category: 'effect',
  },

  // Backgrounds
  {
    label: '/bg-glow',
    detail: 'Radial glow background',
    template: '[bg:glow-center]',
    category: 'background',
  },
  {
    label: '/bg-grid',
    detail: 'Grid pattern background',
    template: '[bg:grid-center]',
    category: 'background',
  },
  {
    label: '/bg-retrogrid',
    detail: 'Retro grid (perspective)',
    template: '[bg:retrogrid]',
    category: 'background',
  },
  {
    label: '/bg-hatch',
    detail: 'Diagonal hatch pattern',
    template: '[bg:hatch-center]',
    category: 'background',
  },
  {
    label: '/bg-dots',
    detail: 'Dot pattern background',
    template: '[bg:dots-center]',
    category: 'background',
  },
  {
    label: '/bg-noise',
    detail: 'Noise texture',
    template: '[bg:noise]',
    category: 'background',
  },

  // Slide separator (convenience)
  {
    label: '/slide',
    detail: 'New slide separator',
    template: '\n---\n\n',
    category: 'content',
  },
];

/**
 * Category labels for visual grouping (short text badges instead of emojis)
 */
const CATEGORY_LABELS: Record<string, string> = {
  content: '•',
  layout: '▢',
  image: '◐',
  effect: '✦',
  background: '▤',
};

/**
 * Slash command completion source
 */
function slashCommandCompletion(context: CompletionContext): CompletionResult | null {
  // Match /word pattern
  const word = context.matchBefore(/\/[\w-]*/);

  // Only trigger if we have a slash
  if (!word) return null;

  // Don't trigger if just typed / with no context
  if (word.from === word.to && !context.explicit) return null;

  const query = word.text.toLowerCase();

  // Filter commands matching query
  const matches = SLASH_COMMANDS.filter((cmd) =>
    cmd.label.toLowerCase().startsWith(query)
  );

  if (matches.length === 0 && !context.explicit) return null;

  // Build completion options
  const options: Completion[] = matches.map((cmd) => ({
    label: cmd.label,
    detail: cmd.detail,
    type: cmd.category,
    boost: cmd.category === 'content' ? 10 : 0, // Prioritize common commands
    apply: (view: EditorView, _completion: Completion, from: number, to: number) => {
      const insert = cmd.template;
      const cursorPos = from + insert.length - (cmd.cursorOffset ?? 0);

      view.dispatch({
        changes: { from, to, insert },
        selection: { anchor: cursorPos },
      });
    },
  }));

  return {
    from: word.from,
    options,
    filter: false, // We handle filtering ourselves
  };
}

/**
 * Slash commands extension with custom styling
 */
export const slashCommands: Extension = autocompletion({
  override: [slashCommandCompletion],
  activateOnTyping: true,
  icons: false,
  addToOptions: [
    {
      render: (completion) => {
        const label = CATEGORY_LABELS[completion.type ?? 'content'] ?? '•';
        const span = document.createElement('span');
        span.className = `cm-slash-badge cm-slash-badge-${completion.type ?? 'content'}`;
        span.textContent = label;
        return span;
      },
      position: 10, // Before label
    },
  ],
  optionClass: (completion) => `cm-slash-${completion.type ?? 'content'}`,
});

/**
 * Styles for slash command dropdown
 */
export const slashCommandStyles = EditorView.baseTheme({
  '.cm-tooltip-autocomplete': {
    minWidth: '240px',
  },

  // Badge base style
  '.cm-slash-badge': {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '18px',
    height: '18px',
    marginRight: '8px',
    borderRadius: '4px',
    fontSize: '11px',
    fontWeight: '600',
  },

  // Category badge colors
  '.cm-slash-badge-content': {
    backgroundColor: 'rgba(237, 237, 237, 0.1)',
    color: '#a1a1a1',
  },
  '.cm-slash-badge-layout': {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    color: '#06b6d4',
  },
  '.cm-slash-badge-image': {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    color: '#10b981',
  },
  '.cm-slash-badge-effect': {
    backgroundColor: 'rgba(244, 63, 94, 0.15)',
    color: '#f43f5e',
  },
  '.cm-slash-badge-background': {
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    color: '#8b5cf6',
  },

  // Category colors for labels
  '.cm-slash-content .cm-completionLabel': {
    color: '#ededed',
  },
  '.cm-slash-layout .cm-completionLabel': {
    color: '#06b6d4',
  },
  '.cm-slash-image .cm-completionLabel': {
    color: '#10b981',
  },
  '.cm-slash-effect .cm-completionLabel': {
    color: '#f43f5e',
  },
  '.cm-slash-background .cm-completionLabel': {
    color: '#8b5cf6',
  },
});

/**
 * Combined slash commands extension
 */
export const slashCommandsExtension: Extension = [slashCommands, slashCommandStyles];

// Export command list for reference
export { SLASH_COMMANDS };
