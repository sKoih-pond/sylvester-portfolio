import Radar from "./Radar.jsx";
import { experience, projects, AXES, MAX_AXIS } from "../data/profile.js";
import { useActiveEntry } from "../hooks/useActiveEntry.js";

// One shared radar serving BOTH work experience and projects, as the centre
// hero element. Work flanks it on the left, Projects on the right, so the whole
// section fits in one viewport without scrolling. At rest the radar shows the
// aggregate capability profile (per-axis max); hover/tap any entry morphs it.

const ALL = [
  ...experience.map((e) => ({ id: e.id, label: e.role, axes: e.axes })),
  ...projects.map((p) => ({ id: p.id, label: p.title, axes: p.axes })),
];
const RESTING = AXES.map((_, i) => Math.max(...ALL.map((e) => e.axes[i])));

function cardStyle(isActive, anyActive) {
  return {
    padding: 11,
    cursor: "pointer",
    outline: "none",
    transition: "transform .25s ease, opacity .25s ease",
    transform: isActive ? "translateY(-2px)" : "none",
    opacity: anyActive && !isActive ? 0.5 : 1,
  };
}

export default function ExperienceProjects() {
  const { activeId, getProps } = useActiveEntry();
  const active = ALL.find((e) => e.id === activeId);
  const anyActive = !!activeId;
  const primary = experience.filter((e) => e.tier !== "earlier");
  const earlier = experience.filter((e) => e.tier === "earlier");

  return (
    <section id="experience" className="pane-experience">
      <h2 className="pane-title">Work &amp; Project Experience</h2>

      <div className="merged-3col">
        {/* Work — left */}
        <div className="merged-col">
          <h3 className="col-label">Work</h3>
          <ul className="entry-list">
            {primary.map((e) => {
              const isActive = activeId === e.id;
              return (
                <li key={e.id} {...getProps(e.id)} aria-pressed={isActive} className="glass-card entry-card" style={cardStyle(isActive, anyActive)}>
                  <h4 style={{ margin: "0 0 2px", fontSize: ".92rem", fontWeight: 700, lineHeight: 1.2 }}>{e.role}</h4>
                  <p style={{ margin: "0 0 5px", color: "var(--accent)", fontWeight: 600, fontSize: ".78rem" }}>{e.org} · {e.period}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.45 }}>{e.blurb}</p>
                </li>
              );
            })}
          </ul>

          {earlier.length > 0 && (
            <>
              <h3 className="col-label" style={{ marginTop: 16 }}>Earlier</h3>
              <ul className="entry-list">
                {earlier.map((e) => {
                  const isActive = activeId === e.id;
                  return (
                    <li key={e.id} {...getProps(e.id)} aria-pressed={isActive} className="glass-card entry-card" style={{ ...cardStyle(isActive, anyActive), padding: 11 }}>
                      <h4 style={{ margin: "0 0 1px", fontSize: ".82rem", fontWeight: 700, lineHeight: 1.2 }}>{e.role}</h4>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: ".72rem" }}>{e.org} · {e.period}</p>
                    </li>
                  );
                })}
              </ul>
            </>
          )}
        </div>

        {/* Radar — centre hero */}
        <div className="radar-col">
          <Radar axes={AXES} max={MAX_AXIS} active={active ? active.axes : null} resting={RESTING} maxWidth={340} idPrefix="radar-main" />
          <p className="radar-caption">{active ? active.label : ""}</p>
        </div>

        {/* Projects — right */}
        <div className="merged-col" id="projects">
          <h3 className="col-label">Projects</h3>
          <ul className="entry-list">
            {projects.map((p) => {
              const isActive = activeId === p.id;
              return (
                <li key={p.id} {...getProps(p.id)} aria-pressed={isActive} className="glass-card entry-card" style={cardStyle(isActive, anyActive)}>
                  {p.eyebrow && (
                    <p style={{ margin: "0 0 4px", fontSize: ".64rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                      <span aria-hidden="true">✈ </span>{p.eyebrow}
                    </p>
                  )}
                  <h4 style={{ margin: "0 0 5px", fontSize: ".98rem", fontWeight: 700, lineHeight: 1.22 }}>{p.title}</h4>
                  <p style={{ margin: "0 0 8px", color: "var(--muted)", fontSize: ".82rem", lineHeight: 1.4 }}>{p.summary}</p>
                  <a
                    className="glass-button primary"
                    href={p.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    style={{ fontSize: ".8rem", padding: "8px 14px" }}
                  >
                    <span aria-hidden="true">↗</span> View project
                  </a>
                  {p.components?.length > 0 && (
                    <ul style={{ listStyle: "none", margin: "9px 0 0", padding: "9px 0 0", borderTop: "1px solid var(--border-soft)", display: "grid", gap: 8 }}>
                      {p.components.map((c) => (
                        <li key={c.title} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                          <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: ".95rem", lineHeight: 1.3 }}>{c.icon}</span>
                          <div>
                            <div style={{ fontSize: ".82rem", fontWeight: 700, lineHeight: 1.25 }}>{c.title}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                              {c.tags.map((t) => (
                                <span key={t} style={{ padding: "3px 7px", borderRadius: 999, background: "var(--surface-soft)", color: "var(--muted)", fontSize: ".68rem" }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      </div>
    </section>
  );
}
