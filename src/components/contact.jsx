// Contact / closing CTA section.
// Layout adapted from the @efferd contact-2 + cta-4 blocks, restyled to the
// site's warm liquid-glass theme with real channels (no placeholder data).
import { contact, bio } from "../data/profile.js";

const channels = [
  {
    title: "Email",
    desc: "Best for a detailed message — I reply within a day.",
    label: contact.email,
    href: `mailto:${contact.email}`,
    icon: "✉",
  },
  {
    title: "LinkedIn",
    desc: "Connect or message me about a role.",
    label: "in/sylvester-koh",
    href: contact.linkedin,
    icon: "in",
    ext: true,
  },
  {
    title: "GitHub",
    desc: "Browse the code behind my projects.",
    label: "sKoih-pond",
    href: contact.github,
    icon: "◈",
    ext: true,
  },
];

export function Contact({ onNavigate }) {
  return (
    <section id="contact" aria-labelledby="contact-heading" className="pane-contact">
      <h2 className="pane-title" id="contact-heading">Let's work together</h2>
      {/* cta-4 style: supporting line + a single primary action */}
      <div style={{ maxWidth: 560, margin: "0 auto", textAlign: "center" }}>
        <p style={{ margin: "0 0 20px", color: "var(--muted)", lineHeight: 1.6 }}>
          {bio.location} · open to analytics and cloud roles. Book a quick call, or reach out through any channel below.
        </p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12, justifyContent: "center" }}>
          <a className="glass-button btn-accent" href={contact.calendar} target="_blank" rel="noopener noreferrer">
            <span aria-hidden="true">📅</span> Book a chat <span aria-hidden="true" className="btn-arrow">→</span>
          </a>
          <button type="button" className="glass-button" onClick={() => onNavigate?.("projects")}>
            <span aria-hidden="true">↗</span> View experience
          </button>
        </div>
      </div>

      {/* contact-2 style: channel cards */}
      <div className="contact-grid">
        {channels.map((c) => (
          <a
            key={c.title}
            className="glass-card contact-card"
            href={c.href}
            {...(c.ext ? { target: "_blank", rel: "noopener noreferrer" } : {})}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
              <span aria-hidden="true" className="c-icon">{c.icon}</span>
              <h3 style={{ margin: 0, fontSize: ".95rem", fontWeight: 700 }}>{c.title}</h3>
            </div>
            <p style={{ margin: "8px 0 12px", color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.45 }}>{c.desc}</p>
            <span className="c-link">{c.label} <span aria-hidden="true">→</span></span>
          </a>
        ))}
      </div>
    </section>
  );
}
