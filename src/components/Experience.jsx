import Radar from "./Radar.jsx";
import Reveal from "./Reveal.jsx";
import { experience, AXES, MAX_AXIS } from "../data/profile.js";
import { useActiveEntry } from "../hooks/useActiveEntry.js";

export default function Experience() {
  const { activeId, getProps } = useActiveEntry();
  const active = experience.find((e) => e.id === activeId);

  return (
    <Reveal as="section" className="glass-card section-block" style={{ padding: "clamp(1.25rem, 4vw, 2rem)" }}>
      <h2 className="section-title">Experience</h2>
      <div className="radar-layout">
        <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "flex", flexDirection: "column", gap: 12 }}>
          {experience.map((e) => {
            const isActive = activeId === e.id;
            return (
              <li
                key={e.id}
                {...getProps(e.id)}
                className="glass-card entry-card"
                aria-pressed={isActive}
                style={{
                  padding: 16,
                  cursor: "pointer",
                  transition: "transform .25s ease, opacity .25s ease",
                  transform: isActive ? "translateY(-2px)" : "none",
                  opacity: activeId && !isActive ? 0.6 : 1,
                  outline: "none",
                }}
              >
                <h3 style={{ margin: "0 0 2px", fontSize: "1rem", fontWeight: 700 }}>{e.role}</h3>
                <p style={{ margin: "0 0 6px", color: "var(--accent)", fontWeight: 600, fontSize: ".85rem" }}>
                  {e.org} · {e.period}
                </p>
                <p style={{ margin: 0, color: "var(--muted)", fontSize: ".88rem", lineHeight: 1.55 }}>{e.blurb}</p>
              </li>
            );
          })}
        </ul>

        <div style={{ display: "grid", placeItems: "center" }}>
          <Radar axes={AXES} max={MAX_AXIS} active={active ? active.axes : null} idPrefix="radar-exp" />
        </div>
      </div>
    </Reveal>
  );
}
