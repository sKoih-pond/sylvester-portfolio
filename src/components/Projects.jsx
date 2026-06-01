import Radar from "./Radar.jsx";
import Reveal from "./Reveal.jsx";
import { projects, AXES, MAX_AXIS } from "../data/profile.js";
import { useActiveEntry } from "../hooks/useActiveEntry.js";

export default function Projects() {
  const { activeId, getProps } = useActiveEntry();
  const active = projects.find((p) => p.id === activeId);

  return (
    <Reveal as="section" className="glass-card section-block" style={{ padding: "clamp(1.25rem, 4vw, 2rem)" }} id="projects">
      <h2 className="section-title">Projects</h2>
      <div className="radar-layout">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 14 }}>
          {projects.map((p) => {
            const isActive = activeId === p.id;
            return (
              <li
                key={p.id}
                {...getProps(p.id)}
                className="glass-card entry-card"
                aria-pressed={isActive}
                style={{
                  padding: 18,
                  cursor: "pointer",
                  transition: "transform .25s ease, opacity .25s ease, box-shadow .25s ease",
                  transform: isActive ? "translateY(-2px)" : "none",
                  opacity: activeId && !isActive ? 0.6 : 1,
                  boxShadow: p.flagship ? "var(--lift-inner), var(--lift-outer), 0 0 0 1px var(--accent-soft), var(--shadow-soft)" : undefined,
                  outline: "none",
                }}
              >
                {p.eyebrow && (
                  <p style={{ margin: "0 0 6px", fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                    <span aria-hidden="true">✈ </span>{p.eyebrow}
                  </p>
                )}
                <h3 style={{ margin: "0 0 8px", fontSize: "1.12rem", fontWeight: 700, lineHeight: 1.25 }}>{p.title}</h3>
                <p style={{ margin: "0 0 14px", color: "var(--muted)", fontSize: ".9rem", lineHeight: 1.55 }}>{p.summary}</p>

                <a
                  className="glass-button primary"
                  href={p.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  style={{ fontSize: ".85rem", padding: "10px 16px" }}
                >
                  <span aria-hidden="true">↗</span> View project
                </a>

                {p.components?.length > 0 && (
                  <div style={{ marginTop: 16, paddingTop: 14, borderTop: "1px solid var(--border-soft)" }}>
                    <p style={{ margin: "0 0 10px", fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--muted)", fontWeight: 700 }}>
                      Platform components
                    </p>
                    <div style={{ display: "grid", gap: 10 }}>
                      {p.components.map((c) => (
                        <div key={c.title} className="glass-card" style={{ padding: 14 }}>
                          <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "1.1rem" }}>{c.icon}</span>
                          <h4 style={{ margin: "6px 0 6px", fontSize: ".95rem", fontWeight: 700 }}>{c.title}</h4>
                          <p style={{ margin: 0, color: "var(--muted)", fontSize: ".84rem", lineHeight: 1.5 }}>{c.body}</p>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: 7, marginTop: 10 }}>
                            {c.tags.map((t) => (
                              <span key={t} style={{ padding: "5px 9px", borderRadius: 999, background: "var(--surface-soft)", color: "var(--muted)", fontSize: ".72rem" }}>{t}</span>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>

        <div style={{ display: "grid", placeItems: "center", alignSelf: "start", position: "sticky", top: 80 }}>
          <Radar axes={AXES} max={MAX_AXIS} active={active ? active.axes : null} idPrefix="radar-proj" />
        </div>
      </div>
    </Reveal>
  );
}
