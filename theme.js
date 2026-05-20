const THEME_SCHEDULE = [
  { name: "morning", label: "Morning mode", icon: "☼", start: 6, end: 10 },
  { name: "day", label: "Day mode", icon: "☀︎", start: 10, end: 17 },
  { name: "sunset", label: "Sunset mode", icon: "◒", start: 17, end: 21 },
  { name: "night", label: "Night mode", icon: "☾", start: 21, end: 6 }
];

function getThemeForLocalHour(hour = new Date().getHours()) {
  return THEME_SCHEDULE.find(theme => {
    if (theme.start < theme.end) return hour >= theme.start && hour < theme.end;
    return hour >= theme.start || hour < theme.end;
  }) || THEME_SCHEDULE[1];
}

// If the OS is set to dark mode and the time-based theme would be a light
// one (morning or day), defer to night rather than forcing a bright palette
// on a user who explicitly prefers dark. Sunset and night already read dark,
// so they are left untouched.
function getEffectiveTheme(hour = new Date().getHours()) {
  const timeTheme = getThemeForLocalHour(hour);
  if (
    (timeTheme.name === "morning" || timeTheme.name === "day") &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  ) {
    return THEME_SCHEDULE.find(t => t.name === "night") || timeTheme;
  }
  return timeTheme;
}

function applyTheme(theme) {
  document.documentElement.dataset.theme = theme.name;
  const label = document.getElementById("theme-label");
  const icon = document.querySelector(".theme-icon");
  if (label) label.textContent = `${theme.label} · local time`;
  if (icon) icon.textContent = theme.icon;
}

function scheduleNextThemeCheck() {
  const now = new Date();
  const next = new Date(now);
  next.setMinutes(0, 0, 0);
  next.setHours(now.getHours() + 1);
  window.setTimeout(() => {
    applyTheme(getEffectiveTheme());
    scheduleNextThemeCheck();
  }, next.getTime() - now.getTime());
}

applyTheme(getEffectiveTheme());
scheduleNextThemeCheck();

// Re-evaluate if the user toggles OS dark mode while the page is open
if (window.matchMedia) {
  window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", () => {
    applyTheme(getEffectiveTheme());
  });
}

const menuButton = document.querySelector(".menu-toggle");
const nav = document.querySelector(".site-nav");

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
