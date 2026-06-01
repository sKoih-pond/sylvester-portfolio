import Radar from "./Radar.jsx";
import Reveal from "./Reveal.jsx";
import { experience, projects, AXES, MAX_AXIS } from "../data/profile.js";
import { useActiveEntry } from "../hooks/useActiveEntry.js";

// One shared radar serving BOTH work experience and projects. It is the hero
// element of the section: at rest it shows the aggregate capability profile
// (per-axis max across every entry); hovering/tapping any entry morphs it to
// that entry's mapped axes and dims the others.

const ALL = [
  ...experience.map((e) => ({ id: e.id, label: e.role, axes: e.axes })),
  ...projects.map((p) => ({ id: p.id, label: p.title, axes: p.axes })),
];

// Aggregate resting shape = per-axis max over all entries.
const RESTING = AXES.map((_, i) => Math.max(...ALL.map((e) => e.axes[i])));

function EntryCard({ entry, axes, active, anyActive, getProps, children }) {
  const isActive = active === entry;
  return (
    <li
      {...getProps(entry)}
      aria-pressed={isActive}
      className="glass-card entry-card"
      style={{
        padding: 16,
        cursor: "pointer",
        outline: "none",
        transition: "transform .25s ease, opacity .25s ease",
        transform: isActive ? "translateY(-2px)" : "none",
        opacity: anyActive && !isActive ? 0.55 : 1,
      }}
    >
      {children}
    </li>
  );
}

export default function ExperienceProjects() {
  const { activeId, getProps } = useActiveEntry();
  const active = ALL.find((e) => e.id === activeId);
  const anyActive = !!activeId;

  return (
    <Reveal as="section" id="experience" className="glass-card section-block" style={{ padding: "clamp(1.25rem, 4vw, 2.25rem)" }}>
      <h2 className="section-title">Work &amp; Project Experience</h2>

      {/* Hero element: the single radar */}
      <div className="merged-hero">
        <Radar
          axes={AXES}
          max={MAX_AXIS}
          active={active ? active.axes : null}
          resting={RESTING}
          maxWidth={460}
          idPrefix="radar-main"
        />
        <p className="radar-caption">
          {active ? active.label : "Overall capability — hover an entry to focus"}
        </p>
      </div>

      <div className="merged-grid">
        {/* Work */}
        <div>
          <h3 className="col-label">Work</h3>
          <ul className="entry-list">
            {experience.map((e) => (
              <EntryCard key={e.id} entry={e.id} active={activeId} anyActive={anyActive} getProps={getProps}>
                <h4 style={{ margin: "0 0 2px", fontSize: "1rem", fontWeight: 700 }}>{e.role}</h4>
                <p style={{ margin: "0 0 6px", color: "var(--accent)", fontWeight: 600, fontSize: ".85rem" }}>
                  {e.org} · {e.period}
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.55 }}>{e.blurb}</p>
              </EntryCard>
            ))}
          </ul>
        </div>

        {/* Projects */}
        <div id="projects">
          <h3 className="col-label">Projects</h3>
          <ul className="entry-list">
            {projects.map((p) => (
              <EntryCard key={p.id} entry={p.id} active={activeId} anyActive={anyActive} getProps={getProps}>
                {p.eyebrow && (
                  <p style={{ margin: "0 0 6px", fontSize: ".68rem", letterSpacing: ".1em", textTransform: "uppercase", color: "var(--accent)", fontWeight: 700 }}>
                    <span aria-hidden="true">✈ </span>{p.eyebrow}
                  </p>
                )}
                <h4 style={{ margin: "0 0 8px", fontSize: "1.08rem", fontWeight: 700, lineHeight: 1.25 }}>{p.title}</h4>
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
                          <h5 style={{ margin: "6px 0 6px", fontSize: ".95rem", fontWeight: 700 }}>{c.title}</h5>
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
              </EntryCard>
            ))}
          </ul>
        </div>
      </div>
    </Reveal>
  );
}
