// Contact / closing CTA section.
// Layout adapted from the @efferd contact-2 + cta-4 blocks, restyled to the
// site's warm liquid-glass theme with real channels (no placeholder data).
import { contact, bio } from "../data/profile.js";

// Monochrome brand/icon SVGs (inherit the theme accent via currentColor), all
// drawn at 1em so Email, LinkedIn and GitHub render at a consistent size.
const ICONS = {
  email: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M1.5 8.67v8.58a3 3 0 0 0 3 3h15a3 3 0 0 0 3-3V8.67l-8.93 5.49a3 3 0 0 1-3.14 0L1.5 8.67Z" />
      <path d="M22.5 6.91V6.75a3 3 0 0 0-3-3h-15a3 3 0 0 0-3 3v.16l9.71 5.98a1.5 1.5 0 0 0 1.58 0L22.5 6.91Z" />
    </svg>
  ),
  linkedin: (
    <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M20.45 20.45h-3.56v-5.57c0-1.33-.02-3.04-1.85-3.04-1.86 0-2.14 1.45-2.14 2.94v5.67H9.34V9h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.72v20.56C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.72V1.72C24 .77 23.2 0 22.22 0z" />
    </svg>
  ),
  github: (
    <svg viewBox="0 0 16 16" width="1em" height="1em" fill="currentColor" aria-hidden="true" focusable="false">
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.65 7.65 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.66 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z" />
    </svg>
  ),
};

const channels = [
  {
    title: "Email",
    desc: "Best for a detailed message, I reply within a day.",
    label: contact.email,
    href: `mailto:${contact.email}`,
    icon: "email",
  },
  {
    title: "LinkedIn",
    desc: "Connect or message me about a role.",
    label: "in/sylvester-koh",
    href: contact.linkedin,
    icon: "linkedin",
    ext: true,
  },
  {
    title: "GitHub",
    desc: "Browse the code behind my projects.",
    label: "sKoih-pond",
    href: contact.github,
    icon: "github",
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
            <span aria-hidden="true">
              <svg viewBox="0 0 24 24" width="1em" height="1em" fill="currentColor" focusable="false" style={{ display: "block" }}>
                <path fillRule="evenodd" clipRule="evenodd" d="M6.75 2.25A.75.75 0 0 1 7.5 3v1.5h9V3a.75.75 0 0 1 1.5 0v1.5h.75a3 3 0 0 1 3 3v11.25a3 3 0 0 1-3 3H5.25a3 3 0 0 1-3-3V7.5a3 3 0 0 1 3-3H6V3a.75.75 0 0 1 .75-.75Zm13.5 9a1.5 1.5 0 0 0-1.5-1.5H5.25a1.5 1.5 0 0 0-1.5 1.5v7.5a1.5 1.5 0 0 0 1.5 1.5h13.5a1.5 1.5 0 0 0 1.5-1.5v-7.5Z" />
              </svg>
            </span>{" "}
            Book a chat <span aria-hidden="true" className="btn-arrow">→</span>
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
            <div className="c-head">
              <span aria-hidden="true" className="c-icon">{ICONS[c.icon]}</span>
              <h3 className="c-title">{c.title}</h3>
            </div>
            <p className="c-desc">{c.desc}</p>
            <span className="c-link">{c.label} <span aria-hidden="true">→</span></span>
          </a>
        ))}
      </div>
    </section>
  );
}
