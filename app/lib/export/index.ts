// ============================================
// Export Utilities - Main entry point
// ============================================

export { parseThemeCSS, hexToRgb, getContrastColor, DEFAULT_THEME } from './theme-parser';
export type { ParsedTheme } from './theme-parser';

export {
  fetchAllImages,
  getImageFromCache,
  createPlaceholderImage,
  toDataUrl,
  getStandardDimensions,
} from './image-utils';
export type { FetchedImage, ImageCache } from './image-utils';

export { createPdfDocument } from './slide-to-pdf';

export { createPptxPresentation, generatePptxBuffer } from './slide-to-pptx';
