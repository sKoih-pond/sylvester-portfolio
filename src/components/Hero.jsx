import { useState, useEffect, useRef } from "react";
import { m, useReducedMotion } from "framer-motion";
import { bio, positioning } from "../data/profile.js";
import Testimonials from "./Testimonials.jsx";

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

// Global motion timing — shared by the portrait flip, the stage morph, and the
// greeting/portrait transitions. Kept a touch on the slower side so the motion
// reads as smooth rather than abrupt.
export const FLIP_DURATION = 0.6; // seconds
export const FLIP_EASE = [0.22, 0.61, 0.36, 1];
const easeFlip = cubicBezier(...FLIP_EASE);

// The headline type-reveal runs noticeably slower than the rest of the motion so
// the tagline reads at a deliberate, typewriter pace (~16ms/char over the line).
const TYPE_DURATION = 1.5; // seconds

// The three capability pillars in the positioning statement — lit in the accent
// colour so the brand's substance reads at a glance.
const PILLARS = new Set(["analytics", "automation", "cloud"]);

// Brand statement: sentence case, with "through real projects" trimmed.
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

const hasHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

// The greeting headline doubles as the tagline surface: greeting by default,
// type-animates the tagline on hover (desktop) / focus / tap (touch).
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
    let raf;
    const start = performance.now();
    const total = TYPE_DURATION * 1000;
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
          fetchpriority="high"
          style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "var(--radius-md)", display: "block" }}
        />
      </picture>
    </div>
  );
}

function AboutContent() {
  return (
    <div className="about-content" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-sans)", fontSize: "1.4rem", fontWeight: 700 }}>About</h2>
      {bio.about.map((p, i) => (
        <p key={i} style={{ margin: 0, color: "var(--muted)", lineHeight: 1.6, fontSize: ".92rem" }}>
          {p}
        </p>
      ))}
    </div>
  );
}

// ── Exported hero pieces (composed by Stage) ─────────────────────────────────

export function HeroGreeting({ titleId }) {
  return (
    <div className="hero-greet">
      <HeroHeadline titleId={titleId} />
      <p className="sr-only">{bio.heroSummary}</p>
    </div>
  );
}

// Flip card: portrait → About on hover/tap. Controlled by Stage so the action
// panel can collapse in sync. Reduced-motion shows the portrait only.
export function PortraitCard({ open = false, onOpenChange = () => {} }) {
  const reduce = useReducedMotion();
  const flipped = open;

  // Branch on the actual pointer type per interaction (robust where the
  // hover/pointer media query is wrong, e.g. hybrid devices): a mouse flips
  // while hovering and reverts on leave; a touch tap toggles (and stays), which
  // mirrors the desktop "hover and dwell" interaction on mobile.
  const lastPointerType = useRef("mouse");
  const flipControls = {
    onPointerEnter: (e) => {
      lastPointerType.current = e.pointerType;
      if (e.pointerType === "mouse") onOpenChange(true);
    },
    onPointerLeave: (e) => {
      if (e.pointerType === "mouse") onOpenChange(false);
    },
    onPointerDown: (e) => {
      lastPointerType.current = e.pointerType;
    },
    onClick: () => {
      if (lastPointerType.current !== "mouse") onOpenChange(!open);
    },
  };

  const onKeyDown = (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      onOpenChange(!open);
    }
  };

  // Touch devices OR reduced motion: skip the 3D flip and swap the faces in
  // normal flow (no absolute-positioned faces). This keeps the same tap-to-About
  // interaction, but the card grows naturally so the About text can never
  // overlap/clip the nav pane below it (ultra-short screens just scroll), and it
  // still works when the OS has "Reduce Motion" enabled (common on phones).
  if (reduce || !hasHover) {
    return (
      <div className="flip-perspective" data-flipped={flipped ? "true" : "false"}>
        <div
          role="button"
          className="flip-stage"
          tabIndex={0}
          aria-pressed={flipped}
          aria-label={flipped ? "Show portrait" : "Flip to read About"}
          onKeyDown={onKeyDown}
          {...flipControls}
        >
          <div className="glass-panel portrait-static" style={{ padding: flipped ? 18 : 14, width: "100%", height: "100%" }}>
            {flipped ? <AboutContent /> : <Portrait />}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flip-perspective" data-flipped={flipped ? "true" : "false"} style={{ perspective: 1200 }}>
      <div
        role="button"
        className="flip-stage"
        tabIndex={0}
        aria-pressed={flipped}
        aria-label={flipped ? "Show portrait" : "Flip to read About"}
        onKeyDown={onKeyDown}
        {...flipControls}
      >
        <m.div
          className="flip-card"
          animate={{ rotateY: flipped ? 180 : 0 }}
          transition={{ duration: FLIP_DURATION, ease: FLIP_EASE }}
          style={{ position: "relative", transformStyle: "preserve-3d" }}
        >
          <div className="glass-panel flip-face flip-front" style={{ padding: 14 }}>
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
          <div
            className="glass-panel flip-face flip-back portrait-back"
            style={{ transform: "rotateY(180deg)", padding: 24, display: "flex", alignItems: "center" }}
          >
            <AboutContent />
          </div>
        </m.div>
      </div>
    </div>
  );
}

// The action panel content: brand statement + nav CTAs + availability. When the
// portrait is flipped to About (`collapsed`), the descriptive lines hide so only
// the buttons remain — the About reads the detail, and this points the eye at the
// next action (and frees height so the taller About card always fits).
export function ActionPanel({ onNavigate, collapsed = false }) {
  const reduce = useReducedMotion();
  return (
    <div className="action-panel" data-collapsed={collapsed ? "true" : undefined}>
      {!collapsed && <p className="hero-intro">{highlightPillars(INTRO)}</p>}
      <div className="hero-cta-row">
        <button type="button" className="glass-button btn-accent" onClick={() => onNavigate("projects")}>
          <span aria-hidden="true">↗</span> View experience <span aria-hidden="true" className="btn-arrow">→</span>
        </button>
        <button type="button" className="glass-button" onClick={() => onNavigate("contact")}>
          <span aria-hidden="true">
            <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" focusable="false" style={{ display: "block" }}>
              <path fillRule="evenodd" clipRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" />
            </svg>
          </span>{" "}
          Book a chat
        </button>
        {/* Testimonials — the 3rd, lowest-emphasis CTA. It's the collapsed state of
            the testimonials; on the portrait-flip trigger it gives way to the
            expanded block below. */}
        {!collapsed && (
          <button type="button" className="glass-button btn-tertiary" onClick={() => onNavigate("testimonials")}>
            <span aria-hidden="true" className="tm-cta-mark">“</span> Testimonials
          </button>
        )}
      </div>
      {!collapsed && (
        <p className="hero-avail">
          <span aria-hidden="true">⌖</span> <span className="avail-city">{LOC_CITY}</span>
          {LOC_REGION ? `, ${LOC_REGION}` : ""} · Open to analytics and cloud roles
        </p>
      )}
      {/* On the flip trigger the descriptive lines + the tertiary CTA hide, and the
          testimonials expand into the freed space. */}
      {collapsed && (
        <m.div
          className="tm-slot"
          initial={reduce ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: reduce ? 0 : 0.25, delay: reduce ? 0 : 0.1 }}
        >
          <Testimonials variant="expanded" onNavigate={onNavigate} />
        </m.div>
      )}
    </div>
  );
}
