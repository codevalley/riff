// ============================================
// Font Registry - Register fonts for PDF export
// Dynamically fetches TTF URLs from Google Fonts API
// ============================================

import { Font } from '@react-pdf/renderer';

// Track registered fonts to avoid duplicate registration
const registeredFonts = new Set<string>();
const failedFonts = new Set<string>();

// Cache for fetched font URLs
const fontUrlCache = new Map<string, Map<number, string>>();

// Note: Google Fonts returns TTF when NO User-Agent is sent (like curl)
// Sending browser User-Agents actually returns woff2 with unicode subsets

/**
 * Fetch font CSS from Google Fonts and extract TTF URLs
 */
async function fetchFontUrls(family: string, weights: number[]): Promise<Map<number, string>> {
  const cached = fontUrlCache.get(family);
  if (cached) return cached;

  try {
    // Build Google Fonts CSS URL (weights are comma-separated)
    const weightStr = weights.join(',');
    const encodedFamily = encodeURIComponent(family).replace(/%20/g, '+');
    const cssUrl = `https://fonts.googleapis.com/css?family=${encodedFamily}:${weightStr}`;

    console.log(`[Font Registry] Fetching CSS from: ${cssUrl}`);

    // Don't send User-Agent - Google returns TTF format for "bare" requests (like curl)
    // Browser User-Agents get woff2 with unicode subsets which is more complex
    const response = await fetch(cssUrl, {
      signal: AbortSignal.timeout(10000),
    });

    console.log(`[Font Registry] Response status: ${response.status}`);

    if (!response.ok) {
      console.warn(`[Font Registry] Failed to fetch font CSS: ${cssUrl} (${response.status})`);
      return new Map();
    }

    const css = await response.text();

    // Parse CSS to extract font URLs and weights
    const urlMap = new Map<number, string>();

    // Match each @font-face block
    const fontFaceRegex = /@font-face\s*\{[\s\S]*?\}/g;
    const blocks = css.match(fontFaceRegex) || [];

    for (const block of blocks) {
      // Extract weight
      const weightMatch = block.match(/font-weight:\s*(\d+)/);
      const weight = weightMatch ? parseInt(weightMatch[1], 10) : 400;

      // Extract TTF URL
      const urlMatch = block.match(/url\((https:\/\/fonts\.gstatic\.com[^)]+\.ttf)\)/);
      if (urlMatch) {
        urlMap.set(weight, urlMatch[1]);
      }
    }

    console.log(`[Font Registry] Found ${urlMap.size} weights for ${family}`);

    fontUrlCache.set(family, urlMap);
    return urlMap;
  } catch (error) {
    console.warn(`[Font Registry] Error fetching font CSS for ${family}:`, error);
    return new Map();
  }
}

/**
 * Fetch font and convert to base64 for reliable embedding
 */
async function fetchFontAsBase64(url: string): Promise<string | null> {
  try {
    const response = await fetch(url, {
      signal: AbortSignal.timeout(5000),
    });

    if (!response.ok) {
      console.warn(`[Font Registry] Failed to fetch font: ${url} (${response.status})`);
      return null;
    }

    const arrayBuffer = await response.arrayBuffer();

    // Verify it's a valid TTF (starts with 0x00010000 or "OTTO" for OTF)
    const header = new Uint8Array(arrayBuffer.slice(0, 4));
    const isTTF = header[0] === 0x00 && header[1] === 0x01 && header[2] === 0x00 && header[3] === 0x00;
    const isOTF = header[0] === 0x4F && header[1] === 0x54 && header[2] === 0x54 && header[3] === 0x4F;

    if (!isTTF && !isOTF) {
      console.warn(`[Font Registry] Invalid font format at ${url}`);
      return null;
    }

    // Convert to base64 data URI
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return `data:font/truetype;base64,${base64}`;
  } catch (error) {
    console.warn(`[Font Registry] Error fetching font ${url}:`, error);
    return null;
  }
}

/**
 * Standard weights to request from Google Fonts
 */
const STANDARD_WEIGHTS = [400, 500, 600, 700];

/**
 * Register a font family with react-pdf
 * Dynamically fetches TTF URLs from Google Fonts API
 */
export async function registerFontAsync(family: string): Promise<boolean> {
  // Skip if already registered or known to fail
  if (registeredFonts.has(family)) return true;
  if (failedFonts.has(family)) return false;

  try {
    // Fetch font URLs from Google Fonts API
    const fontUrls = await fetchFontUrls(family, STANDARD_WEIGHTS);

    if (fontUrls.size === 0) {
      console.warn(`[Font Registry] No fonts found for: ${family}`);
      failedFonts.add(family);
      return false;
    }

    // Find the regular weight (400) or closest available
    let regularWeight = 400;
    if (!fontUrls.has(400)) {
      // Use the first available weight
      const availableWeights = Array.from(fontUrls.keys());
      regularWeight = availableWeights[0] ?? 400;
    }

    const regularUrl = fontUrls.get(regularWeight);
    if (!regularUrl) {
      console.warn(`[Font Registry] No regular weight for font: ${family}`);
      failedFonts.add(family);
      return false;
    }

    // Fetch and register regular weight first
    const regularData = await fetchFontAsBase64(regularUrl);
    if (!regularData) {
      console.warn(`[Font Registry] Could not load font: ${family}`);
      failedFonts.add(family);
      return false;
    }

    Font.register({
      family,
      src: regularData,
      fontWeight: regularWeight,
    });

    // Register additional weights
    const registeredWeights = [regularWeight];
    const entries = Array.from(fontUrls.entries());

    for (const entry of entries) {
      const [weight, url] = entry;
      if (weight === regularWeight) continue;

      const data = await fetchFontAsBase64(url);
      if (data) {
        Font.register({
          family,
          src: data,
          fontWeight: weight,
        });
        registeredWeights.push(weight);
      }
    }

    registeredFonts.add(family);
    console.log(`[Font Registry] Registered font: ${family} (weights: ${registeredWeights.sort().join(', ')})`);
    return true;
  } catch (error) {
    console.error(`[Font Registry] Failed to register font ${family}:`, error);
    failedFonts.add(family);
    return false;
  }
}

/**
 * Synchronous version that just checks if already registered
 * Use registerThemeFontsAsync for actual font loading
 */
export function registerFont(family: string): boolean {
  return registeredFonts.has(family);
}

/**
 * Register fonts from a parsed theme (async version)
 * Returns the fonts to use (registered fonts or fallbacks)
 */
export async function registerThemeFontsAsync(theme: {
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
}): Promise<{
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
}> {
  // Register all fonts in parallel
  const [displayOk, bodyOk, monoOk] = await Promise.all([
    registerFontAsync(theme.fontDisplay),
    registerFontAsync(theme.fontBody),
    registerFontAsync(theme.fontMono),
  ]);

  return {
    fontDisplay: displayOk ? theme.fontDisplay : 'Helvetica',
    fontBody: bodyOk ? theme.fontBody : 'Helvetica',
    fontMono: monoOk ? theme.fontMono : 'Courier',
  };
}

/**
 * Sync version - uses fallbacks if fonts aren't pre-registered
 */
export function registerThemeFonts(theme: {
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
}): {
  fontDisplay: string;
  fontBody: string;
  fontMono: string;
} {
  return {
    fontDisplay: registeredFonts.has(theme.fontDisplay) ? theme.fontDisplay : 'Helvetica',
    fontBody: registeredFonts.has(theme.fontBody) ? theme.fontBody : 'Helvetica',
    fontMono: registeredFonts.has(theme.fontMono) ? theme.fontMono : 'Courier',
  };
}

/**
 * Check if a font is available
 */
export function isFontRegistered(family: string): boolean {
  return registeredFonts.has(family);
}

/**
 * Get list of registered font families
 */
export function getRegisteredFonts(): string[] {
  return Array.from(registeredFonts);
}
