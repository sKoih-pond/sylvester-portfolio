import { useState, useId } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { bio, positioning, contact } from "../data/profile.js";

const hasHover =
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

function Portrait() {
  return (
    <picture>
      <source type="image/webp" srcSet="/assets/profile-1x.webp 1x, /assets/profile-2x.webp 2x" />
      <source type="image/png" srcSet="/assets/profile-1x.png 1x, /assets/profile-2x.png 2x" />
      <img
        src="/assets/profile-1x.png"
        alt="Portrait of Sylvester Koh"
        width="426"
        height="600"
        decoding="async"
        fetchPriority="high"
        style={{ width: "100%", height: "auto", borderRadius: "var(--radius-md)", display: "block" }}
      />
    </picture>
  );
}

function AboutContent() {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <h2 style={{ margin: 0, fontFamily: "var(--font-serif)", fontSize: "1.4rem", fontWeight: 600 }}>About</h2>
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
      <section aria-labelledby={titleId} style={{ display: "grid", gap: "clamp(1.5rem, 4vw, 2.5rem)" }}>
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
      }}
      className="hero-grid"
    >
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
            transition={{ duration: 0.52, ease: [0.22, 0.61, 0.36, 1] }}
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
      <p style={{ fontSize: ".72rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700, margin: "0 0 12px" }}>
        {positioning}
      </p>
      <h1 id={titleId} style={{ fontFamily: "var(--font-serif)", fontSize: "clamp(2.6rem, 8vw, 4.2rem)", fontWeight: 600, lineHeight: 1.05, margin: "0 0 18px" }}>
        Hi, I'm Sylvester
      </h1>
      <p style={{ maxWidth: 520, color: "var(--muted)", lineHeight: 1.6, margin: "0 0 22px" }}>{bio.heroSummary}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
        <a className="glass-button primary" href="#projects"><span aria-hidden="true">↗</span> View projects</a>
        <a className="glass-button" href={contact.cv} download><span aria-hidden="true">⇩</span> Download CV</a>
        <a className="glass-button" href={contact.calendar} target="_blank" rel="noopener noreferrer"><span aria-hidden="true">📅</span> Book a chat</a>
      </div>
      <p style={{ marginTop: 20, color: "var(--muted)", fontSize: ".85rem" }}>
        <span aria-hidden="true">⌖</span> {bio.location} · Open to analytics and cloud roles
      </p>
    </div>
  );
}
