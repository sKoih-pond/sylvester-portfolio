// Phase 1 — full composition. All copy/data from approved src/data/profile.js.
import { useSolarTheme } from "./theme/useSolarTheme.js";
import { useLenis } from "./hooks/useLenis.js";
import ThemePill from "./components/ThemePill.jsx";
import Hero from "./components/Hero.jsx";
import ExperienceProjects from "./components/ExperienceProjects.jsx";
import Footer from "./components/Footer.jsx";

export default function App() {
  const theme = useSolarTheme();
  useLenis();

  return (
    <>
      <a
        href="#main"
        style={{ position: "absolute", left: -9999, top: 0 }}
        onFocus={(e) => (e.target.style.left = "12px")}
        onBlur={(e) => (e.target.style.left = "-9999px")}
      >
        Skip to content
      </a>

      <header
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 16,
          width: "min(1180px, calc(100% - 2rem))",
          margin: "0 auto",
          padding: "18px 0",
        }}
      >
        <a href="#main" style={{ display: "inline-flex", alignItems: "center", gap: 10, fontWeight: 700 }}>
          <span
            aria-hidden="true"
            className="glass-card"
            style={{ width: 38, height: 38, display: "grid", placeItems: "center", borderRadius: "var(--radius-sm)", color: "var(--accent)" }}
          >
            SK
          </span>
          <span>Sylvester Koh</span>
        </a>
        <ThemePill icon={theme.icon} label={theme.label} />
      </header>

      <main id="main" style={{ width: "min(1180px, calc(100% - 2rem))", margin: "0 auto", paddingBottom: "2rem" }}>
        <Hero />
        <ExperienceProjects />
        <Footer />
      </main>
    </>
  );
}
