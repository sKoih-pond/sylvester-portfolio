# Personal Brand — Sylvester Koh / **kohstack**

> The portfolio's brand guide. Source of truth for voice, identity, and the
> visual system the logo and hero banner are built from.

---

## 1. Essence

**kohstack** — *clarity, stacked.*

Sylvester Koh turns messy operational data into clear decisions. The brand is
named for the domain (**kohstack.au**) and for what the work actually is: a
**stack** of capabilities — SQL, Python, cloud, pipelines, reporting — layered
so that raw signals at the bottom become confident decisions at the top.

**One-line:** *I build analytics and automation pipelines that turn operational
data into clearer decisions.*

---

## 2. Positioning

IT professional building applied analytics, automation, and cloud capability
through **real projects** — not certificates in isolation. Currently a senior
escalation lead (Optus) shipping a flagship Azure-backed airport-arrivals
analytics platform (SGN) on the side. Sydney, Australia. Open to analytics and
cloud roles.

**Audience, in priority order:** recruiters and hiring managers → engineering
leads → peers. Every brand decision optimises for a recruiter scanning in 20
seconds: one primary action (*Book a chat*), honest evidence, no overclaiming.

---

## 3. Personality

| Is | Isn't |
|---|---|
| Precise, evidence-led | Buzzword-driven, hand-wavy |
| Calm and warm | Loud, salesy |
| Pragmatic — ships real things | Theoretical, all-certs-no-projects |
| Honest about level (skills cap at ~75%, never maxed) | Overclaiming "expert" everywhere |
| Clear over clever | Jargon for its own sake |

---

## 4. Voice

- **Plain and concrete.** "Predict arrival delays and identify key operational
  drivers," not "leverage cutting-edge AI synergies."
- **Active, first-person, understated.** Let the work carry the weight.
- **Specific numbers** when they're real (7,000+ profiles, 30-minute congestion
  bands). Never invented.
- **Short.** A recruiter reads, not studies.

---

## 5. Visual identity

A **warm liquid-glass** system that adapts to the time of day.

- **Solar-adaptive palette** — four phases (morning / day / sunset / night)
  interpolated in OKLab. Warm copper/amber accents on a soft warm paper ground
  by day; cool-blue glass with amber accent by night.
- **Material:** frosted "liquid glass" — lifted hairline edges, specular
  highlights, soft warm shadows. Never cold black borders.
- **Geometry:** golden-ratio radius scale (φ ≈ 1.618, r₀ = 14px).
- **Type:** General Sans (self-hosted, Fontshare — ITF Free Font License), light
  weights for display, tight tracking. Chosen over Inter, which had become the
  default AI/frontier-lab face; General Sans signals a deliberate, polished choice.
- **Accent (representative):** copper `#9c6a47` / `#b07155` (day), amber
  `#f2bd7a` (night). Always sourced from the live theme token `--accent`.

**Tone of the imagery:** calm, spacious, legible. Decoration never competes with
text. Motion is gentle and always honours `prefers-reduced-motion`.

---

## 6. Logo — "The Stack"

Three rising rounded bars. It reads three ways at once:

1. a **data stack** (the *kohstack* name),
2. an **analytics growth** trend (bars widen as they rise), and
3. **clarity built layer on layer** — foundation → insight.

- Monochrome; inherits the live `--accent` via `currentColor` so it re-tints
  with every solar phase. Tonal opacities (0.34 / 0.62 / 1.0) give glass depth.
- Files: `public/logo.svg` (favicon / OG, fixed warm copper) and
  `src/components/Logo.jsx` (theme-aware, used in the header tile).
- Clear space ≥ one bar-height. Minimum size 20px. Never recolour the bars
  individually, rotate, or add gradients/shadows to the mark itself.

**Wordmark:** "Sylvester Koh" in General Sans 700 beside the mark; "kohstack" as the
handle/short brand.

---

## 7. Hero banner

A full-bleed, decorative backdrop behind the hero (`src/components/HeroBanner.jsx`
+ `.hero-banner` in `index.css`):

- **Soft accent glows** (CSS radial gradients in `--accent-soft` / `--glass-tint`).
- **The "signal"** — a faint data-pipeline line with a few nodes (operational
  data flowing toward a clear decision) and a ghosted **stack watermark**
  echoing the logo.
- Keyed entirely to theme tokens (re-tints with the solar palette), masked to
  fade into the page, `pointer-events:none`, `aria-hidden`, and removed under
  `prefers-reduced-transparency`. It complements the hero; it never upstages it.

---

## 8. Quick do / don't

**Do** — lead with one clear action; show real projects; keep it warm, spacious,
honest; let the solar theme and glass carry the polish.

**Don't** — stack equal-weight CTAs; invent metrics or claim "expert"; use cold
greys/hard black borders; let decoration reduce text legibility; hard-code accent
colours instead of `--accent`.
