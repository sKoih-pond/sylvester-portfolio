export default function ThemePill({ icon, label }) {
  return (
    <div
      className="glass-card"
      aria-live="polite"
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "8px 14px",
        borderRadius: "var(--radius-sm)",
        fontSize: ".8rem",
        color: "var(--text)",
        whiteSpace: "nowrap",
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </div>
  );
}
