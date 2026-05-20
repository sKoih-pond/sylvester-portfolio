# Design Critique — Sylvester Koh Portfolio
**Date:** 2026-05-20
**Method:** impeccable critique (12-rule heuristic), brand mode
**Files reviewed:** index.html, styles.css, overlay.js, scene.js, theme.js
**Scope note:** Out-of-scope items per brief (Tableau URL, About copy expansion,
/assets/, CV PDF) are excluded from findings.

---

## Priority Legend

- **MUST-FIX** — Affects correctness, accessibility, or violates an impeccable
  absolute ban. Fix before shipping.
- **WORTH CONSIDERING** — Meaningful design improvement with measurable benefit.
  Prioritise in the next pass.
- **TASTE-ONLY** — Aesthetic preference. No clear right answer; record for
  awareness, apply at will.

---

## MUST-FIX

### 1. `color-scheme: light` on sunset theme — broken native UI rendering
**File:** `styles.css` line 59
**Detail:** `html[data-theme="sunset"]` declares `color-scheme: light` despite
having a dark background (`#2a211f`) and light text (`#fff1dc`). This causes
browser-native UI elements — scrollbars, form inputs, `<select>`, date pickers,
`<dialog>` backdrop scrollbar — to render in light mode on a dark canvas.
The experience is most visible in the overlay body scrollbar on sunset: a bright
white scrollbar track against near-black panels.
**Fix:** Change `color-scheme: light` to `color-scheme: dark` in the sunset block.
The night theme already does this correctly.

---

### 2. `.role-card--current` side-stripe border — impeccable absolute ban
**File:** `styles.css` line 443
```css
.role-card--current { border-left: 3px solid var(--accent); ... }
```
**Detail:** `border-left: 3px` as a coloured accent on a card is in impeccable's
"Absolute bans" list. The stripe reads as a layout decoration borrowed from
Bootstrap-era designs, not as a premium signal.
**Fix options (pick one):**
- Full border: `border: 1.5px solid var(--accent)` with `background: var(--surface-strong)` — cleaner distinction.
- Leading icon: replace the stripe with a coloured dot or accent icon before the
  role title. Visually distinct, no stripe required.
- Background tint: `background: var(--accent-soft)` with the standard 1px border.
  The tint communicates "current" without the stripe.

---

### 3. Hero-summary text hierarchy — summary competes with heading
**File:** `styles.css` line 224
```css
.hero-summary { ... color: var(--text); ... }
```
**Detail:** `.hero-summary` uses `var(--text)` — the same full-weight text colour
as `h1`. In brand mode the summary copy should read as secondary description, not
first-tier content. At the large h1 sizes (4–7.4rem), the body summary paragraph
is visually loud against the display name.
**Fix:** `color: var(--muted)` on `.hero-summary`. The `--muted` value in all four
themes passes WCAG AA for body text (confirmed in Phase 3 audit: day 5.44:1,
night 10.50:1). This creates a three-level colour hierarchy: h1 in `--text`,
role-line in `--accent`, summary in `--muted`.

---

## WORTH CONSIDERING

### 4. Glassmorphism depth overuse — backdrop-filter on too many simultaneous layers
**File:** `styles.css` lines 138–159
**Detail:** The single shared glass rule applies `backdrop-filter: blur(28px) saturate(145%)`
to eleven element types simultaneously:
`.glass-panel, .glass-card, .project-item, .experience-item, .glass-button,
.theme-pill, .brand-mark, .skills-grid span, .tag-row span, .icon-box, .project-icon`

On a page with all cards visible, this can mean 20+ compositor layers running
concurrent blurs. On mid-range Android and older iPhones this causes scroll jank.
impeccable's guideline: "Glassmorphism as default — rare and purposeful, or
nothing."
**Fix:** Reserve `backdrop-filter` for the four primary structural surfaces only:
`.site-header`, `.hero`, `.glass-card`, `.overlay-panel`. Remove backdrop-filter
from `.glass-button`, `.skills-grid span`, `.tag-row span`, `.icon-box`,
`.project-icon` — replace with opaque-ish fills using `var(--surface)` directly.
The perceived glass aesthetic comes from the panels behind the content, not every
leaf element.

---

### 5. `prefers-reduced-motion` nuclear override — catches functional transitions
**File:** `styles.css` line 335
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { transition: none !important; scroll-behavior: auto !important; }
}
```
**Detail:** The `!important` wildcard disables every transition including:
- `.skip-link { transition: transform 180ms }` — the skip link no longer slides
  down on focus, which is functionally important.
- Focus-visible ring transitions — rings snap on/off with no visual continuity.
These are not decorative. They provide orientation cues for keyboard users, many
of whom overlap with reduced-motion users.
**Fix:** Replace the wildcard with a targeted block that disables decorative motion
only, and separately preserves functional transitions:
```css
@media (prefers-reduced-motion: reduce) {
  /* Decorative: kill keyframes and theme transitions */
  *, *::before, *::after { animation-duration: 0.01ms !important; animation-iteration-count: 1 !important; }
  body, .ambient { transition-duration: 0.01ms !important; }
  /* Functional: skip-link slide and scroll remain intact */
}
```

---

### 6. `<h2>` section headings styled as decorative labels
**File:** `styles.css` line 271
```css
.section-heading h2 { text-transform: uppercase; letter-spacing: .08em; font-size: .88rem; }
```
**Detail:** The `h2` elements are semantically meaningful headings
(`aria-labelledby` points to them from the containing cards). At `.88rem`
uppercase with `letter-spacing: .08em` they read identically to the eyebrow —
an ornamental label, not a landmark heading. Screen reader users who navigate by
headings will reach "ABOUT ME", "FEATURED PROJECTS", etc. at 14px label-weight.
**Fix:** Separate the visual label style from semantic heading structure. Options:
- Keep the visual style but add weight: `.section-heading h2 { font-weight: 700; font-size: .9rem; }`. Minimal change.
- Or use `<p aria-hidden="true">` for the visual label and `<h2 class="sr-only">` for screen readers.

---

### 7. Skills grid — semantic markup
**File:** `index.html` lines 143–152
```html
<div class="skills-grid">
  <span>SQL</span>
  <span>Python</span>
  ...
```
**Detail:** Skill chips are bare `<span>` elements inside a `<div>`. A list of
skills is semantically a list — `<ul>/<li>` would communicate enumeration to
screen readers and allow `list-style: none`. The `<span>` approach works visually
but loses the semantic "you are in a list of 8 items" cue.
**Fix:** `<ul class="skills-grid">` with `<li>` children. Three-line change.

---

### 8. Experience card — no preview of overlay depth
**File:** `index.html` lines 119–136
**Detail:** The experience card shows one role and a button. A returning visitor
has no sense of how much content is behind the overlay trigger without opening it.
The button label "View full history & skills chart" explains what's there but
doesn't signal scale.
**Fix:** Add a role count or tenure span as a secondary meta element, e.g.:
```html
<p class="overlay-hint">5 roles · 2021 – present</p>
```
This anchors the card in time and sets expectation before the tap/click cost.

---

### 9. Portrait image — no `alt` fallback path for dark themes
**File:** `index.html` line 68
```html
<img ... alt="Portrait of Sylvester Koh" ... />
```
**Detail:** The portrait uses `mix-blend-mode: normal` and a
`drop-shadow(0 30px 42px rgba(43, 31, 25, .14))`. In `sunset` and `night` modes
the dark shadow nearly disappears (very low contrast against the dark
hero-gradient). The portrait may look unanchored — floating rather than grounded
— on dark themes. Not an alt-text issue (alt is correct ✓) but a compositing one.
**Fix:** In dark themes, increase the drop-shadow to use a warmer, slightly
higher-opacity value. Add to sunset/night theme CSS:
```css
html[data-theme="sunset"] .portrait-wrap img,
html[data-theme="night"]  .portrait-wrap img {
  filter: drop-shadow(0 30px 52px rgba(0, 0, 0, .32));
}
```

---

### 10. Project items — no link affordance
**File:** `index.html` lines 89–116
**Detail:** Project items are `<article>` elements with no interactive affordance.
Hover/focus produces no visual change. A visitor scanning the projects section
may try to click them. The items are in the "spotlight tile" category explicitly
deferred in the brief (awaiting Tableau URL), but visually they look clickable
(card style + project icon suggest a tile pattern).
**Fix (when Tableau URL is ready):** Wrap each `.project-item` in `<a href>`.
Until then, note this as a perceived-interactivity mismatch. Consider adding
`cursor: default` explicitly, or a subtle "coming soon" indicator to manage
expectation without breaking the layout.

---

## TASTE-ONLY

### 11. "About Me" heading copy — "Me" reduces premium register
**File:** `index.html` line 77
**Detail:** "About Me" is conversational. For a professional portfolio in brand
mode, "About" or "Profile" reads more refined. "Me" in a heading label is
technically redundant (the whole page is about the author).
**Alternatives:** "About", "Profile", "Background"

---

### 12. Hero eyebrow copy — "Enthusiast" undersells
**File:** `index.html` line 45
```html
IT Professional · Data & Cloud Enthusiast
```
**Detail:** "Enthusiast" signals a hobby relationship with the subject matter.
For someone building production pipelines and cloud automations, "Practitioner"
or simply removing the descriptor ("Data & Cloud") is more accurate to the
actual level of work.
**Alternative:** "IT Professional · Data & Cloud Practitioner" or
"IT Professional · Analytics & Cloud Engineering"

---

### 13. Hero summary copy — "practical" qualifier undersells
**File:** `index.html` line 48
```html
I build practical analytics and automation solutions...
```
**Detail:** "Practical" is a hedge. It suggests the alternatives are impractical,
when the intent is to say the work is production-quality and operationally grounded.
**Alternatives:** "I build analytics and automation pipelines that turn operational
data into clearer decisions." (removes qualifier, tightens the sentence)

---

### 14. `prefers-color-scheme` system preference not wired
**File:** `theme.js`
**Detail:** The theme is driven by time of day only. If a user has set their OS
to dark mode (common at night), the night theme already applies in the right time
window — but mid-day a system-dark-mode user gets the day cream palette. This is
intentional by design (time-adaptive is a feature, not a bug), but worth
acknowledging: some users will perceive a mis-match between system dark mode and
the morning/day themes.
**If desired:** Add a `prefers-color-scheme: dark` fallback that applies the night
theme when system preference is dark AND the time-based theme would be morning
or day. This preserves the adaptive concept while respecting system preference.

---

### 15. Content grid column ratio may be too narrow for the about card
**File:** `styles.css` line 258
```css
grid-template-columns: .7fr 1.3fr;
```
**Detail:** The about card at `.7fr` receives only 35% of the content grid width.
With two short paragraphs, this column fills quickly and the card may feel cramped
relative to the projects card beside it. The `.7fr / 1.3fr` ratio is 35/65 —
slightly aggressive. `0.8fr / 1.2fr` (40/60) would relieve the narrowness without
equalising the grid.
**Note:** Brief says "don't restructure to a tile grid yet". This is a column-width
tweak within the existing two-column layout, not a restructure.

---

## Summary Table

| # | Finding | Priority | File | Line |
|---|---------|----------|------|------|
| 1 | sunset `color-scheme: light` on dark bg | MUST-FIX | styles.css | 59 |
| 2 | `.role-card--current` side-stripe border | MUST-FIX | styles.css | 443 |
| 3 | `.hero-summary` colour at full `--text` weight | MUST-FIX | styles.css | 224 |
| 4 | Glassmorphism on 11 element types simultaneously | WORTH | styles.css | 138 |
| 5 | `prefers-reduced-motion` kills functional transitions | WORTH | styles.css | 335 |
| 6 | `h2` section labels styled as decorative `.88rem` | WORTH | styles.css | 271 |
| 7 | Skills chips in `<span>` instead of `<ul>/<li>` | WORTH | index.html | 143 |
| 8 | Experience card has no overlay depth preview | WORTH | index.html | 119 |
| 9 | Portrait drop-shadow invisible on dark themes | WORTH | styles.css | 254 |
| 10 | Project items look clickable but are not | WORTH (deferred) | index.html | 89 |
| 11 | "About Me" heading register | TASTE | index.html | 77 |
| 12 | "Enthusiast" in eyebrow undersells | TASTE | index.html | 45 |
| 13 | "practical" hedge in hero summary | TASTE | index.html | 48 |
| 14 | `prefers-color-scheme` not wired to time-adaptive | TASTE | theme.js | — |
| 15 | Content grid column ratio cramped for about card | TASTE | styles.css | 258 |
