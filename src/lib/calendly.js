// Calendly popup, lazy-loaded. The third-party widget script is fetched only
// when someone actually intends to book (on hover/focus to prefetch, or on the
// first click) — visitors who never click "Book a chat" never load Calendly.
// Falls back to opening the booking link in a new tab if the widget can't load.

const WIDGET_CSS = "https://assets.calendly.com/assets/external/widget.css";
const WIDGET_JS = "https://assets.calendly.com/assets/external/widget.js";

let loadPromise = null;

// Inject the widget CSS + JS once; resolves when window.Calendly is ready.
export function loadCalendly() {
  if (typeof window === "undefined") return Promise.reject();
  if (window.Calendly) return Promise.resolve();
  if (loadPromise) return loadPromise;

  loadPromise = new Promise((resolve, reject) => {
    if (!document.querySelector(`link[href="${WIDGET_CSS}"]`)) {
      const css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = WIDGET_CSS;
      document.head.appendChild(css);
    }
    const s = document.createElement("script");
    s.src = WIDGET_JS;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => {
      loadPromise = null; // allow a retry / fall back next time
      reject(new Error("Calendly widget failed to load"));
    };
    document.head.appendChild(s);
  });
  return loadPromise;
}

// Open the booking popup. Returns true if it's handling the click (caller should
// preventDefault on the <a>); the <a href> stays as the no-JS / blocked fallback.
export function openCalendly(url) {
  if (typeof window === "undefined" || !url) return false;
  loadCalendly()
    .then(() => window.Calendly?.initPopupWidget({ url }))
    .catch(() => window.open(url, "_blank", "noopener"));
  return true;
}
