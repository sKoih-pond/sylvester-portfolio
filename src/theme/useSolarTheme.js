// React port of legacy/theme.js — drives data-theme + interpolated palette
// tokens on <html> from real sun position. Re-evaluates every 2 min, on tab
// refocus, and on OS dark-mode toggle. Returns the current phase + pill label.

import { useEffect, useState, useRef } from "react";
import * as Solar from "../lib/solar.js";
import * as Palette from "../lib/palette.js";

const PHASES = {
  morning: { label: "Morning mode", icon: "☼" },
  day: { label: "Day mode", icon: "☀︎" },
  sunset: { label: "Sunset mode", icon: "◒" },
  night: { label: "Night mode", icon: "☾" },
};

function composeLabel(phase, city) {
  const base = PHASES[phase]?.label || "";
  return city ? `${base} · ${city}` : base;
}

export function useSolarTheme() {
  const [state, setState] = useState({ phase: "day", icon: PHASES.day.icon, label: PHASES.day.label });
  const locRef = useRef(Solar.defaultLocation());
  const cityRef = useRef(Solar.timezoneCity());

  useEffect(() => {
    const html = document.documentElement;

    const applyNow = () => {
      const loc = locRef.current;
      const { phase, elevation, rising } = Solar.sunPhase(new Date(), loc.lat, loc.lon);
      html.style.setProperty("--sun-elevation", elevation.toFixed(2));
      const tokens = Palette.resolve(elevation, rising);
      for (const name in tokens) html.style.setProperty(name, tokens[name]);
      html.dataset.theme = phase;
      try { localStorage.setItem("sk_theme", phase); } catch {}
      setState({ phase, icon: PHASES[phase].icon, label: composeLabel(phase, cityRef.current) });
    };

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

  return state;
}
