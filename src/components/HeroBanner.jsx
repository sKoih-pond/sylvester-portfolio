// Full-bleed background layer behind the hero. Decorative only (aria-hidden,
// pointer-events:none). The soft accent glows come from CSS (.hero-banner);
// this SVG adds the brand's "signal" — a faint data-pipeline line with a few
// nodes (operational data flowing toward a clear decision). Keyed to theme
// tokens, so it re-tints with the solar palette. No animation: calm and legible.
// The CSS masks both top and bottom so it melts seamlessly into the page.
export default function HeroBanner() {
  return (
    <div className="hero-banner" aria-hidden="true">
      <svg
        className="hero-banner__svg"
        viewBox="0 0 1200 420"
        preserveAspectRatio="xMidYMid slice"
        focusable="false"
      >
        {/* Pipeline signal line */}
        <path
          className="hb-line"
          d="M-40 286 C 180 210, 300 350, 540 280 S 940 168, 1240 232"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="2"
          strokeOpacity="0.12"
          strokeLinecap="round"
        />
        {/* Secondary, dashed under-current */}
        <path
          className="hb-line"
          d="M-40 322 C 240 268, 380 392, 620 320 S 980 236, 1240 292"
          fill="none"
          stroke="var(--accent)"
          strokeWidth="1.5"
          strokeOpacity="0.10"
          strokeDasharray="2 9"
          strokeLinecap="round"
        />
        {/* Data nodes along the primary line */}
        <g fill="var(--accent)" fillOpacity="0.18">
          <circle cx="180" cy="232" r="3.5" />
          <circle cx="540" cy="280" r="3.5" />
          <circle cx="840" cy="206" r="3.5" />
          <circle cx="1140" cy="240" r="4" fillOpacity="0.28" />
        </g>
      </svg>
    </div>
  );
}
