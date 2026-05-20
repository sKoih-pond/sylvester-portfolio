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
    applyTheme(getThemeForLocalHour());
    scheduleNextThemeCheck();
  }, next.getTime() - now.getTime());
}

applyTheme(getThemeForLocalHour());
scheduleNextThemeCheck();

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
