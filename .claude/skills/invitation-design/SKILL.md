---
name: invitation-design
description: Design rules for nika.id UI — the AI theme engine (components/templates/ai-design), invitation templates, the dashboard and the marketing pages. Use before creating or changing any page, component, template, or the AI design prompt, so the result looks crafted instead of generic AI output.
---

# Invitation design rules

nika.id sells taste. A wedding invitation is shown to hundreds of guests; if it looks like a
generic AI landing page, the product fails. Follow these rules for every UI change.

## The look we avoid ("slop")

- Purple-to-pink gradients, gradient text, glowing blobs, glassmorphism cards everywhere.
- Emoji as icons (✨💍), random sparkles, "magic" wording.
- Every section the same: centered title + subtitle + 3 equal cards.
- Pure black on pure white, or grey text below 4.5:1 contrast.
- More than two typefaces, or a script font used for body text or labels.
- Drop shadows on everything, `rounded-3xl` on everything, `hover:scale-105` on everything.
- Unsplash stock photos of strangers as the main visual of a user's invitation.

## What good looks like

- **One idea per design.** A theme has a single mood ("Javanese heritage, sage & gold") and every
  choice — palette, type, ornament, layout — serves it.
- **Type does the work.** Large, confident display type for names; generous tracking on small
  uppercase labels; body text 16px+ with 1.6–1.75 line height. Script fonts only for the couple's names.
- **Restrained palette.** Background, surface, ink, muted, one accent and a soft accent. Accent
  covers under 10% of the screen. Check contrast: ink/background ≥ 4.5:1, muted ≥ 3:1.
- **Rhythm and whitespace.** Vertical spacing in a consistent scale (e.g. 24/40/64/96px).
  Alternate section layouts so the scroll has rhythm; never three identical sections in a row.
- **Ornament with purpose.** Thin line ornaments, dividers and frames drawn as inline SVG in the
  accent colour, at low opacity. Cultural motifs (kawung, arabesque, floral) must be tasteful and
  never cover text.
- **Mobile first.** Invitations are opened from WhatsApp on phones: design at 375px first, keep
  tap targets ≥ 44px, no horizontal scroll.
- **Motion is quiet.** Fade/translate 8–16px on reveal, 400–700ms, ease-out. Respect
  `prefers-reduced-motion`. No bouncing, no parallax that fights scrolling.
- **Indonesian copy that sounds human.** Warm, polite, concise ("Dengan memohon rahmat Allah
  SWT…", "Merupakan suatu kehormatan…"). No marketing hype inside the invitation.

## AI theme engine contract

- The AI never writes code. It returns a theme JSON validated by `lib/ai-design/schema.ts`; only
  curated fonts, ornaments and layout variants are allowed.
- To add a new look, add a variant to the schema enums **and** implement it in
  `components/templates/ai-design/` — keep both in sync, and update the system prompt in
  `lib/ai-design/prompt.ts` so the model knows when to use it.
- Colours from the model pass through `lib/ai-design/color.ts` (`normalizeTheme`), which fixes
  invalid hex values and low contrast. Do not bypass it.

## Before you finish a UI change

1. Look at it rendered at 375px and at desktop width (use the browser preview).
2. Check light/dark where the page supports both.
3. Ask: would a wedding stationery designer put their name on this? If not, simplify.
