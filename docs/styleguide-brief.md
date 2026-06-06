# Styleguide Brief — for limora.ai

Paste-ready inputs to generate a styleguide. The **Brand prompt** below is the
main text field; upload `docs/brand-assets/logo-512.png` (or `logo-1024.png`,
transparent) as the logo. Palette, type, and keywords are explicit so the tool
doesn't have to guess.

---

## ▸ Brand prompt (paste this)

> **kohstack — clarity, stacked.** A personal brand for Sylvester Koh, an IT /
> analytics professional in Sydney who turns messy operational data into clear
> decisions. The work is a *stack* of capabilities — SQL, Python, cloud,
> pipelines, reporting — layered so raw signals at the bottom become confident
> decisions at the top. The identity is **warm, calm, precise, and honest** —
> evidence-led, never salesy or buzzword-driven; clarity over cleverness.
>
> Visually it's a **warm "liquid glass" system that adapts to the time of day**:
> frosted translucent surfaces with lifted hairline edges, specular highlights,
> and soft warm shadows on a soft warm-paper ground — never cold black borders or
> flat grey. Copper and amber accents. Geometry uses a golden-ratio radius scale
> (rounded, generous). Typography is Inter, light weights for display with tight
> tracking. The mood is spacious, confident, quietly technical — decoration never
> competes with the content. The logo is "The Stack": three rising rounded bars
> reading at once as a data stack, an analytics growth trend, and clarity built
> layer on layer.

---

## ▸ Core 5 colors (Primary / Secondary / Accent / Light / Dark)

For tools that ask for exactly five core colors:

| Slot | Hex | Notes |
|---|---|---|
| **Primary** | `#9C6A47` | Copper — matches the logo |
| **Secondary** | `#3F6F6C` | Muted teal — copper's near-complement |
| **Accent** | `#FFC078` | Amber — warm highlight/pop |
| **Light** | `#F8F2EA` | Warm paper ground |
| **Dark** | `#2A211F` | Warm espresso (text / dark surfaces) |

Alt Primary (more contrast for small text): `#8F6645`.

## ▸ Color palette (hex)

Solar-adaptive — four phases. If the tool wants ONE palette, use **Day** as the
primary and the copper/amber as the brand accent.

### Day (primary)
| Role | Hex |
|---|---|
| Background (warm paper) | `#f8f2ea` |
| Text | `#2e2925` |
| Muted text | `#6f645a` |
| **Accent (copper)** | `#8f6645` |
| Secondary accent (teal) | `#3f6f6c` |

### Morning
| Role | Hex |
|---|---|
| Background | `#fbefe9` |
| Text | `#31231f` |
| Muted | `#826a62` |
| **Accent (terracotta)** | `#b07155` |
| Secondary (teal) | `#466a78` |

### Sunset (dark, warm)
| Role | Hex |
|---|---|
| Background | `#2a211f` |
| Text | `#fff1dc` |
| Muted | `#f0d7bb` |
| **Accent (amber)** | `#ffc078` |
| Secondary (sand) | `#f3d6a8` |

### Night (dark, cool)
| Role | Hex |
|---|---|
| Background | `#07111d` |
| Text | `#f5eadc` |
| Muted | `#c7b9a8` |
| **Accent (amber)** | `#f2bd7a` |
| Secondary (blue) | `#9ec7e8` |

**Logo fixed color (favicon/raster):** copper `#9c6a47`.

---

## ▸ Typography

Single-typeface system — **Inter for both heading and body** (hierarchy from
weight + tracking, not from mixing fonts).

**If Inter isn't available in the tool, substitute (same font for both),
in order of preference:** Plus Jakarta Sans → Manrope → DM Sans → Work Sans /
Figtree / Hanken Grotesk. All neutral humanist sans. Avoid geometric-quirky
faces (Poppins, Comfortaa).

| Field | Font | Settings |
|---|---|---|
| **Heading** | Inter | Light/300 (or 400), tracking ≈ -0.02em, line-height ~1.05–1.1 |
| **Body** | Inter | Regular/400, line-height ~1.6 |

- Labels / wordmark: Inter 600–700.
- Fallback stack: `system-ui, -apple-system, "Segoe UI", sans-serif`.
- **No serif fonts** — sans-serif only.
- **If a two-font pairing is required:** keep it all-sans — body **Inter**,
  heading **Space Grotesk** (slightly geometric/technical) or **Sora** (softer).
  Recommendation is still Inter/Inter for coherence.

---

## ▸ Logo — "The Stack"

- Three rising rounded (pill) bars, increasing width bottom → top.
- Meaning: a data stack (kohstack) / analytics growth / clarity layer-on-layer.
- Monochrome, tonal opacities (top bar full, lower bars lighter).
- Upload file: `docs/brand-assets/logo-512.png` or `logo-1024.png` (transparent).
- Wordmark: "Sylvester Koh" (Inter 700); handle: "kohstack".

---

## ▸ Brand voice sliders

- **Personality:** balanced / in-between (leaning Serious) — professional and
  credible, but warm and human; not playful, not stiff.
- **Density:** Minimal — spacious, decoration never competes with content.
- **Temperature:** Warm — the defining trait (copper/amber, warm paper, never cold).

## ▸ Mood / keywords

`warm` · `liquid glass` · `frosted translucent` · `copper & amber` ·
`solar / time-of-day adaptive` · `golden-ratio rounded` · `calm` · `precise` ·
`evidence-led` · `analytics` · `data pipelines` · `clarity` · `spacious` ·
`quietly technical` · `honest, not salesy`

## ▸ Materials & shape

- Surfaces: frosted glass — translucent fills, lifted 1px highlight edges,
  specular top highlight, soft warm shadows. No hard black strokes, no flat grey.
- Radii: golden-ratio scale — sm 14px, md 23px, lg 37px, xl 60px (rounded,
  generous, pill-like for small elements).

## ▸ Do / Don't

**Do** — warm, spacious, honest, evidence-led; copper/amber accent on warm-paper
or warm-dark grounds; rounded glass surfaces; one clear primary action.

**Don't** — cold greys or hard black borders; loud/salesy tone; invented metrics
or "expert everywhere"; busy decoration that fights the text.
