import { contact } from "../data/profile.js";

const links = [
  { href: `mailto:${contact.email}`, icon: "✉", label: contact.email },
  { href: contact.linkedin, icon: "in", label: "linkedin.com/in/sylvester-koh", ext: true },
  { href: contact.github, icon: "◈", label: "github.com/sKoih-pond", ext: true },
  { href: contact.calendar, icon: "📅", label: "Book a 30-min chat", ext: true },
];

export default function Footer() {
  return (
    <footer
      id="contact"
      className="glass-panel"
      aria-label="Contact"
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
        gap: 12,
        padding: "20px 24px",
        marginTop: "clamp(2rem, 6vw, 4rem)",
      }}
    >
      {links.map((l) => (
        <a
          key={l.label}
          href={l.href}
          {...(l.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 9, color: "var(--muted)", fontSize: ".9rem" }}
        >
          <span aria-hidden="true">{l.icon}</span>
          {l.label}
        </a>
      ))}
    </footer>
  );
}
