# Customer Communication

## Philosophy

The best way (and only way) to grow a product and make it delightful is to listen to customers. Understand their needs and make it happen.

### Principles

1. **Simple email is powerful** - Direct email communication is the most personal way to stay in touch with users. No fancy marketing automation, no drip campaigns, no "engagement optimization."

2. **Handwritten tone** - Every email should feel like it was written by a human, because it was. No corporate speak, no marketing fluff.

3. **Invitation to reply** - Every email ends with an implicit or explicit invitation to respond. We actually want to hear back.

4. **No growth hacking** - We don't send "low credits" reminders or urgency-based emails. If someone runs out of credits, they'll know. We respect their inbox.

5. **Gratitude over extraction** - When someone pays, we thank them genuinely. We don't upsell, cross-sell, or "maximize lifetime value."

---

## Technical Setup

### Receiving Emails (Zoho Mail)
- **Inbox**: `hello@riff.im` and `nyn@riff.im` (same inbox)
- **Purpose**: Human conversations with users
- **MX records**: Point to Zoho servers

### Sending Automated Emails (Resend)
- **From**: `nyn@riff.im`
- **Reply-to**: `nyn@riff.im`
- **Purpose**: Milestone emails that feel personal
- **DNS**: SPF + DKIM records authorize Resend to send

### How They Coexist
- Zoho's **MX records** control where incoming mail goes (Zoho inbox)
- Resend's **SPF/DKIM records** authorize outgoing mail (Resend sends)
- User replies to automated emails → lands in Zoho inbox → real conversation

---

## Email Triggers

| Trigger | When | Purpose |
|---------|------|---------|
| Welcome | User signs up | Introduce Riff, share resources, invite reply |
| First Deck | User creates first deck | Encouragement, tips to improve |
| First Publish | User publishes first deck | Celebration, share link |
| Credit Purchase | User buys credits | Genuine thanks for support |
| Coffee/Tip | User sends a tip | Heartfelt appreciation |

**No emails for:**
- Low credits (anti-growth-hacking)
- Inactivity ("we miss you" spam)
- Upsells or promotions
