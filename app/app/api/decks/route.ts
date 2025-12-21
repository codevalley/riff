// ============================================
// API: /api/decks
// List user's decks, Create new deck
// ============================================

export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { saveDeckBlob } from '@/lib/blob';
import { nanoid } from 'nanoid';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user's decks from database
    const decks = await prisma.deck.findMany({
      where: { ownerId: session.user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        blobUrl: true,
        createdAt: true,
        updatedAt: true,
      },
    });

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
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { name, content } = await request.json();

    if (!name || typeof name !== 'string') {
      return NextResponse.json(
        { error: 'Deck name is required' },
        { status: 400 }
      );
    }

    // Generate unique deck ID
    const deckId = nanoid(10);

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

    // Save to blob storage (user-scoped)
    const { blobPath, blobUrl } = await saveDeckBlob(
      session.user.id,
      deckId,
      deckContent
    );

    // Create deck record in database
    const deck = await prisma.deck.create({
      data: {
        id: deckId,
        name,
        blobPath,
        blobUrl,
        ownerId: session.user.id,
      },
    });

    return NextResponse.json({ deck }, { status: 201 });
  } catch (error) {
    console.error('Error creating deck:', error);
    return NextResponse.json(
      { error: 'Failed to create deck' },
      { status: 500 }
    );
  }
}
