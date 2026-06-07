// React port of legacy/theme.js — drives data-theme + interpolated palette
// tokens on <html> from real sun position. Re-evaluates every 2 min, on tab
// refocus, and on OS dark-mode toggle. Returns the current phase + pill label.

import { useEffect, useState, useRef, useCallback } from "react";
import * as Solar from "../lib/solar.js";
import * as Palette from "../lib/palette.js";

const PHASES = {
  morning: { label: "Morning mode", icon: "☼" },
  day: { label: "Day mode", icon: "☀︎" },
  sunset: { label: "Sunset mode", icon: "◒" },
  night: { label: "Night mode", icon: "☾" },
};

// Phases treated as "dark" for the day/night toggle.
const DARK_PHASES = new Set(["sunset", "night"]);

function composeLabel(phase, city) {
  const base = PHASES[phase]?.label || "";
  return city ? `${base} · ${city}` : base;
}

// Manual day/night override (set by the pill toggle), persisted separately from
// the auto solar phase. null = follow the sun.
function readOverride() {
  try {
    const m = localStorage.getItem("sk_mode");
    return m === "day" || m === "night" ? m : null;
  } catch {
    return null;
  }
}

// The user's OS colour scheme, mapped to our anchors: dark → night, light → day.
// Returns null when the system expresses no preference, so the caller can fall
// back to the solar daylight calculation for the user's location.
function systemMode() {
  try {
    if (window.matchMedia?.("(prefers-color-scheme: dark)")?.matches) return "night";
    if (window.matchMedia?.("(prefers-color-scheme: light)")?.matches) return "day";
  } catch {
    /* ignore */
  }
  return null;
}

// Default theme precedence: manual override → system colour scheme → (resolved
// later) solar phase. Used to seed initial state so the pill doesn't flash.
function initialPhase() {
  return readOverride() || systemMode() || "day";
}

export function useSolarTheme() {
  const [state, setState] = useState(() => {
    const p = initialPhase();
    return { phase: p, icon: PHASES[p].icon, label: PHASES[p].label };
  });
  const locRef = useRef(Solar.defaultLocation());
  const cityRef = useRef(Solar.timezoneCity());
  const overrideRef = useRef(readOverride());
  const applyRef = useRef(() => {});

  useEffect(() => {
    const html = document.documentElement;

    const applyNow = () => {
      // Pin a pure day/night anchor when we have an explicit signal: a manual
      // override (pill) first, then the user's OS colour scheme. Only when the
      // system expresses no preference do we fall back to the solar calc below.
      const pinned = overrideRef.current || systemMode();
      if (pinned) {
        const tokens = Palette.resolve(pinned === "day" ? 100 : -100, false);
        for (const name in tokens) html.style.setProperty(name, tokens[name]);
        html.dataset.theme = pinned;
        try { localStorage.setItem("sk_theme", pinned); } catch {}
        setState({ phase: pinned, icon: PHASES[pinned].icon, label: composeLabel(pinned, cityRef.current) });
        return;
      }

      // No override and no system preference → daylight for the user's location.
      const loc = locRef.current;
      const { phase, elevation, rising } = Solar.sunPhase(new Date(), loc.lat, loc.lon);
      html.style.setProperty("--sun-elevation", elevation.toFixed(2));
      const tokens = Palette.resolve(elevation, rising);
      for (const name in tokens) html.style.setProperty(name, tokens[name]);
      html.dataset.theme = phase;
      try { localStorage.setItem("sk_theme", phase); } catch {}
      setState({ phase, icon: PHASES[phase].icon, label: composeLabel(phase, cityRef.current) });
    };

    applyRef.current = applyNow;
    applyNow();

    // Async refinement: GPS → IP → timezone. Re-applies once resolved.
    Solar.resolveLocation().then((loc) => {
      locRef.current = loc;
      cityRef.current = loc.city || Solar.timezoneCity() || null;
      Solar.persistLocation(loc.lat, loc.lon);
      applyNow();
    });

    const interval = setInterval(applyNow, 2 * 60 * 1000);
    const onVisible = () => { if (!document.hidden) applyNow(); };
    document.addEventListener("visibilitychange", onVisible);
    const mq = window.matchMedia?.("(prefers-color-scheme: dark)");
    mq?.addEventListener?.("change", applyNow);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
      mq?.removeEventListener?.("change", applyNow);
    };
  }, []);

  // Toggle between forced day and forced night. Flips relative to whatever's
  // showing now (override if set, otherwise the live auto phase), then pins it.
  const toggle = useCallback(() => {
    const cur = overrideRef.current;
    const isDarkNow = cur ? cur === "night" : DARK_PHASES.has(document.documentElement.dataset.theme);
    const next = isDarkNow ? "day" : "night";
    overrideRef.current = next;
    try { localStorage.setItem("sk_mode", next); } catch {}
    applyRef.current();
  }, []);

  return { ...state, isDark: DARK_PHASES.has(state.phase), toggle };
}
