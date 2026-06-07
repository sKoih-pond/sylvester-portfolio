// Slim top nav shown once a pane is open: switch panes (active highlighted).
// The logo + Download CV live in the header (persistent); Esc/Back return home.
export default function NavBar({ view, onNavigate }) {
  return (
    <nav className="navbar" aria-label="Sections">
      <button
        type="button"
        className="nav-btn"
        aria-current={view === "projects" ? "true" : undefined}
        onClick={() => onNavigate("projects")}
      >
        <span aria-hidden="true">↗</span> <span className="nav-label">Projects</span>
      </button>
      <button
        type="button"
        className="nav-btn"
        aria-current={view === "contact" ? "true" : undefined}
        onClick={() => onNavigate("contact")}
      >
        <span aria-hidden="true">{"✉︎"}</span> <span className="nav-label">Contact</span>
      </button>
    </nav>
  );
}
