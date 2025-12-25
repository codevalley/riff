# Email Templates

All emails are sent from `nyn@riff.im` with reply-to `nyn@riff.im`.
Replies land in Zoho inbox for real human conversation.

---

## 1. Welcome Email

**Trigger**: User signs up
**Subject**: Welcome to Riff

---

Hey {name},

Thanks for signing up to Riff.

I spend a lot of time making pitches and presentations. The process was always painful — once I had my script, it still took 3-7 days to turn it into something visually engaging. So I built Riff to fix that. What started as scratching my own itch has grown into something I think others will find useful too.

Here are some resources to get started:

- [Onboarding Video](https://riff.im/demo) — A short walkthrough covering the basics
- [Documentation](https://riff.im/docs) — Understand the markdown syntax and get more from the platform
- [Philosophy](https://riff.im/philosophy) — Why Riff exists and how it's built differently

I'm excited to hear what's working and what can be improved. Feel free to write back.

Cheers,
//Nyn

---

## 2. First Deck Email

**Trigger**: User creates their first deck
**Subject**: Your first deck is ready

---

Hey {name},

Nice — you just created your first deck{deckName ? `: "${deckName}"` : ''}!

A few things you might want to try:

- **Generate a theme** — Click the palette icon and describe the vibe you want
- **Add images** — Use the wand icon on any slide to generate visuals
- **Present or publish** — Share with a link or present directly from Riff

If anything feels confusing or broken, just reply to this email. I read everything.

Cheers,
//Nyn

---

## 3. First Publish Email

**Trigger**: User publishes their first deck
**Subject**: Your deck is live

---

Hey {name},

Congrats — you just published your first deck! It's now live and anyone with the link can view it.

{shareUrl ? `[View your published deck](${shareUrl})` : ''}

A few things to know:
- You can update and re-publish anytime — the link stays the same
- View count is tracked on your dashboard
- You can unpublish anytime if you change your mind

Would love to see what you've created. Feel free to share the link!

Cheers,
//Nyn

---

## 4. Credit Purchase Email

**Trigger**: User purchases credits
**Subject**: Thanks for the support

---

Hey {name},

Just wanted to say thanks for buying credits. It means a lot.

Riff doesn't have investors or a growth team — it's just me trying to build something useful. Every purchase helps keep this going and motivates me to make it better.

Your {credits} credits are ready to use. If you ever run into issues or have ideas for improvements, just reply here.

Cheers,
//Nyn

---

## 5. Coffee/Tip Email

**Trigger**: User sends a tip
**Subject**: Thank you

---

Hey {name},

I just saw your tip come through. Honestly, this made my day.

Building Riff has been a labor of love, and knowing someone values it enough to send a tip is incredibly motivating. Thank you for being part of this.

If there's ever anything I can help with, just reply to this email.

With gratitude,
//Nyn

---

## Implementation Notes

- All emails use plain HTML styling (no fancy templates)
- Emails should render well in all email clients
- Plain text fallback is auto-generated
- Fire-and-forget: email failures don't block user actions
- {name} falls back to "there" if no name available
