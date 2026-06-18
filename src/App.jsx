// Full-viewport, scroll-free SPA: a single "stage" where the hero panel morphs
// into the Projects / Contact panes. No traditional menu or page scroll.
import { useState, useEffect, useCallback } from "react";
import { useSolarTheme } from "./theme/useSolarTheme.js";
import { contact } from "./data/profile.js";
import ThemePill from "./components/ThemePill.jsx";
import Logo from "./components/Logo.jsx";
import NavBar from "./components/NavBar.jsx";
import Stage from "./components/Stage.jsx";
import HeroBanner from "./components/HeroBanner.jsx";

const HASH_VIEW = { "#projects": "projects", "#contact": "contact", "#testimonials": "testimonials" };
function viewFromHash() {
  if (typeof location === "undefined") return "home";
  return HASH_VIEW[location.hash] || "home";
}

// Elements that are real targets (controls, content cards, text, media) and so
// must NOT trigger an empty-surface click. Everything else (gutters, padding,
// gaps, blank panel/header space) is treated as empty space.
const SAFE_TARGETS =
  'a, button, input, select, textarea, [role="button"], .navbar, .entry-card,' +
  " li, h1, h2, h3, h4, h5, h6, p, span, strong, em, b, i, svg, img";

export default function App() {
  const theme = useSolarTheme();
  const [view, setView] = useState(viewFromHash);
  // Shared so an empty-space click on home can flip the portrait to About — the
  // same result as hovering it (the portrait owns this when hovered/tapped).
  const [aboutOpen, setAboutOpen] = useState(false);

  // Reflect the view in the URL hash so deep-links + the browser Back button work.
  const navigate = useCallback((v) => {
    if (v === "home") {
      if (location.hash) history.pushState("", document.title, location.pathname + location.search);
    } else if (location.hash !== `#${v}`) {
      location.hash = v; // fires hashchange → setView
    }
    setView(v);
  }, []);

  useEffect(() => {
    const onHash = () => setView(viewFromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  // Esc returns to the hero.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") navigate("home");
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [navigate]);

  // Reset the About flip whenever we leave home.
  useEffect(() => {
    if (view !== "home") setAboutOpen(false);
  }, [view]);

  // Empty-surface click. In a pane: the gutters, blank header space, and empty
  // areas inside the pane (padding, gaps, space around the radar) all return
  // home — so it reads as one panel flipping in place. On home: the same empty
  // space (minus the header) flips the portrait to About, mirroring the hover.
  // Real targets — controls, the nav cluster, content cards, text/media — are
  // always spared.
  const onSurfaceClick = useCallback(
    (e) => {
      if (e.target.closest(SAFE_TARGETS)) return;
      if (view === "home") {
        if (e.target.closest(".app-header")) return; // header isn't part of the flip surface
        setAboutOpen((o) => !o);
      } else {
        navigate("home");
      }
    },
    [view, navigate]
  );

  return (
    <div className="app-shell" data-pane={view !== "home" ? "true" : undefined} onClick={onSurfaceClick}>
      {/* Decorative backdrop behind the whole shell (incl. the header) so it
          blends seamlessly with the header instead of starting below it. */}
      {view === "home" && <HeroBanner />}

      <header className="app-header">
        <div className="header-left">
          <button type="button" className="logo-btn" onClick={() => navigate("home")} aria-label="kohstack — home">
            <span
              aria-hidden="true"
              className="glass-card"
              style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "var(--radius-sm)", color: "var(--accent)" }}
            >
              <Logo size={24} />
            </span>
            <span>Sylvester Koh</span>
          </button>
          <a className="nav-btn cv-btn" href={contact.cv} download="Sylvester Koh CV.pdf" aria-label="Download CV">
            <span aria-hidden="true">⇩</span> <span className="nav-label">CV</span>
          </a>
        </div>

        {view !== "home" && <NavBar view={view} onNavigate={navigate} />}

        <ThemePill icon={theme.icon} label={theme.label} isDark={theme.isDark} onToggle={theme.toggle} />
      </header>

      <main className="stage-wrap" id="main">
        <Stage view={view} onNavigate={navigate} aboutOpen={aboutOpen} onAboutChange={setAboutOpen} />
      </main>
    </div>
  );
}
