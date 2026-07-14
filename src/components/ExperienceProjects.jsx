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

// Typography/padding compress with viewport HEIGHT (vh clamps) so the whole pane
// always fits without scrolling on desktop — shrinking the window shrinks the
// text toward a readable floor instead of introducing a scrollbar. On phones the
// vh terms sit at their caps (tall viewports), so mobile is unchanged.
function cardStyle(isActive, anyActive) {
  return {
    padding: "clamp(7px, 1.5vh, 11px)",
    cursor: "pointer",
    outline: "none",
    transition: "transform .25s ease, opacity .25s ease",
    transform: isActive ? "translateY(-2px)" : "none",
    opacity: anyActive && !isActive ? 0.5 : 1,
  };
}

export default function ExperienceProjects() {
  const { activeId, getProps, setActiveId } = useActiveEntry();
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
                  <h4 style={{ margin: "0 0 2px", fontSize: "clamp(.8rem, 1.9vh, .92rem)", fontWeight: 700, lineHeight: 1.2 }}>{e.role}</h4>
                  <p style={{ margin: "0 0 5px", color: "var(--accent)", fontWeight: 600, fontSize: "clamp(.7rem, 1.6vh, .78rem)" }}>{e.org} · {e.period}</p>
                  <p style={{ margin: 0, color: "var(--muted)", fontSize: "clamp(.72rem, 1.7vh, .82rem)", lineHeight: 1.45 }}>{e.blurb}</p>
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
                    <li key={e.id} {...getProps(e.id)} aria-pressed={isActive} className="glass-card entry-card" style={cardStyle(isActive, anyActive)}>
                      <h4 style={{ margin: "0 0 1px", fontSize: "clamp(.72rem, 1.7vh, .82rem)", fontWeight: 700, lineHeight: 1.2 }}>{e.role}</h4>
                      <p style={{ margin: 0, color: "var(--muted)", fontSize: "clamp(.64rem, 1.5vh, .72rem)" }}>{e.org} · {e.period}</p>
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
              // The whole flagship tile is the navigation into the project (morphs
              // to /sgn/). Hover/focus still drives the shared radar.
              const linkHover = {
                onMouseEnter: () => setActiveId(p.id),
                onMouseLeave: () => setActiveId(null),
                onFocus: () => setActiveId(p.id),
                onBlur: () => setActiveId(null),
              };
              return (
                <li key={p.id}>
                  <a
                    className="glass-card entry-card entry-card--link"
                    href={p.href}
                    aria-label={`Open project: ${p.title}`}
                    style={cardStyle(isActive, anyActive)}
                    {...linkHover}
                  >
                  {p.eyebrow && (
                    <p style={{ margin: "0 0 4px", fontSize: "clamp(.58rem, 1.35vh, .64rem)", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                      <span aria-hidden="true">✈ </span>{p.eyebrow}
                    </p>
                  )}
                  <h4 style={{ margin: "0 0 5px", fontSize: "clamp(.86rem, 2vh, .98rem)", fontWeight: 700, lineHeight: 1.22 }}>{p.title}</h4>
                  <p style={{ margin: "0 0 clamp(5px, 1vh, 8px)", color: "var(--muted)", fontSize: "clamp(.72rem, 1.7vh, .82rem)", lineHeight: 1.4 }}>{p.summary}</p>
                  <span className="glass-button primary entry-cta" style={{ fontSize: "clamp(.72rem, 1.65vh, .8rem)", padding: "clamp(5px, 1.1vh, 8px) clamp(10px, 1.8vh, 14px)" }}>
                    View project <span aria-hidden="true" className="btn-arrow">→</span>
                  </span>
                  {p.components?.length > 0 && (
                    <ul style={{ listStyle: "none", margin: "clamp(6px, 1.2vh, 9px) 0 0", padding: "clamp(6px, 1.2vh, 9px) 0 0", borderTop: "1px solid var(--border-soft)", display: "grid", gap: "clamp(5px, 1vh, 8px)" }}>
                      {p.components.map((c) => (
                        <li key={c.title} style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
                          <span aria-hidden="true" style={{ color: "var(--accent)", fontSize: "clamp(.82rem, 1.9vh, .95rem)", lineHeight: 1.3 }}>{c.icon}</span>
                          <div>
                            <div style={{ fontSize: "clamp(.72rem, 1.7vh, .82rem)", fontWeight: 700, lineHeight: 1.25 }}>{c.title}</div>
                            <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginTop: 5 }}>
                              {c.tags.map((t) => (
                                <span key={t} style={{ padding: "3px 7px", borderRadius: 999, background: "var(--surface-soft)", color: "var(--muted)", fontSize: "clamp(.6rem, 1.4vh, .68rem)" }}>{t}</span>
                              ))}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                  </a>
                  {/* Live external proof (e.g. the public Grafana dashboard) sits
                      OUTSIDE the tile anchor — the whole tile is already a link to
                      the project (nested anchors are invalid HTML), and this goes
                      to a different destination. Renders only when the share URL
                      exists (ships dark until then). */}
                  {p.live?.href && (
                    <a
                      href={p.live.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="entry-live"
                      aria-label={`${p.live.label} (opens in a new tab)`}
                    >
                      <span aria-hidden="true" className="entry-live__dot" /> {p.live.label}{" "}
                      <span aria-hidden="true" className="btn-arrow">↗</span>
                    </a>
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
