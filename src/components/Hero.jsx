import { useState, useEffect, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { bio, positioning, contact } from "../data/profile.js";
import HeroBanner from "./HeroBanner.jsx";

const HEADLINE = "Hi, I'm Sylvester";

// Minimal cubic-bezier easing solver (Newton-Raphson) so the type-reveal can run
// on the exact same curve as the portrait flip.
function cubicBezier(p1x, p1y, p2x, p2y) {
  const cx = 3 * p1x, bx = 3 * (p2x - p1x) - cx, ax = 1 - cx - bx;
  const cy = 3 * p1y, by = 3 * (p2y - p1y) - cy, ay = 1 - cy - by;
  const sampleX = (t) => ((ax * t + bx) * t + cx) * t;
  const sampleY = (t) => ((ay * t + by) * t + cy) * t;
  const slopeX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 5; i++) {
      const d = slopeX(t) || 1e-6;
      t -= (sampleX(t) - x) / d;
    }
    return sampleY(t);
  };
}

// Single source of motion timing: the headline type-reveal and the portrait flip
// share this duration + easing, so both run together identically.
const FLIP_DURATION = 0.52; // seconds
const FLIP_EASE = [0.22, 0.61, 0.36, 1];
const easeFlip = cubicBezier(...FLIP_EASE);

// The three capability pillars in the positioning statement — lit in the accent
// colour so the brand's substance reads at a glance.
const PILLARS = new Set(["analytics", "automation", "cloud"]);

// Brand statement for the hero frame: sentence case (no uppercase transform),
// with "through real projects" trimmed for tightness.
const INTRO = positioning.replace(/\s*through real projects\.?\s*$/i, ".");

// Split "Sydney, Australia" so the city can carry a slight accent highlight.
const [LOC_CITY, LOC_REGION] = bio.location.split(/,\s*/);

function highlightPillars(text) {
  return text.split(/(\s+)/).map((tok, i) => {
    const key = tok.toLowerCase().replace(/[^a-z]/g, "");
    return PILLARS.has(key) ? (
      <span key={i} className="pos-key">
        {tok}
      </span>
    ) : (
      tok
    );
  });
}

// The hero headline doubles as the tagline surface: it shows the greeting by
// default and type-animates the tagline on hover (desktop) / focus / tap (touch).
// Reduced-motion swaps instantly. The tagline is always in the DOM for SEO and
// exposed to screen readers via a visually-hidden paragraph in HeroCopy.
function HeroHeadline({ titleId }) {
  const reduce = useReducedMotion();
  const tagline = bio.heroSummary;
  const [revealed, setRevealed] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!revealed) {
      setCount(0);
      return;
    }
    if (reduce) {
      setCount(tagline.length);
      return;
    }
    // Reveal over the SAME duration + easing curve as the flip (time-based, so it
    // tracks the flip regardless of how many characters the tagline has).
    let raf;
    const start = performance.now();
    const total = FLIP_DURATION * 1000;
    const tick = (now) => {
      const t = Math.min(1, (now - start) / total);
      setCount(Math.round(easeFlip(t) * tagline.length));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [revealed, reduce, tagline]);

  const interaction = hasHover
    ? {
        onMouseEnter: () => setRevealed(true),
        onMouseLeave: () => setRevealed(false),
        onFocus: () => setRevealed(true),
        onBlur: () => setRevealed(false),
      }
    : {
        onClick: () => setRevealed((r) => !r),
        onKeyDown: (e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setRevealed((r) => !r);
          }
        },
      };

  return (
    <h1
      id={titleId}
      className={`hero-headline${revealed ? " is-revealed" : ""}`}
      tabIndex={0}
      aria-label={HEADLINE}
      title={hasHover ? "Hover to read more" : "Tap to read more"}
      {...interaction}
    >
      <span aria-hidden="true">
        {revealed ? (
          <>
            {tagline.slice(0, count)}
            <span className="type-caret" />
          </>
        ) : (
          HEADLINE
        )}
      </span>
    </h1>
  );
}

const hasHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function Portrait() {
  return (
    <div className="portrait-frame">
      <picture>
        <source type="image/webp" srcSet="/assets/profile-1x.webp 1x, /assets/profile-2x.webp 2x" />
        <source type="image/png" srcSet="/assets/profile-1x.png 1x, /assets/profile-2x.png 2x" />
        <img
          className="portrait-img"
          src="/assets/profile-1x.png"
          alt="Portrait of Sylvester Koh"
          width="426"
          height="600"
          decoding="async"
          fetchPriority="high"
          style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md)", display: "block" }}
        />
      </picture>
    </div>
  );
}

function AboutContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "1.4rem", fontWeight: 700 }}>About</h2>
      {bio.about.map((p, i) => (
        <p key={i} style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6, fontSize: ".92rem" }}>
          {p}
        </p>
      ))}
    </div>
  );
}

export default function Hero() {
  const reduce = useReducedMotion();
  const [flipped, setFlipped] = useState(false);
  const titleId = useId();

  // Reduced-motion (or SSR): static stacked layout — portrait + About, no 3D.
  if (reduce) {
    return (
      <section aria-labelledby={titleId} style={{ position: "relative", display: "grid", gap: "clamp(1.5rem, 4vw, 2.5rem)" }}>
        <HeroBanner />
        <HeroCopy titleId={titleId} />
        <div className="glass-panel" style={{ padding: 16 }}>
          <Portrait />
        </div>
        <div className="glass-card" style={{ padding: 20 }}>
          <AboutContent />
        </div>
      </section>
    );
  }

  const flipControls = hasHover
    ? {
        onMouseEnter: () => setFlipped(true),
        onMouseLeave: () => setFlipped(false),
        onFocus: () => setFlipped(true),
        onBlur: () => setFlipped(false),
      }
    : { onClick: () => setFlipped((f) => !f) };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setFlipped((f) => !f);
    }
  };

  const faceBase = {
    position: "absolute",
    inset: 0,
    backfaceVisibility: "hidden",
    WebkitBackfaceVisibility: "hidden",
    borderRadius: "var(--radius-lg)",
    overflow: "hidden",
  };

  return (
    <section
      aria-labelledby={titleId}
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0,1fr) minmax(260px, 380px)",
        gap: "clamp(1.5rem, 5vw, 3.5rem)",
        alignItems: "center",
        position: "relative",
      }}
      className="hero-grid"
    >
      <HeroBanner />
      <HeroCopy titleId={titleId} />

      <div style={{ perspective: 1200 }}>
        <div
          role="button"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? "Show portrait" : "Flip to read About"}
          onKeyDown={onKeyDown}
          {...flipControls}
          style={{ position: "relative", cursor: "pointer", outline: "none" }}
        >
          <motion.div
            animate={{ rotateY: flipped ? 180 : 0 }}
            transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
            style={{ position: "relative", transformStyle: "preserve-3d", aspectRatio: "426 / 600" }}
          >
            {/* front — portrait */}
            <div className="glass-panel" style={{ ...faceBase, padding: 14 }}>
              <Portrait />
              {!hasHover && (
                <span
                  aria-hidden="true"
                  style={{
                    position: "absolute", right: 12, bottom: 12,
                    display: "inline-flex", alignItems: "center", gap: 6,
                    padding: "5px 10px", borderRadius: 999,
                    background: "var(--surface-strong)", color: "var(--accent)",
                    fontSize: ".68rem", fontWeight: 700, letterSpacing: ".06em",
                  }}
                >
                  ⟲ Tap for About
                </span>
              )}
            </div>

            {/* back — About */}
            <div
              className="glass-panel"
              style={{ ...faceBase, transform: "rotateY(180deg)", padding: 24, display: "flex", alignItems: "center" }}
            >
              <AboutContent />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function HeroCopy({ titleId }) {
  return (
    <div>
      <HeroHeadline titleId={titleId} />
      <p className="sr-only">{bio.heroSummary}</p>

      {/* Action frame: brand statement + the three CTAs + availability, framed
          together as the hero's primary call to action. */}
      <div className="hero-frame">
        <p className="hero-intro">{highlightPillars(INTRO)}</p>
        <div className="hero-cta-row">
          <a className="glass-button btn-accent" href={contact.calendar} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">📅</span> Book a chat <span aria-hidden="true" className="btn-arrow">→</span>
          </a>
          <a className="glass-button" href="#projects"><span aria-hidden="true">↗</span> View projects</a>
          <a className="glass-button" href={contact.cv} download><span aria-hidden="true">⇩</span> Download CV</a>
        </div>
        <p className="hero-avail">
          <span aria-hidden="true">⌖</span> <span className="avail-city">{LOC_CITY}</span>
          {LOC_REGION ? `, ${LOC_REGION}` : ""} · Open to analytics and cloud roles
        </p>
      </div>
    </div>
  );
}
