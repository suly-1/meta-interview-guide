# Design Ideas — Meta IC6/IC7 Interview Guide

## Approach 1 — Editorial Dark Codex
<response>
<text>
**Design Movement:** Dark editorial / technical documentation aesthetic
**Core Principles:** High information density, monospace accents, surgical whitespace, zero decoration
**Color Philosophy:** Near-black (#0d1117) base, electric blue (#0866ff) as the single accent, warm white text. Inspired by GitHub's dark mode and Linear's precision.
**Layout Paradigm:** Left sidebar navigation (sticky), wide right content area. Sidebar shows section tree; content scrolls independently.
**Signature Elements:** Monospace code labels, thin horizontal rules as dividers, pill badges with sharp corners
**Interaction Philosophy:** Instant tab switches, no animation — speed over flair
**Animation:** None — pure utility
**Typography System:** JetBrains Mono for labels/code, Inter for body
</text>
<probability>0.07</probability>
</response>

## Approach 2 — Structured Clarity (CHOSEN)
<response>
<text>
**Design Movement:** Modern SaaS documentation — Notion meets Linear
**Core Principles:** Clean hierarchy, generous whitespace, color-coded sections, card-based information architecture
**Color Philosophy:** White background, Meta blue (#0866ff) as primary, section colors (teal, amber, indigo, emerald) for the 4 tabs. Warm gray text. Calm, professional, trustworthy.
**Layout Paradigm:** Sticky top nav with 4 tabs, full-width content below. Each tab is a self-contained scroll. No sidebar — tabs ARE the navigation.
**Signature Elements:** Colored left-border callouts, frequency star badges, accordion question blocks
**Interaction Philosophy:** Smooth tab transitions with framer-motion, accordion open/close, hover lift on cards
**Animation:** Subtle fade-in on tab switch (200ms), hover translate-y on cards, accordion height animation
**Typography System:** Space Grotesk (display/headings) + Inter (body). Bold weight contrast between section headers and body text.
</text>
<probability>0.08</probability>
</response>

## Approach 3 — Brutalist Technical
<response>
<text>
**Design Movement:** Brutalist / raw engineering aesthetic
**Core Principles:** Bold typography, high contrast, grid-heavy, no rounded corners
**Color Philosophy:** Off-white (#fafaf8) background, black borders, Meta blue used sparingly as a highlight only
**Layout Paradigm:** Asymmetric two-column grid — wide left content, narrow right sticky summary panel
**Signature Elements:** Bold numbered section headers, thick black borders, uppercase labels
**Interaction Philosophy:** No hover effects — content is king
**Animation:** None
**Typography System:** Space Mono for all text, bold weight for headers
</text>
<probability>0.05</probability>
</response>

---
**CHOSEN: Approach 2 — Structured Clarity**
Space Grotesk headings + Inter body, Meta blue primary, 4 color-coded tabs, card-based layout, smooth animations.
