// Theme engine — drives data-theme on <html> from real sun position via solar.js.
// Runs synchronously (not deferred) so first paint is flash-free.
// solar.js must be loaded before this script.

const PHASES = {
  morning: { label: "Morning mode", icon: "☼" },
  day:     { label: "Day mode",     icon: "☀︎" },
  sunset:  { label: "Sunset mode",  icon: "◒" },
  night:   { label: "Night mode",   icon: "☾" }
};

// ---------------------------------------------------------------------------
// Shared label composer — defined as a global so deferred scene.js can call it
// after updating data-weather without clobbering the phase text.
// ---------------------------------------------------------------------------

window.composeThemeLabel = function () {
  const theme   = document.documentElement.dataset.theme   || "";
  const weather = document.documentElement.dataset.weather || "";
  const phase   = PHASES[theme];
  const themeText   = phase ? phase.label : "Adaptive theme";
  // Bucket names (clear/cloudy/fog/rain/snow) capitalise cleanly as-is.
  const weatherText = weather ? weather.charAt(0).toUpperCase() + weather.slice(1) : "";
  return weatherText ? `${themeText} · ${weatherText}` : themeText;
};

// ---------------------------------------------------------------------------
// Phase selection
// ---------------------------------------------------------------------------

// Wraps solar phase with the OS dark-mode override:
// if the sun says morning/day but the user prefers dark → render night.
function getEffectivePhase(date, lat, lon) {
  const { phase } = Solar.sunPhase(date, lat, lon);
  if (
    (phase === "morning" || phase === "day") &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return "night";
  }
  return phase;
}

function applyTheme(phaseName) {
  const phase = PHASES[phaseName];
  if (!phase) return;
  document.documentElement.dataset.theme = phaseName;
  const label = document.querySelector(".theme-icon");
  const text  = document.getElementById("theme-label");
  if (label) label.textContent = phase.icon;
  if (text)  text.textContent  = window.composeThemeLabel();
}

// ---------------------------------------------------------------------------
// Location state — starts with the DST-free default, refined asynchronously.
// ---------------------------------------------------------------------------

const _defaultLoc = Solar.defaultLocation();
let   _refinedLoc = null;

function _resolvedLoc() { return _refinedLoc || _defaultLoc; }

function _applyNow() {
  applyTheme(getEffectivePhase(new Date(), _resolvedLoc().lat, _resolvedLoc().lon));
}

// ---------------------------------------------------------------------------
// First paint — synchronous, flash-free.
// Uses defaultLocation() (timezone-derived longitude, Sydney latitude).
// ---------------------------------------------------------------------------

_applyNow();

// ---------------------------------------------------------------------------
// Async refinement — re-apply once GPS coordinates are available (if granted).
// ---------------------------------------------------------------------------

Solar.preciseLocation().then(function (coords) {
  if (!coords) return;
  _refinedLoc = coords;
  _applyNow();
});

// ---------------------------------------------------------------------------
// Re-evaluation triggers
// ---------------------------------------------------------------------------

// Every 5 minutes so the phase tracks the moving sun.
(function scheduleReevaluation() {
  setTimeout(function () {
    _applyNow();
    scheduleReevaluation();
  }, 5 * 60 * 1000);
})();

// On tab refocus (handles long device sleep — sun may have moved significantly).
document.addEventListener("visibilitychange", function () {
  if (!document.hidden) _applyNow();
});

// On OS dark-mode toggle while the page is open.
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function () {
    _applyNow();
  });
}

// ---------------------------------------------------------------------------
// Mobile menu — untouched from original
// ---------------------------------------------------------------------------

const menuButton = document.querySelector(".menu-toggle");
const nav        = document.querySelector(".site-nav");

if (menuButton && nav) {
  const closeNav = () => {
    if (nav.classList.contains("is-open")) {
      nav.classList.remove("is-open");
      menuButton.setAttribute("aria-expanded", "false");
    }
  };

  menuButton.addEventListener("click", event => {
    event.stopPropagation();
    const isOpen = nav.classList.toggle("is-open");
    menuButton.setAttribute("aria-expanded", String(isOpen));
  });

  nav.addEventListener("click", event => {
    if (event.target.matches("a")) closeNav();
  });

  document.addEventListener("keydown", event => {
    if (event.key === "Escape") closeNav();
  });

  document.addEventListener("click", event => {
    if (!nav.contains(event.target) && !menuButton.contains(event.target)) {
      closeNav();
    }
  });
}
