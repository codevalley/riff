// ============================================
// API: /api/decks
// List all decks, Create new deck
// ============================================

import { NextRequest, NextResponse } from 'next/server';
import { listDecks, saveDeck } from '@/lib/blob';

export async function GET() {
  try {
    const decks = await listDecks();
    return NextResponse.json({ decks });
  } catch (error) {
    console.error('Error listing decks:', error);
    return NextResponse.json(
      { error: 'Failed to list decks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { name, content } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    // Default content if not provided
    const deckContent = content || `# ${name}
### Your presentation starts here

> Welcome to your new deck!

---

# Add your slides

**pause**

### Use --- to separate slides

**pause**

### Use **pause** for reveals

> Speaker notes go here with >

---

[image: A beautiful placeholder image for your presentation]

# Images are auto-generated

> Just describe what you want to see!
`;

    const deck = await saveDeck(name, deckContent);

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
