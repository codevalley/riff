// ============================================
// Theme Parser - Extract colors/fonts from CSS variables
// For PDF/PPTX export with proper theming
// ============================================

/**
 * Parsed theme with design-ready values
 */
export interface ParsedTheme {
  // Colors (hex format)
  bgPrimary: string;
  bgSecondary: string;
  textPrimary: string;
  textSecondary: string;
  accent: string;
  border: string;

  // Fonts
  fontDisplay: string;
  fontBody: string;
  fontMono: string;

  // Sizes
  fontSizeBase: number; // in points
}

/**
 * Default dark theme (fallback)
 */
export const DEFAULT_THEME: ParsedTheme = {
  bgPrimary: '#0a0a0a',
  bgSecondary: '#141414',
  textPrimary: '#ffffff',
  textSecondary: '#a1a1aa',
  accent: '#f59e0b',
  border: '#27272a',
  fontDisplay: 'Inter',
  fontBody: 'Inter',
  fontMono: 'JetBrains Mono',
  fontSizeBase: 18,
};

/**
 * Parse CSS variable value to hex color
 * Handles: #hex, rgb(), rgba(), hsl(), oklch(), named colors
 */
function parseColorValue(value: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Already hex
  if (trimmed.startsWith('#')) {
    // Convert 3-char to 6-char
    if (trimmed.length === 4) {
      return `#${trimmed[1]}${trimmed[1]}${trimmed[2]}${trimmed[2]}${trimmed[3]}${trimmed[3]}`;
    }
    // Strip alpha if 8-char
    if (trimmed.length === 9) {
      return trimmed.slice(0, 7);
    }
    return trimmed;
  }

  // RGB/RGBA
  const rgbMatch = trimmed.match(/rgba?\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/);
  if (rgbMatch) {
    const r = parseInt(rgbMatch[1]).toString(16).padStart(2, '0');
    const g = parseInt(rgbMatch[2]).toString(16).padStart(2, '0');
    const b = parseInt(rgbMatch[3]).toString(16).padStart(2, '0');
    return `#${r}${g}${b}`;
  }

  // HSL (approximate conversion)
  const hslMatch = trimmed.match(/hsla?\(\s*(\d+)\s*,\s*(\d+)%\s*,\s*(\d+)%/);
  if (hslMatch) {
    const h = parseInt(hslMatch[1]);
    const s = parseInt(hslMatch[2]) / 100;
    const l = parseInt(hslMatch[3]) / 100;
    return hslToHex(h, s, l);
  }

  // OKLCH (approximate - use accent color as fallback)
  if (trimmed.startsWith('oklch(')) {
    // OKLCH is complex, return null to use fallback
    return null;
  }

  // Named colors (common ones)
  const namedColors: Record<string, string> = {
    white: '#ffffff',
    black: '#000000',
    red: '#ff0000',
    green: '#00ff00',
    blue: '#0000ff',
    yellow: '#ffff00',
    orange: '#ffa500',
    purple: '#800080',
    transparent: null as unknown as string,
  };

  const named = namedColors[trimmed.toLowerCase()];
  if (named !== undefined) return named;

  return null;
}

/**
 * Convert HSL to hex
 */
function hslToHex(h: number, s: number, l: number): string {
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
    return Math.round(255 * color).toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

/**
 * Extract font family name from CSS value
 * Handles: "Font Name", 'Font Name', Font-Name, system-ui fallbacks
 */
function parseFontValue(value: string): string | null {
  if (!value) return null;

  const trimmed = value.trim();

  // Remove quotes and get first font family
  const fonts = trimmed.split(',');
  if (fonts.length === 0) return null;

  const first = fonts[0].trim().replace(/["']/g, '');

  // Skip generic families
  const generics = ['sans-serif', 'serif', 'monospace', 'system-ui', 'cursive', 'fantasy'];
  if (generics.includes(first.toLowerCase())) {
    return fonts.length > 1 ? fonts[1].trim().replace(/["']/g, '') : null;
  }

  return first;
}

/**
 * Parse CSS theme string into structured theme object
 * Theme CSS uses: --color-bg1, --color-fg1, --color-fg2, --color-bg2
 * And aliases: --slide-bg, --slide-text, --slide-muted, --slide-surface
 * Fonts: --font-f1, --font-f2
 */
export function parseThemeCSS(css: string | undefined): ParsedTheme {
  if (!css) return DEFAULT_THEME;

  const result: ParsedTheme = { ...DEFAULT_THEME };

  // Store raw values first (some are var() references)
  const rawValues: Record<string, string> = {};

  // Parse each line to collect all variables
  const lines = css.split('\n');
  for (const line of lines) {
    const match = line.match(/^\s*(--[^:]+):\s*(.+?)(?:;|$)/);
    if (!match) continue;
    const [, varName, varValue] = match;
    rawValues[varName] = varValue.trim();
  }

  // Resolve var() references
  const resolveValue = (value: string): string => {
    if (!value) return value;
    const varMatch = value.match(/var\((--[^)]+)\)/);
    if (varMatch && rawValues[varMatch[1]]) {
      return resolveValue(rawValues[varMatch[1]]);
    }
    return value;
  };

  // Map of CSS variable names to ParsedTheme keys (in priority order)
  // First check direct color values, then slide aliases
  const colorMappings: Array<{ vars: string[]; key: keyof ParsedTheme }> = [
    { vars: ['--color-bg1', '--slide-bg'], key: 'bgPrimary' },
    { vars: ['--color-bg2', '--slide-surface'], key: 'bgSecondary' },
    { vars: ['--color-fg1', '--slide-text'], key: 'textPrimary' },
    { vars: ['--color-fg2', '--slide-muted'], key: 'textSecondary' },
    { vars: ['--slide-accent', '--color-fg1'], key: 'accent' },
  ];

  const fontMappings: Array<{ vars: string[]; key: keyof ParsedTheme }> = [
    { vars: ['--font-f1', '--font-display', '--font-title'], key: 'fontDisplay' },
    { vars: ['--font-f2', '--font-body'], key: 'fontBody' },
  ];

  // Apply color mappings
  for (const mapping of colorMappings) {
    for (const varName of mapping.vars) {
      if (rawValues[varName]) {
        const resolved = resolveValue(rawValues[varName]);
        const hex = parseColorValue(resolved);
        if (hex) {
          (result[mapping.key] as string) = hex;
          break; // Use first found
        }
      }
    }
  }

  // Apply font mappings
  for (const mapping of fontMappings) {
    for (const varName of mapping.vars) {
      if (rawValues[varName]) {
        const resolved = resolveValue(rawValues[varName]);
        const font = parseFontValue(resolved);
        if (font) {
          (result[mapping.key] as string) = font;
          break;
        }
      }
    }
  }

  return result;
}

/**
 * Convert hex color to RGB values (0-255)
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const cleaned = hex.replace('#', '');
  return {
    r: parseInt(cleaned.slice(0, 2), 16),
    g: parseInt(cleaned.slice(2, 4), 16),
    b: parseInt(cleaned.slice(4, 6), 16),
  };
}

/**
 * Get contrasting text color (black or white) for a background
 */
export function getContrastColor(bgHex: string): string {
  const { r, g, b } = hexToRgb(bgHex);
  // Luminance calculation
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}
