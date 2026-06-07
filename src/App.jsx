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

const HASH_VIEW = { "#projects": "projects", "#contact": "contact" };
function viewFromHash() {
  if (typeof location === "undefined") return "home";
  return HASH_VIEW[location.hash] || "home";
}

export default function App() {
  const theme = useSolarTheme();
  const [view, setView] = useState(viewFromHash);

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

  return (
    <div className="app-shell">
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
          <a className="nav-btn cv-btn" href={contact.cv} download aria-label="Download CV">
            <span aria-hidden="true">⇩</span> <span className="nav-label">CV</span>
          </a>
        </div>

        {view !== "home" && <NavBar view={view} onNavigate={navigate} />}

        <ThemePill icon={theme.icon} label={theme.label} isDark={theme.isDark} onToggle={theme.toggle} />
      </header>

      <main className="stage-wrap" id="main">
        <Stage view={view} onNavigate={navigate} />
      </main>
    </div>
  );
}
