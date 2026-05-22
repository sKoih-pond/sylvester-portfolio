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
// Reads data-theme and data-weather from <html>; city from _resolvedCity.
// ---------------------------------------------------------------------------

let _resolvedCity = null;  // set when Solar.resolveLocation() resolves with an IP city

window.composeThemeLabel = function () {
  const theme   = document.documentElement.dataset.theme   || "";
  const weather = document.documentElement.dataset.weather || "";
  const phase   = PHASES[theme];
  const themeText = phase ? phase.label : "Adaptive theme";
  // Split on hyphens so "partly-cloudy" → "Partly Cloudy"
  const weatherText = weather
    ? weather.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")
    : "";
  const cityText = _resolvedCity || "";
  let label = themeText;
  if (weatherText) label += " · " + weatherText;
  if (cityText)    label += " · " + cityText;
  return label;
};

// ---------------------------------------------------------------------------
// Phase selection
// ---------------------------------------------------------------------------

// Returns both the effective phase name and the raw solar elevation so
// _applyNow can set --sun-elevation in a single Solar.sunPhase() call.
function getEffectivePhase(date, lat, lon) {
  const { phase, elevation } = Solar.sunPhase(date, lat, lon);
  // OS dark-mode override: morning/day → render as night for users who prefer dark.
  const phaseName =
    (phase === "morning" || phase === "day") &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "night"
      : phase;
  return { phaseName, elevation };
}

function applyTheme(phaseName) {
  const phase = PHASES[phaseName];
  if (!phase) return;
  document.documentElement.dataset.theme = phaseName;
  const icon = document.querySelector(".theme-icon");
  const text = document.getElementById("theme-label");
  if (icon) icon.textContent = phase.icon;
  if (text) text.textContent = window.composeThemeLabel();
}

// ---------------------------------------------------------------------------
// Location state — starts with the DST-free default, refined asynchronously.
// ---------------------------------------------------------------------------

const _defaultLoc = Solar.defaultLocation();
let   _refinedLoc = null;

function _resolvedLoc() { return _refinedLoc || _defaultLoc; }

function _applyNow() {
  const loc = _resolvedLoc();
  const { phaseName, elevation } = getEffectivePhase(new Date(), loc.lat, loc.lon);
  // Expose raw elevation as a CSS custom property for optional future use.
  // Does not modify the four daylight palettes.
  document.documentElement.style.setProperty("--sun-elevation", elevation.toFixed(2));
  applyTheme(phaseName);
}

// ---------------------------------------------------------------------------
// First paint — synchronous, flash-free.
// Uses defaultLocation() (timezone-derived longitude, Sydney latitude).
// ---------------------------------------------------------------------------

_applyNow();

// ---------------------------------------------------------------------------
// Async refinement — cascade: GPS (if granted) → IP → timezone default.
// Re-applies the phase once we have a more accurate location; also picks up
// city name from IP for the theme pill.
// ---------------------------------------------------------------------------

Solar.resolveLocation().then(function (loc) {
  _refinedLoc = loc;
  // Show city name in pill only when IP geolocation found one; GPS gives
  // coordinates but no city, default gives nothing useful to display.
  _resolvedCity = (loc.source === "ip" && loc.city) ? loc.city : null;
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
