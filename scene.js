// Scene layer — sets data-weather + --weather-intensity on <html> from Open-Meteo.
// Day/night is owned by theme.js + solar.js; this script only manages weather.
// Location delegated to Solar.resolveLocation() — no duplicate geolocation block.

(function () {
  "use strict";

  const CACHE_KEY     = "scene_v3";           // v3: adds cloud_cover + precipitation
  const CACHE_TTL     = 90 * 60 * 1000;       // refetch after 90 min
  const FETCH_TIMEOUT = 5000;

  // Open-Meteo WMO weather codes → visual buckets.
  // https://open-meteo.com/en/docs#weathervariables
  // 0-1 → clear, 2 → partly-cloudy (NEW), 3 → cloudy/overcast.
  // cloud_cover % is used as a tiebreaker within the cloud categories.
  const WEATHER_BUCKETS = {
    0: "clear",         1: "clear",
    2: "partly-cloudy", 3: "cloudy",
    45: "fog",          48: "fog",
    51: "rain",  53: "rain",  55: "rain",  56: "rain",  57: "rain",
    61: "rain",  63: "rain",  65: "rain",  66: "rain",  67: "rain",
    71: "snow",  73: "snow",  75: "snow",  77: "snow",
    80: "rain",  81: "rain",  82: "rain",
    85: "snow",  86: "snow",
    95: "rain",  96: "rain",  99: "rain"
  };

  // ---------------------------------------------------------------------------
  // Cloud-cover tiebreaker
  // Refines ambiguous cloud-category WMO codes using the measured cloud_cover %.
  // Rain, fog, and snow codes are never overridden.
  // ---------------------------------------------------------------------------

  function refinedBucket(wmoCode, cloudCover) {
    const wmoBucket = WEATHER_BUCKETS[wmoCode] ?? "clear";
    if (!["clear", "partly-cloudy", "cloudy"].includes(wmoBucket)) return wmoBucket;
    if (typeof cloudCover !== "number") return wmoBucket;
    if (cloudCover < 20)  return "clear";
    if (cloudCover < 65)  return "partly-cloudy";
    return "cloudy";
  }

  // ---------------------------------------------------------------------------
  // Intensity curve (0–1)
  // Scales the strength of the weather overlay in CSS via --weather-intensity.
  // cloud_cover: 0-100 (%). precipitation: mm/h (or mm per hour of accumulation).
  // Default is 1 so the overlay is fully present before JS populates the property.
  // ---------------------------------------------------------------------------

  function computeIntensity(bucket, cloudCover, precip) {
    const cc = typeof cloudCover === "number" ? cloudCover : 100;
    const p  = typeof precip     === "number" ? precip     : 0;
    switch (bucket) {
      case "clear":         return Math.min(1, cc / 100 * 0.35);  // very dim for clear skies
      case "partly-cloudy": return Math.min(1, cc / 100);
      case "cloudy":        return Math.min(1, cc / 100);
      case "fog":           return 1;
      // Square-root curve: light conditions still register visually.
      // Rain heavy threshold: ~10 mm/h; snow threshold ~4 mm/h (water equiv).
      case "rain":          return Math.min(1, Math.sqrt(Math.max(0, p) / 10));
      case "snow":          return Math.min(1, Math.sqrt(Math.max(0, p) / 4));
      default:              return 1;
    }
  }

  // ---------------------------------------------------------------------------
  // Cache (sessionStorage)
  // Shape: { timestamp, lat, lon,
  //          hourly: { time[], weather_code[], cloud_cover[], precipitation[] },
  //          fallback: { code, cloudCover, precip } }
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
  // Apply weather to the document
  // ---------------------------------------------------------------------------

  function applyScene(bucket, intensity) {
    document.documentElement.dataset.weather = bucket;
    document.documentElement.style.setProperty(
      "--weather-intensity",
      (typeof intensity === "number" ? intensity : 1).toFixed(3)
    );
    const label = document.getElementById("theme-label");
    if (label && typeof window.composeThemeLabel === "function") {
      label.textContent = window.composeThemeLabel();
    }
  }

  // ---------------------------------------------------------------------------
  // Hourly data resolution
  // ---------------------------------------------------------------------------

  // Build the ISO-8601 local-hour key Open-Meteo uses (timezone=auto → local time).
  function localISOHour(date) {
    const pad = n => String(n).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:00`;
  }

  // Extract weather variables for the current local hour from the hourly arrays.
  function pickHourData(hourly) {
    if (!hourly || !Array.isArray(hourly.time)) return null;
    const idx = hourly.time.indexOf(localISOHour(new Date()));
    if (idx === -1) return null;
    return {
      code:       hourly.weather_code  ? hourly.weather_code[idx]  : undefined,
      cloudCover: hourly.cloud_cover   ? hourly.cloud_cover[idx]   : undefined,
      precip:     hourly.precipitation ? hourly.precipitation[idx] : undefined
    };
  }

  function bucketAndIntensity(code, cloudCover, precip) {
    const bucket    = refinedBucket(code ?? 0, cloudCover);
    const intensity = computeIntensity(bucket, cloudCover, precip);
    return { bucket, intensity };
  }

  // ---------------------------------------------------------------------------
  // Network fetch
  // ---------------------------------------------------------------------------

  async function fetchWeatherHourly(lat, lon) {
    const url = [
      "https://api.open-meteo.com/v1/forecast",
      `?latitude=${lat}&longitude=${lon}`,
      "&hourly=weather_code,cloud_cover,precipitation",
      "&current=weather_code,cloud_cover,precipitation",
      "&forecast_days=2",
      "&timezone=auto"   // hourly timestamps in local time for direct matching
    ].join("");

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("Weather request failed: " + r.status);
      const data = await r.json();

      const h = data && data.hourly;
      const hourly = (h && Array.isArray(h.time))
        ? { time: h.time, weather_code: h.weather_code,
            cloud_cover: h.cloud_cover, precipitation: h.precipitation }
        : { time: [], weather_code: [], cloud_cover: [], precipitation: [] };

      const cur = data && data.current;
      const fallback = {
        code:       (cur && typeof cur.weather_code  === "number") ? cur.weather_code  : 0,
        cloudCover: (cur && typeof cur.cloud_cover   === "number") ? cur.cloud_cover   : undefined,
        precip:     (cur && typeof cur.precipitation === "number") ? cur.precipitation : undefined
      };

      return { hourly, fallback };
    } finally {
      clearTimeout(timer);
    }
  }

  // ---------------------------------------------------------------------------
  // Scheduling — re-pick at each hour boundary from the cached array.
  // loadScene is the single entry point; scheduleHourlyRepick keeps the chain.
  // ---------------------------------------------------------------------------

  function scheduleHourlyRepick() {
    const now = new Date();
    const msToNextHour = (60 - now.getMinutes()) * 60000
                       - now.getSeconds() * 1000
                       - now.getMilliseconds();
    // Clamp ≥1 s to avoid instant re-fires exactly on the hour.
    setTimeout(loadScene, Math.max(1000, msToNextHour));
  }

  // ---------------------------------------------------------------------------
  // Main entry point
  // ---------------------------------------------------------------------------

  async function loadScene() {
    // --- Cache hit: repick from the stored hourly array ---
    const cached = readCache();
    if (cached && cached.hourly) {
      const hour = pickHourData(cached.hourly);
      const { bucket, intensity } = hour
        ? bucketAndIntensity(hour.code, hour.cloudCover, hour.precip)
        : bucketAndIntensity(cached.fallback.code, cached.fallback.cloudCover, cached.fallback.precip);
      applyScene(bucket, intensity);
      scheduleHourlyRepick();
      return;
    }

    // --- Cache miss / expired: resolve best location, then fetch ---
    // Solar.resolveLocation() cascades GPS → IP → timezone default, caching IP
    // result in sessionStorage so subsequent calls are instant.
    const loc = await Solar.resolveLocation();

    try {
      const { hourly, fallback } = await fetchWeatherHourly(loc.lat, loc.lon);
      const hour = pickHourData(hourly);
      const { bucket, intensity } = hour
        ? bucketAndIntensity(hour.code, hour.cloudCover, hour.precip)
        : bucketAndIntensity(fallback.code, fallback.cloudCover, fallback.precip);
      applyScene(bucket, intensity);
      writeCache({ lat: loc.lat, lon: loc.lon, hourly, fallback });
    } catch (err) {
      // Silent fail — leave the solar-only theme in place.
      if (window.console && console.debug) {
        console.debug("Scene weather fetch failed:", err && err.message ? err.message : err);
      }
    }

    // Always reschedule — keeps the chain alive even after a failed fetch.
    scheduleHourlyRepick();
  }

  // ---------------------------------------------------------------------------

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadScene);
  } else {
    loadScene();
  }
})();
