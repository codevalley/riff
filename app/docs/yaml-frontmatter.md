# YAML Frontmatter for Image Persistence

Riff uses YAML frontmatter to store image URLs directly in the markdown file. This ensures images persist across sessions, devices, and shared presentations.

## Format

The frontmatter is placed at the **bottom** of the document (after all slide content), keeping your content at the top for easier editing:

```yaml
# Your slide content here
[image: description of image]

---

# More slides...

---
images:
  "description of image":
    generated: https://blob.url/images/abc123.png
    uploaded: https://blob.url/uploads/def456.png
    restyled: https://blob.url/restyled/ghi789.png
    active: uploaded
---
```

## Image Slots

Each image description can have up to 3 URL variants:

| Slot | Description |
|------|-------------|
| `generated` | AI-generated image from the description |
| `uploaded` | User-uploaded replacement image |
| `restyled` | AI-restyled version of any existing image |

The `active` field indicates which slot is currently displayed.

## How It Works

1. **On image generation/upload**: The URL is immediately saved to frontmatter
2. **On slot switch**: The `active` field is updated
3. **On page load**: Images load from frontmatter (no localStorage dependency)
4. **On publish**: Any localStorage URLs are recovered into frontmatter (silent repair)

## Example

A deck with two images:

```yaml
# The Future of Work
[image: a futuristic city skyline]

---

# AI Assistants
[image: a robot working at a desk]

---
images:
  "a futuristic city skyline":
    generated: https://abc.blob.vercel-storage.com/images/f8a3b2c1.png
    uploaded: https://abc.blob.vercel-storage.com/uploads/x7y8z9.png
    active: uploaded
  "a robot working at a desk":
    generated: https://abc.blob.vercel-storage.com/images/d4e5f6a7.png
    active: generated
---
```

## Benefits

- **File-over-app**: All data in one portable markdown file
- **No data loss**: URLs survive browser clears, device switches
- **All variants preserved**: Switch between generated/uploaded/restyled anytime
- **Backward compatible**: Old decks work and migrate on first image change

## Migration

Existing decks without frontmatter continue to work normally. When you:
- Generate, upload, or restyle an image → frontmatter is created/updated
- Publish a deck → any localStorage URLs are recovered into frontmatter

This ensures no images are lost during the transition.
