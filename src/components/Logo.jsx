// "The Stack" mark — three rising bars reading as a data stack (kohstack), an
// analytics growth trend, and clarity built layer on layer. Even transparent
// padding (9px) all round. In the header it inherits the theme accent via
// currentColor; the tonal steps stay high enough to read on the dark-theme tile.
export default function Logo({ size = 26, title = "kohstack", className }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      role="img"
      aria-label={title}
      className={className}
      focusable="false"
    >
      <title>{title}</title>
      <g fill="currentColor">
        <rect x="9" y="9" width="46" height="10" rx="5" />
        <rect x="9" y="27" width="37" height="10" rx="5" opacity="0.72" />
        <rect x="9" y="45" width="28" height="10" rx="5" opacity="0.48" />
      </g>
    </svg>
  );
}
