// Top-right theme pill. Shows the current solar phase and doubles as a
// day/night toggle (manual override of the auto solar theme).
export default function ThemePill({ icon, label, isDark, onToggle }) {
  const target = isDark ? "day" : "night";
  return (
    <button
      type="button"
      className="glass-card theme-pill"
      data-dark={isDark ? "true" : "false"}
      onClick={onToggle}
      aria-label={`Switch to ${target} mode`}
      title={`Switch to ${target} mode`}
    >
      <span aria-hidden="true">{icon}</span>
      <span aria-live="polite">{label}</span>
      <span className="theme-pill__switch" aria-hidden="true">
        <span className="theme-pill__knob" />
      </span>
    </button>
  );
}
