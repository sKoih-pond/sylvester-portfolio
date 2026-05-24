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
  const { phase, elevation, rising } = Solar.sunPhase(new Date(), loc.lat, loc.lon);
  const osDark = !!(window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const phaseName = phase;

  document.documentElement.style.setProperty("--sun-elevation", elevation.toFixed(2));

  // Apply continuous OKLab-interpolated palette tokens from Palette.resolve().
  // These inline styles override the four [data-theme] CSS blocks, which remain
  // unchanged and serve only as the interpolation anchors.
  if (window.Palette) {
    const tokens = window.Palette.resolve(elevation, rising, osDark);
    for (const name in tokens) {
      document.documentElement.style.setProperty(name, tokens[name]);
    }
  }

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

// Every 2 minutes — tighter interval lets the breathing palette track the sun smoothly.
(function scheduleReevaluation() {
  setTimeout(function () {
    _applyNow();
    scheduleReevaluation();
  }, 2 * 60 * 1000);
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
