import { useId, useRef, useEffect } from "react";
import { m, AnimatePresence, LayoutGroup, useReducedMotion } from "framer-motion";
import { HeroGreeting, PortraitCard, ActionPanel, FLIP_DURATION, FLIP_EASE } from "./Hero.jsx";
import ExperienceProjects from "./ExperienceProjects.jsx";
import { Contact } from "./contact.jsx";

// The single full-viewport stage. The frosted panel is a persistent element that
// morphs (Framer `layout`) from the hero's lower-left cell to the full stage as
// the greeting + portrait recede (AnimatePresence popLayout). Pane content
// cross-fades inside the panel; tall panes scroll internally (.pane-scroll).
export default function Stage({ view, onNavigate, aboutOpen, onAboutChange }) {
  const reduce = useReducedMotion();
  const titleId = useId();
  const panelRef = useRef(null);
  // Portrait flip state is owned by App (so an empty-space click on home can flip
  // it too); it collapses the action panel to its buttons while About shows.

  const morph = reduce ? { duration: 0 } : { duration: FLIP_DURATION, ease: FLIP_EASE };

  // Move focus to the panel when the view changes (keyboard / screen-reader).
  useEffect(() => {
    if (view !== "home" && panelRef.current) panelRef.current.focus({ preventScroll: true });
  }, [view]);

  return (
    <LayoutGroup>
      <div className={`stage stage--${view}`}>
        {/* Dismiss-to-home is handled at the app-shell level (any background
            click outside the header + pane), so the whole page surface works. */}
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
              <PortraitCard open={aboutOpen} onOpenChange={onAboutChange} />
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

        {/* Floating, platform-neutral dismiss control. Bottom-centre so it's
            thumb-reachable on mobile and avoids the iOS/Windows corner signal. */}
        {view !== "home" && (
          <div className="close-home-wrap">
            <m.button
              type="button"
              className="close-home"
              onClick={() => onNavigate("home")}
              aria-label="Return to home"
              initial={reduce ? false : { opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduce ? 0 : 0.3, ease: FLIP_EASE }}
            >
              <span aria-hidden="true" className="close-home__x">✕</span>
              <span>Home</span>
            </m.button>
          </div>
        )}
      </div>
    </LayoutGroup>
  );
}
