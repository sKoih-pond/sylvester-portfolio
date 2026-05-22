// Scene layer — sets data-weather on <html> from Open-Meteo hourly data.
// Day/night is owned by theme.js + solar.js; this script only manages weather.
// Location is delegated to Solar helpers — no duplicate geolocation block.

(function () {
  "use strict";

  const CACHE_KEY    = "scene_v2";               // v2: new hourly array format
  const CACHE_TTL    = 90 * 60 * 1000;           // refetch after 90 min
  const FETCH_TIMEOUT = 5000;

  // Open-Meteo WMO weather codes → visual buckets.
  // https://open-meteo.com/en/docs#weathervariables
  const WEATHER_BUCKETS = {
    0: "clear",  1: "clear",
    2: "cloudy", 3: "cloudy",
    45: "fog",   48: "fog",
    51: "rain",  53: "rain",  55: "rain",  56: "rain",  57: "rain",
    61: "rain",  63: "rain",  65: "rain",  66: "rain",  67: "rain",
    80: "rain",  81: "rain",  82: "rain",
    95: "rain",  96: "rain",  99: "rain",
    71: "snow",  73: "snow",  75: "snow",  77: "snow",
    85: "snow",  86: "snow"
  };

  // ---------------------------------------------------------------------------
  // Cache (sessionStorage)
  // Stored shape: { timestamp, lat, lon, hourly: {time[], weather_code[]}, fallback_code }
  // ---------------------------------------------------------------------------

  function readCache() {
    try {
      const raw = sessionStorage.getItem(CACHE_KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || typeof data !== "object") return null;
      if (Date.now() - data.timestamp > CACHE_TTL) return null;
      return data;
    } catch (_) { return null; }
  }

  function writeCache(data) {
    try {
      sessionStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, timestamp: Date.now() }));
    } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Apply weather bucket to the document
  // ---------------------------------------------------------------------------

  function applyScene(bucket) {
    document.documentElement.dataset.weather = bucket;
    const label = document.getElementById("theme-label");
    if (label && typeof window.composeThemeLabel === "function") {
      label.textContent = window.composeThemeLabel();
    }
  }

  // ---------------------------------------------------------------------------
  // Hourly bucket resolution
  // ---------------------------------------------------------------------------

  // Build the ISO-8601 local-hour key that Open-Meteo uses in its time array.
  // With timezone=auto the timestamps are in local time, e.g. "2026-05-22T14:00".
  function localISOHour(date) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`;
  }

  function pickBucketForNow(hourly) {
    if (!hourly || !Array.isArray(hourly.time)) return null;
    const key = localISOHour(new Date());
    const idx = hourly.time.indexOf(key);
    if (idx === -1) return null;
    const code = hourly.weather_code[idx];
    return typeof code === "number" ? (WEATHER_BUCKETS[code] ?? "clear") : null;
  }

  // ---------------------------------------------------------------------------
  // Network fetch
  // ---------------------------------------------------------------------------

  async function fetchWeatherHourly(lat, lon) {
    const url = [
      "https://api.open-meteo.com/v1/forecast",
      `?latitude=${lat}&longitude=${lon}`,
      "&hourly=weather_code",
      "&current=weather_code",   // keep as fallback if hourly lookup misses
      "&forecast_days=2",
      "&timezone=auto"           // hourly timestamps in local time
    ].join("");

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("Weather request failed: " + r.status);
      const data = await r.json();

      const hourly = (data && data.hourly && Array.isArray(data.hourly.time))
        ? { time: data.hourly.time, weather_code: data.hourly.weather_code }
        : { time: [], weather_code: [] };

      const fallback_code = (data && data.current && typeof data.current.weather_code === "number")
        ? data.current.weather_code
        : 0;

      return { hourly, fallback_code };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------------------
  // Scheduling — re-pick at each hour boundary from the cached array.
  // loadScene is always the single entry point; scheduleHourlyRepick just
  // sets the next timer so the chain stays alive.
  // ---------------------------------------------------------------------------

  function scheduleHourlyRepick() {
    const now = new Date();
    const msToNextHour = (60 - now.getMinutes()) * 60000
                       - now.getSeconds() * 1000
                       - now.getMilliseconds();
    // Clamp to ≥1 s to avoid instant re-fires exactly on the hour.
    setTimeout(loadScene, Math.max(1000, msToNextHour));
  }

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------

  async function loadScene() {
    // --- Cache hit: repick the current hour from the stored array ---
    const cached = readCache();
    if (cached && cached.hourly) {
      const bucket = pickBucketForNow(cached.hourly)
                  || (WEATHER_BUCKETS[cached.fallback_code] ?? "clear");
      applyScene(bucket);
      scheduleHourlyRepick();
      return;
    }

    // --- Cache miss / expired: fetch fresh data ---
    // Delegate location to Solar (shared with theme.js, no duplicate prompt).
    const defaultLoc = Solar.defaultLocation();
    const precise    = await Solar.preciseLocation();
    const loc        = precise || defaultLoc;

    try {
      const { hourly, fallback_code } = await fetchWeatherHourly(loc.lat, loc.lon);
      const bucket = pickBucketForNow(hourly)
                  || (WEATHER_BUCKETS[fallback_code] ?? "clear");
      applyScene(bucket);
      writeCache({ lat: loc.lat, lon: loc.lon, hourly, fallback_code });
    } catch (err) {
      // Silent fail — leave the solar-only theme in place.
      if (window.console && console.debug) {
        console.debug("Scene weather fetch failed:", err && err.message ? err.message : err);
      }
    }

    // Always reschedule, including after a failed fetch, to keep the chain alive.
    scheduleHourlyRepick();
  }

  // ---------------------------------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadScene);
  } else {
    loadScene();
  }
})();
