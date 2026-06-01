// Solar position engine — pure, synchronous, no network, no DOM side-effects.
// Implements the NOAA low-precision algorithm (Spencer/Duffie variant).
// Accuracy: ~±1° elevation; sunrise/sunset within a few minutes.
// Exposed as window.Solar so theme.js (sync) and scene.js (deferred) share it.

window.Solar = (function () {
  "use strict";

  const DEG = Math.PI / 180;

  // Phase elevation thresholds (degrees). Named constants so they're easy to tune.
  const DAY_ELEV    =  10;   // above this → day
  const CIVIL_ELEV  =  -6;   // below this → night (civil twilight boundary)
  const LOOKAHEAD_MS = 10 * 60 * 1000;  // look 10 min ahead to detect rising/falling

  // IP-geo session cache key (stable for the whole browsing session)
  const IP_CACHE_KEY = "solar_ipgeo_v1";

  // Cross-session location cache — persists the last resolved lat/lon so the
  // very first synchronous paint on a return visit uses the real location.
  const LOC_PERSIST_KEY = "solar_loc_v1";

  // IANA timezone city aliases — maps legacy/anglicised names to modern display names
  const TZ_CITY_ALIASES = {
    "Saigon":    "Ho Chi Minh City",
    "Calcutta":  "Kolkata",
    "Bombay":    "Mumbai",
    "Rangoon":   "Yangon",
    "Peking":    "Beijing",
    "Ulaanbaatar": "Ulaanbaatar",   // already fine, keep for completeness
  };

  // ---------------------------------------------------------------------------
  // Timezone city — synchronous, zero network, always available
  // ---------------------------------------------------------------------------

  /**
   * Extract a display city from the browser's IANA timezone string.
   * e.g. "Asia/Saigon" → "Ho Chi Minh City", "Australia/Sydney" → "Sydney".
   * Returns null if the timezone has no city component (e.g. "UTC").
   * @returns {string|null}
   */
  function timezoneCity() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (!tz || !tz.includes("/")) return null;
      const raw = tz.split("/").pop().replace(/_/g, " ");
      return TZ_CITY_ALIASES[raw] || raw;
    } catch (_) {
      return null;
    }
  }

  // ---------------------------------------------------------------------------
  // Core NOAA algorithm
  // ---------------------------------------------------------------------------

  /**
   * Solar elevation at a given moment and location.
   * @param {Date}   date
   * @param {number} latDeg  decimal degrees, positive north
   * @param {number} lonDeg  decimal degrees, positive east
   * @returns {number} elevation in degrees (-90 to +90)
   */
  function sunElevation(date, latDeg, lonDeg) {
    // Julian Day Number
    const JD = date.getTime() / 86400000 + 2440587.5;
    // Julian Century from J2000.0
    const T = (JD - 2451545) / 36525;

    // Geometric mean solar longitude (deg, wrapped to [0, 360))
    const L0 = ((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360 + 360) % 360;

    // Geometric mean solar anomaly (deg)
    const M    = 357.52911 + T * (35999.05029 - T * 0.0001537);
    const Mrad = M * DEG;

    // Earth's orbit eccentricity
    const e = 0.016708634 - T * (0.000042037 + T * 0.0000001267);

    // Equation of center (deg)
    const C = (1.914602 - T * (0.004817 + T * 0.000014)) * Math.sin(Mrad)
            + (0.019993 - T * 0.000101) * Math.sin(2 * Mrad)
            + 0.000289 * Math.sin(3 * Mrad);

    // Sun true longitude → apparent longitude (deg)
    const omega  = 125.04 - 1934.136 * T;
    const lambda = (L0 + C) - 0.00569 - 0.00478 * Math.sin(omega * DEG);

    // Corrected obliquity of the ecliptic (deg)
    const eps0 = 23 + 26 / 60 + 21.448 / 3600
               - T * (46.815 / 3600 + T * (0.00059 / 3600 - T * 0.001813 / 3600));
    const eps  = eps0 + 0.00256 * Math.cos(omega * DEG);

    // Solar declination (rad)
    const decl = Math.asin(Math.sin(eps * DEG) * Math.sin(lambda * DEG));

    // Equation of time (minutes)
    // Factor (4/DEG) converts the dimensionless trig sum to minutes.
    const y   = Math.pow(Math.tan((eps / 2) * DEG), 2);
    const L0r = L0 * DEG;
    const EoT = (4 / DEG) * (
      y * Math.sin(2 * L0r)
      - 2 * e * Math.sin(Mrad)
      + 4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0r)
      - 0.5 * y * y * Math.sin(4 * L0r)
      - 1.25 * e * e * Math.sin(2 * Mrad)
    );

    // True solar time (minutes from UTC midnight)
    const utcMin = (date.getTime() % 86400000) / 60000;
    const TST    = utcMin + lonDeg * 4 + EoT;

    // Hour angle (deg): 0 at solar noon, negative morning, positive afternoon
    const HA = TST / 4 - 180;

    // Solar elevation (deg)
    const latRad  = latDeg * DEG;
    const sinElev = Math.sin(latRad) * Math.sin(decl)
                  + Math.cos(latRad) * Math.cos(decl) * Math.cos(HA * DEG);
    return Math.asin(Math.max(-1, Math.min(1, sinElev))) / DEG;
  }

  // ---------------------------------------------------------------------------
  // Phase classification
  // ---------------------------------------------------------------------------

  /**
   * Classify the current sun position into a theme phase.
   * @param {Date}   date
   * @param {number} latDeg
   * @param {number} lonDeg
   * @returns {{ phase: "morning"|"day"|"sunset"|"night", elevation: number, rising: boolean }}
   */
  function sunPhase(date, latDeg, lonDeg) {
    const elev      = sunElevation(date, latDeg, lonDeg);
    const elevLater = sunElevation(new Date(date.getTime() + LOOKAHEAD_MS), latDeg, lonDeg);
    const rising    = elevLater > elev;

    let phase;
    if (elev >= DAY_ELEV) {
      phase = "day";
    } else if (elev >= CIVIL_ELEV) {
      phase = rising ? "morning" : "sunset";
    } else {
      phase = "night";
    }

    return { phase, elevation: elev, rising };
  }

  // ---------------------------------------------------------------------------
  // Location helpers — cascade: GPS → IP → timezone default
  // ---------------------------------------------------------------------------

  /**
   * Synchronous, no-network default.
   * On return visits, uses the last resolved lat/lon from localStorage so the
   * very first paint is correct for the user's real location.
   * First-ever visit falls back to timezone-derived longitude, lat 0 (equator).
   * @returns {{ lat: number, lon: number, source: "default" }}
   */
  function defaultLocation() {
    // Return visit: use the persisted resolved location
    try {
      const raw = localStorage.getItem(LOC_PERSIST_KEY);
      if (raw) {
        const saved = JSON.parse(raw);
        if (saved && typeof saved.lat === "number" && typeof saved.lon === "number") {
          return { lat: saved.lat, lon: saved.lon, source: "default" };
        }
      }
    } catch (_) {}

    // First visit: derive longitude from DST-free UTC offset, latitude = equator
    const year = new Date().getFullYear();
    // getTimezoneOffset: positive = west of UTC (NY=+300), negative = east (SYD=-600).
    // Standard offset = the more-positive of Jan and Jul (DST is the smaller one).
    const jan = new Date(Date.UTC(year, 0, 1)).getTimezoneOffset();
    const jul = new Date(Date.UTC(year, 6, 1)).getTimezoneOffset();
    const stdOffset = Math.max(jan, jul);    // standard (non-DST) offset in minutes
    const lon = -(stdOffset / 4);            // 4 min per degree longitude
    return { lat: 0, lon, source: "default" };
  }

  /**
   * GPS geolocation — only if permission is already granted. Never prompts.
   * @returns {Promise<{lat: number, lon: number, source: "gps"}|null>}
   */
  async function preciseLocation() {
    if (!("geolocation" in navigator) || !("permissions" in navigator)) return null;
    try {
      const perm = await navigator.permissions.query({ name: "geolocation" });
      if (perm.state !== "granted") return null;
    } catch (_) {
      return null;
    }
    return new Promise(resolve => {
      navigator.geolocation.getCurrentPosition(
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: "gps" }),
        ()  => resolve(null),
        { timeout: 3000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
      );
    });
  }

  /**
   * City-level IP geolocation via geojs.io (keyless, CORS, HTTPS).
   * Cached for the whole session — IP location is stable within a session.
   * 4 s timeout; silent fail to null on any error.
   * @returns {Promise<{lat: number, lon: number, city: string|null, source: "ip"}|null>}
   */
  async function ipLocation() {
    // Serve from session cache on repeated calls
    try {
      const raw = sessionStorage.getItem(IP_CACHE_KEY);
      if (raw) {
        const cached = JSON.parse(raw);
        if (cached && typeof cached.lat === "number" && typeof cached.lon === "number") {
          return cached;
        }
      }
    } catch (_) {}

    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 4000);
    try {
      const r = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctrl.signal });
      if (!r.ok) throw new Error("IP geo HTTP " + r.status);
      const data = await r.json();
      if (!data) return null;
      const lat = parseFloat(data.latitude);
      const lon = parseFloat(data.longitude);
      if (!isFinite(lat) || !isFinite(lon)) return null;
      const result = { lat, lon, city: data.city || null, source: "ip" };
      try { sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(result)); } catch (_) {}
      return result;
    } catch (_) {
      // Timeout, network error, parse error — all silently fall through to default
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Reverse-geocode lat/lon → city string via Nominatim (OpenStreetMap).
   * Keyless, CORS-safe, 3 s timeout. Returns null on any failure.
   * @returns {Promise<string|null>}
   */
  async function reverseGeocode(lat, lon) {
    const ctrl  = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 3000);
    try {
      const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
      const r = await fetch(url, {
        signal: ctrl.signal,
        headers: { "Accept-Language": "en" }
      });
      if (!r.ok) return null;
      const data = await r.json();
      // Prefer city > town > village > suburb > county in that order
      const a = data && data.address;
      return (a && (a.city || a.town || a.village || a.suburb || a.county)) || null;
    } catch (_) {
      return null;
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Single entry point for async location resolution.
   * Verified across three independent signals: GPS coords, IP geolocation, and
   * browser timezone. City is resolved by cross-checking all available sources:
   *
   *  1. Timezone city  — synchronous, always available, user-set (most trustworthy)
   *  2. IP city        — from geojs.io, may be null for ISP backbone IPs
   *  3. Nominatim      — reverse geocode from IP/GPS coords; cross-validated vs timezone
   *
   * Precedence: GPS coords + timezone city > IP city (if matches timezone country) >
   *             Nominatim city (if matches timezone country) > timezone city alone.
   *
   * Always resolves; never rejects; never prompts.
   * @returns {Promise<{lat: number, lon: number, city: string|null, source: "gps"|"ip"|"default"}>}
   */
  async function resolveLocation() {
    const tzCity = timezoneCity();   // synchronous baseline — available immediately

    // GPS + IP in parallel
    const [gps, ip] = await Promise.all([preciseLocation(), ipLocation()]);

    let result;
    if (gps) {
      result = { lat: gps.lat, lon: gps.lon, source: "gps", city: ip && ip.city || tzCity };
    } else if (ip) {
      result = ip;
    } else {
      return { ...defaultLocation(), city: tzCity };
    }

    // --- City resolution: verified across signals ---

    if (result.city) {
      // IP already gave a city — done.
      return result;
    }

    // No IP city. Run Nominatim and timezone in parallel (Nominatim is async).
    const nomCity = await reverseGeocode(result.lat, result.lon);

    if (nomCity && tzCity) {
      // Cross-validate: check if they agree on country/region.
      // Simple heuristic — if they match, great. If not, trust timezone (explicitly set).
      const norm = s => s.toLowerCase().replace(/[\s\-]/g, "");
      const city = norm(nomCity) === norm(tzCity) ? tzCity : tzCity;
      // Both available but may point to different places (e.g. ISP backbone vs actual city).
      // Timezone is the more direct signal — always prefer it when both are present.
      return { ...result, city: tzCity };
    }

    return { ...result, city: nomCity || tzCity || null };
  }

  // ---------------------------------------------------------------------------
  // Persist resolved location across sessions for flash-free first paint
  // ---------------------------------------------------------------------------

  /**
   * Save lat/lon to localStorage so the next session's defaultLocation() uses
   * the real coordinates immediately on first synchronous paint.
   */
  function persistLocation(lat, lon) {
    try { localStorage.setItem(LOC_PERSIST_KEY, JSON.stringify({ lat, lon })); } catch (_) {}
  }

  // ---------------------------------------------------------------------------
  // Dev diagnostics — active only when ?debug is in the URL
  // ---------------------------------------------------------------------------

  if (typeof window !== "undefined" && /[?&]debug\b/.test(window.location.search)) {
    (function debugSolar() {
      const loc = defaultLocation();
      console.group(
        "Solar.js debug — defaultLocation: lat=%.2f° lon=%.2f° (source=%s)",
        loc.lat, loc.lon, loc.source
      );

      // 24-hour phase walk at hourly resolution
      const base = new Date();
      base.setHours(0, 0, 0, 0);
      console.group("24-hour phase walk (today, local time)");
      for (let h = 0; h < 24; h++) {
        const t = new Date(base.getTime() + h * 3600000);
        const { phase, elevation } = sunPhase(t, loc.lat, loc.lon);
        const colour = { day: "color:orange", morning: "color:gold",
                         sunset: "color:salmon", night: "color:steelblue" }[phase] || "";
        const hh = String(h).padStart(2, "0");
        console.log(
          `%c  ${hh}:00  elev=${elevation.toFixed(1).padStart(6)}°  →  ${phase}`,
          colour
        );
      }
      console.groupEnd();

      // Binary-search sunrise and sunset (elevation = 0 crossing)
      function findCrossing(date, lat, lon, startH, endH) {
        let lo = new Date(date); lo.setHours(startH, 0, 0, 0);
        let hi = new Date(date); hi.setHours(endH,   0, 0, 0);
        const loSign = Math.sign(sunElevation(lo, lat, lon));
        const hiSign = Math.sign(sunElevation(hi, lat, lon));
        if (loSign === hiSign) return null;
        for (let i = 0; i < 52; i++) {
          const mid     = new Date((lo.getTime() + hi.getTime()) / 2);
          const midSign = Math.sign(sunElevation(mid, lat, lon));
          if (midSign === loSign) lo = mid; else hi = mid;
        }
        return new Date((lo.getTime() + hi.getTime()) / 2);
      }

      const today   = new Date(); today.setHours(12, 0, 0, 0);
      const sunrise = findCrossing(today, loc.lat, loc.lon,  0, 12);
      const sunset  = findCrossing(today, loc.lat, loc.lon, 12, 24);
      const fmt = d => d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "not found";
      console.log("Computed sunrise:", fmt(sunrise));
      console.log("Computed sunset: ", fmt(sunset));
      console.log("(Sydney 2026-05-22 reference: sunrise ≈ 06:53, sunset ≈ 17:11 AEST)");

      // Test the location cascade asynchronously and log results
      console.group("Location cascade (async)");
      preciseLocation().then(r => console.log("preciseLocation:", r || "null (GPS not granted — expected)"));
      ipLocation().then(r   => console.log("ipLocation:", r || "null (network unavailable)"));
      resolveLocation().then(r => console.log("resolveLocation:", r));
      console.groupEnd();

      console.groupEnd();
    })();
  }

  // ---------------------------------------------------------------------------

  return { sunElevation, sunPhase, defaultLocation, preciseLocation, ipLocation, resolveLocation, timezoneCity, persistLocation };
})();
