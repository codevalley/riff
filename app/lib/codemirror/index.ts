// ============================================
// CodeMirror Extensions - Barrel Export
// ============================================

// Theme
export { slideTheme, slideEditorTheme, slideHighlighting } from './theme';

// Custom syntax highlighting
export {
  slideLanguage,
  slideDecorationStyles,
  createSlideDecorationPlugin,
} from './slideLanguage';

// Current slide highlight
export {
  createCurrentSlideHighlight,
  scrollToSlide,
  getSlideFromPosition,
  getSlideLineRanges,
} from './currentSlideHighlight';

// Slash commands
export {
  slashCommands,
  slashCommandStyles,
  slashCommandsExtension,
  SLASH_COMMANDS,
} from './slashCommands';
