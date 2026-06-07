import { useId, useRef, useEffect, useState } from "react";
import { m, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { HeroGreeting, PortraitCard, ActionPanel, FLIP_DURATION, FLIP_EASE } from "./Hero.jsx";
import ExperienceProjects from "./ExperienceProjects.jsx";
import { Contact } from "./contact.jsx";

// The single full-viewport stage. The frosted panel is a persistent element that
// morphs (Framer `layout`) from the hero's lower-left cell to the full stage as
// the greeting + portrait recede (AnimatePresence popLayout). Pane content
// cross-fades inside the panel; tall panes scroll internally (.pane-scroll).
export default function Stage({ view, onNavigate }) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef(null);
  // Portrait flip state, shared so the action panel collapses to just its buttons
  // while About is showing (About supplies the detail).
  const [aboutOpen, setAboutOpen] = useState(false);

  const morph = reduce ? { duration: 0 } : { duration: FLIP_DURATION, ease: FLIP_EASE };

  // Move focus to the panel when the view changes (keyboard / screen-reader), and
  // reset the flip when leaving home.
  useEffect(() => {
    if (view !== "home") {
      setAboutOpen(false);
      if (panelRef.current) panelRef.current.focus({ preventScroll: true });
    }
  }, [view]);

  return (
    <LayoutGroup>
      <div className={`stage stage--${view}`}>
        {/* Clicking the area around an open pane dismisses back to home. */}
        {view !== "home" && (
          <div className="stage-backdrop" onClick={() => onNavigate("home")} aria-hidden="true" />
        )}

        <AnimatePresence mode="popLayout">
          {view === "home" && (
            <m.div
              key="greet"
              className="hero-greet"
              initial={reduce ? false : { opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={reduce ? {} : { opacity: 0, y: -16 }}
              transition={morph}
            >
              <HeroGreeting titleId={titleId} />
            </m.div>
          )}
          {view === "home" && (
            <m.div
              key="portrait"
              className="hero-portrait"
              initial={reduce ? false : { opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={reduce ? {} : { opacity: 0, scale: 0.96 }}
              transition={morph}
            >
              <PortraitCard open={aboutOpen} onOpenChange={setAboutOpen} />
            </m.div>
          )}
        </AnimatePresence>

        <m.div layout={!reduce} transition={morph} className="stage-panel">
          <div className="stage-panel__inner" ref={panelRef} tabIndex={-1}>
            <AnimatePresence mode="wait">
              <m.div
                key={view}
                initial={reduce ? false : { opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={reduce ? {} : { opacity: 0 }}
                transition={{ duration: reduce ? 0 : 0.22 }}
                style={{ display: "flex", flexDirection: "column", minHeight: 0, height: "100%" }}
              >
                {view === "home" && <ActionPanel onNavigate={onNavigate} collapsed={aboutOpen} />}
                {view === "projects" && (
                  <div className="pane-scroll">
                    <ExperienceProjects />
                  </div>
                )}
                {view === "contact" && (
                  <div className="pane-scroll">
                    <Contact onNavigate={onNavigate} />
                  </div>
                )}
              </m.div>
            </AnimatePresence>
          </div>
        </m.div>
      </div>
    </LayoutGroup>
  );
}
