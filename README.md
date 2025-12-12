# Riff

AI-powered presentation editor with prompt-driven theming and auto-generated images.

## Features

- **Markdown-based slides** - Write presentations in a simple, readable format
- **Live preview** - See your slides as you type
- **Prompt-driven themes** - Describe your desired style in plain English, AI generates the CSS
- **AI image generation** - Describe images, they're generated and cached automatically
- **Presenter mode** - Full-screen presentation with speaker notes
- **Cloud storage** - Decks stored in Vercel Blob, accessible anywhere

## Slide Format

```markdown
# Title (H1)
### Subtitle (H3)

> Speaker notes (not shown in slides)

**pause**

### Content revealed after pause

---

[image: Description of the image you want generated]

# Next Slide
```

### Syntax Reference

| Syntax | Usage |
|--------|-------|
| `---` | Slide separator |
| `# Title` | Main headline |
| `## Heading` | Secondary heading |
| `### Text` | Body text |
| `**pause**` | Reveal animation break |
| `> note` | Speaker notes |
| `[image: desc]` | Auto-generated image |
| `` `text` `` | Highlighted/accent text |
| ` ```code``` ` | Code block |

## Setup

### 1. Install dependencies

```bash
cd app
npm install
```

### 2. Configure environment variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Add your API keys:

```env
# Vercel Blob Storage (get from Vercel dashboard)
BLOB_READ_WRITE_TOKEN=your_vercel_blob_token_here

# Vercel AI Gateway (for text generation, theme generation)
AI_GATEWAY_API_KEY=your_ai_gateway_api_key_here
AI_GATEWAY_MODEL=moonshotai/kimi-k2-0905

# Google Gemini API (for image generation and restyling)
GOOGLE_GENERATIVE_AI_API_KEY=your_gemini_api_key_here
```

### 3. Run development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Deployment

### Deploy to Vercel

1. Push to GitHub
2. Import to Vercel
3. Add environment variables in Vercel dashboard
4. Deploy!

The app is optimized for Vercel:
- Uses Vercel Blob for storage
- API routes run as serverless functions
- Edge-ready

## Keyboard Shortcuts

### Editor
- `Cmd/Ctrl + S` - Save deck

### Preview
- `→` / `Space` - Next slide/reveal
- `←` / `Backspace` - Previous slide/reveal
- `Cmd/Ctrl + N` - Toggle speaker notes

### Presenter Mode
- `→` / `Space` / `Enter` - Next
- `←` / `Backspace` - Previous
- `F` - Toggle fullscreen
- `N` - Toggle speaker notes
- `G` / `O` - Slide overview
- `Home` - First slide
- `End` - Last slide
- `Esc` - Exit overview/fullscreen

## Theme Examples

Try these prompts in the Theme Generator:

- "Dark and minimal with neon cyan accents, like a cyberpunk terminal"
- "Warm, elegant, and luxurious with gold accents on deep burgundy"
- "Clean Apple-style with lots of white space, subtle grays"
- "Retro 80s synthwave with pink and purple gradients"
- "High contrast brutalist with stark black and white"

## Architecture

```
app/
├── app/
│   ├── page.tsx              # Main editor/preview UI
│   ├── present/[id]/         # Presenter mode
│   └── api/
│       ├── decks/            # CRUD for decks
│       ├── generate-image/   # Gemini image generation
│       └── generate-theme/   # Claude theme generation
├── components/
│   ├── SlideRenderer.tsx     # Renders single slide
│   ├── SlideEditor.tsx       # Markdown editor
│   ├── SlidePreview.tsx      # Preview with controls
│   ├── DeckManager.tsx       # Deck CRUD UI
│   ├── ThemeCustomizer.tsx   # Theme prompt UI
│   └── Presenter.tsx         # Full-screen mode
└── lib/
    ├── parser.ts             # Markdown → Slide AST
    ├── blob.ts               # Vercel Blob helpers
    ├── store.ts              # Zustand state
    └── types.ts              # TypeScript types
```

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **State**: Zustand
- **Storage**: Vercel Blob
- **AI**: Vercel AI Gateway (Kimi K2 for text/themes), Google Gemini (images)

---

Built with vibes. Present with style.
