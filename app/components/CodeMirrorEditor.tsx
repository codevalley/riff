'use client';

// ============================================
// CodeMirror Editor - SSR-safe wrapper
// Dynamically imports CodeMirror to avoid SSR issues
// ============================================

import { memo, useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Extension } from '@codemirror/state';
import { EditorView, placeholder as cmPlaceholder, keymap } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands';

import {
  slideTheme,
  slideLanguage,
  slashCommandsExtension,
  createCurrentSlideHighlight,
  scrollToSlide,
} from '@/lib/codemirror';

// Dynamic import with SSR disabled
const ReactCodeMirror = dynamic(
  () => import('@uiw/react-codemirror').then((mod) => mod.default),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full bg-[#0a0a0a] animate-pulse flex items-center justify-center">
        <div className="text-white/20 text-sm">Loading editor...</div>
      </div>
    ),
  }
);

/**
 * Props for CodeMirrorEditor
 */
interface CodeMirrorEditorProps {
  value: string;
  onChange: (value: string) => void;
  onSlideChange?: (slideIndex: number, totalSlides: number) => void;
  currentSlide?: number;
  placeholder?: string;
  className?: string;
  onSave?: () => void;
}

/**
 * Default placeholder text
 */
const DEFAULT_PLACEHOLDER = `# Your Presentation Title
### Subtitle goes here

> Speaker notes start with >

---

# New Slide

**pause**

### Elements after pause appear on click

---

[image: Description of the image you want]

# Images are auto-generated!`;

/**
 * CodeMirror Editor component with slide-specific extensions
 */
export const CodeMirrorEditor = memo(function CodeMirrorEditor({
  value,
  onChange,
  onSlideChange,
  currentSlide,
  placeholder = DEFAULT_PLACEHOLDER,
  className = '',
  onSave,
}: CodeMirrorEditorProps) {
  // Store EditorView in state instead of ref (dynamic import doesn't forward refs)
  const [editorView, setEditorView] = useState<EditorView | null>(null);
  const [isClient, setIsClient] = useState(false);
  const isExternalScroll = useRef(false);
  const lastScrolledSlide = useRef(-1);

  // Ensure we're on the client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Callback when editor is created
  const handleCreateEditor = useCallback((view: EditorView) => {
    setEditorView(view);
  }, []);

  // Handle value change from CodeMirror
  const handleChange = useCallback(
    (val: string) => {
      onChange(val);
    },
    [onChange]
  );

  // Scroll to slide when currentSlide prop changes externally
  useEffect(() => {
    if (
      currentSlide !== undefined &&
      currentSlide !== lastScrolledSlide.current &&
      editorView
    ) {
      // Mark as external to prevent callback loop
      isExternalScroll.current = true;
      lastScrolledSlide.current = currentSlide;

      scrollToSlide(editorView, currentSlide);

      // Reset flag after scroll completes
      setTimeout(() => {
        isExternalScroll.current = false;
      }, 100);
    }
  }, [currentSlide, editorView]);

  // Handle slide change from cursor position
  const handleSlideChange = useCallback(
    (slideIndex: number, totalSlides: number) => {
      // Ignore if this is from external scroll
      if (isExternalScroll.current) return;

      // Update lastScrolledSlide so we don't re-scroll to the same slide
      lastScrolledSlide.current = slideIndex;
      onSlideChange?.(slideIndex, totalSlides);
    },
    [onSlideChange]
  );

  // Build extensions
  const extensions: Extension[] = [
    // Theme
    slideTheme,
    // Syntax highlighting
    slideLanguage,
    // Slash commands
    slashCommandsExtension,
    // Current slide highlight with callback
    createCurrentSlideHighlight(handleSlideChange),
    // Placeholder
    cmPlaceholder(placeholder),
    // History (undo/redo)
    history(),
    // Default keymaps
    keymap.of([
      ...defaultKeymap,
      ...historyKeymap,
      // Custom save shortcut
      {
        key: 'Mod-s',
        run: () => {
          onSave?.();
          return true;
        },
      },
    ]),
    // Line wrapping
    EditorView.lineWrapping,
  ];

  if (!isClient) {
    return (
      <div className={`w-full h-full bg-[#0a0a0a] ${className}`}>
        <div className="animate-pulse h-full" />
      </div>
    );
  }

  return (
    <ReactCodeMirror
      value={value}
      onChange={handleChange}
      onCreateEditor={handleCreateEditor}
      theme="none"
      extensions={extensions}
      basicSetup={{
        lineNumbers: true,
        highlightActiveLineGutter: true,
        highlightActiveLine: true,
        foldGutter: false,
        dropCursor: true,
        allowMultipleSelections: false,
        indentOnInput: true,
        bracketMatching: true,
        closeBrackets: false,
        autocompletion: false, // We use our own
        rectangularSelection: false,
        crosshairCursor: false,
        highlightSelectionMatches: true,
        closeBracketsKeymap: false,
        searchKeymap: true,
        foldKeymap: false,
        completionKeymap: true,
        lintKeymap: false,
      }}
      className={`h-full overflow-hidden ${className}`}
      style={{
        height: '100%',
        maxHeight: '100%',
        fontSize: '14px',
      }}
    />
  );
});

export default CodeMirrorEditor;
