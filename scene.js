// Dynamic scene: layers weather on top of the time-based theme.
// Time of day is owned by theme.js. This script only adds the weather
// modifier (data-weather on <html>) and refreshes the theme pill label.

(function () {
  const SYDNEY = { lat: -33.8688, lon: 151.2093 };
  const CACHE_KEY = "scene_v1";
  const CACHE_TTL = 30 * 60 * 1000;
  const FETCH_TIMEOUT = 5000;

  // Open-Meteo WMO weather codes mapped to visual buckets.
  // https://open-meteo.com/en/docs#weathervariables
  const WEATHER_BUCKETS = {
    0: "clear", 1: "clear",
    2: "cloudy", 3: "cloudy",
    45: "fog", 48: "fog",
    51: "rain", 53: "rain", 55: "rain", 56: "rain", 57: "rain",
    61: "rain", 63: "rain", 65: "rain", 66: "rain", 67: "rain",
    80: "rain", 81: "rain", 82: "rain",
    95: "rain", 96: "rain", 99: "rain",
    71: "snow", 73: "snow", 75: "snow", 77: "snow",
    85: "snow", 86: "snow"
  };

  const WEATHER_LABELS = {
    clear: "Clear",
    cloudy: "Cloudy",
    fog: "Fog",
    rain: "Rain",
    snow: "Snow"
  };

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

  function applyScene(bucket) {
    document.documentElement.dataset.weather = bucket;
    const label = document.getElementById("theme-label");
    if (!label) return;
    const themeName = document.documentElement.dataset.theme;
    const themeText = themeName
      ? themeName.charAt(0).toUpperCase() + themeName.slice(1) + " mode"
      : "Adaptive theme";
    const weatherText = WEATHER_LABELS[bucket] || "";
    label.textContent = weatherText ? `${themeText} · ${weatherText}` : themeText;
  }

  // Only attempt geolocation if the user has already granted it. We do not
  // surface the permission prompt automatically — a portfolio site shouldn't.
  // Future task: an explicit "use my location" affordance in the theme pill.
  async function silentGeolocation() {
    if (!("geolocation" in navigator) || !("permissions" in navigator)) return null;
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state !== "granted") return null;
    } catch (_) {
      return null;
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        () => resolve(null),
        { timeout: 3000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
      );
    });
  }

  async function fetchWeather(lat, lon) {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=weather_code,is_day`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), FETCH_TIMEOUT);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error("Weather request failed: " + r.status);
      const data = await r.json();
      const code = data && data.current && typeof data.current.weather_code === "number"
        ? data.current.weather_code
        : 0;
      return code;
    } finally {
      clearTimeout(timer);
    }
  }

  async function loadScene() {
    const cached = readCache();
    if (cached && cached.bucket) {
      applyScene(cached.bucket);
      return;
    }

    const userPos = await silentGeolocation();
    const loc = userPos || SYDNEY;

    try {
      const code = await fetchWeather(loc.lat, loc.lon);
      const bucket = WEATHER_BUCKETS[code] || "clear";
      applyScene(bucket);
      writeCache({ bucket, code });
    } catch (err) {
      // Silent fail — leave the time-only theme in place.
      // Console hint left in for the developer; visitors see no change.
      if (window.console && console.debug) {
        console.debug("Scene weather fetch failed:", err && err.message ? err.message : err);
      }
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", loadScene);
  } else {
    loadScene();
  }
})();
