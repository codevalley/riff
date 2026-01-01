-- Add SEO-friendly share slug to Deck
ALTER TABLE "Deck" ADD COLUMN "shareSlug" TEXT;

-- Create unique index for slug lookups
CREATE UNIQUE INDEX "Deck_shareSlug_key" ON "Deck"("shareSlug");

-- Create regular index for performance
CREATE INDEX "Deck_shareSlug_idx" ON "Deck"("shareSlug");
