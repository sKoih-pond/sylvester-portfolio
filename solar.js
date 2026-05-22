// Solar position engine — pure, synchronous, no network, no DOM side-effects.
// Implements the NOAA low-precision algorithm (Spencer/Duffie variant).
// Accuracy: ~±1° elevation; sunrise/sunset within a few minutes.
// Exposed as window.Solar so theme.js (sync) and scene.js (deferred) share it.

window.Solar = (function () {
  "use strict";

  const DEG = Math.PI / 180;

  // Phase elevation thresholds (degrees). Named constants so they're easy to tune.
  const DAY_ELEV   =  10;   // above this → day
  const CIVIL_ELEV =  -6;   // below this → night (civil twilight boundary)
  const LOOKAHEAD_MS = 10 * 60 * 1000;  // look 10 min ahead to detect rising/falling

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
    const y    = Math.pow(Math.tan((eps / 2) * DEG), 2);
    const L0r  = L0 * DEG;
    const EoT  = (4 / DEG) * (
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
      // Civil twilight band: split by direction of sun travel
      phase = rising ? "morning" : "sunset";
    } else {
      phase = "night";
    }

    return { phase, elevation: elev, rising };
  }

  // ---------------------------------------------------------------------------
  // Location helpers
  // ---------------------------------------------------------------------------

  /**
   * Derive a reasonable location synchronously — no network, no permissions.
   * Longitude from the device's standard-time UTC offset (DST-free).
   * Latitude defaults to Sydney (-33.87°) — right for all AU users out of the box.
   * @returns {{ lat: number, lon: number }}
   */
  function defaultLocation() {
    const year = new Date().getFullYear();
    // getTimezoneOffset: positive west of UTC (e.g. NY=+300), negative east (SYD=-600).
    // DST-free standard offset = the more-positive of Jan and Jul values.
    const jan = new Date(Date.UTC(year, 0, 1)).getTimezoneOffset();
    const jul = new Date(Date.UTC(year, 6, 1)).getTimezoneOffset();
    const stdOffset = Math.max(jan, jul);          // standard (non-DST) offset in minutes
    const lon = -(stdOffset / 4);                  // 4 min per degree longitude
    return { lat: -33.87, lon };
  }

  /**
   * Precise location via the Geolocation API — only if permission is already granted.
   * Never triggers a permission prompt.
   * @returns {Promise<{lat: number, lon: number}|null>}
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
        pos => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        ()  => resolve(null),
        { timeout: 3000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
      );
    });
  }

  // ---------------------------------------------------------------------------
  // Dev diagnostics — active only when ?debug is in the URL
  // ---------------------------------------------------------------------------

  if (typeof window !== "undefined" && /[?&]debug\b/.test(window.location.search)) {
    (function debugSolar() {
      const loc = defaultLocation();
      console.group(
        "Solar.js debug — defaultLocation: lat=%.2f° lon=%.2f°",
        loc.lat, loc.lon
      );

      // 24-hour phase walk at hourly resolution
      const base = new Date();
      base.setHours(0, 0, 0, 0); // local midnight
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

      // Binary-search sunrise and sunset (elev = 0 crossing)
      function findCrossing(date, lat, lon, startH, endH) {
        let lo = new Date(date); lo.setHours(startH, 0, 0, 0);
        let hi = new Date(date); hi.setHours(endH,   0, 0, 0);
        const loSign = Math.sign(sunElevation(lo, lat, lon));
        const hiSign = Math.sign(sunElevation(hi, lat, lon));
        if (loSign === hiSign) return null; // no zero crossing in window
        for (let i = 0; i < 52; i++) {
          const mid    = new Date((lo.getTime() + hi.getTime()) / 2);
          const midSign = Math.sign(sunElevation(mid, lat, lon));
          if (midSign === loSign) lo = mid; else hi = mid;
        }
        return new Date((lo.getTime() + hi.getTime()) / 2);
      }

      const today = new Date(); today.setHours(12, 0, 0, 0);
      const sunrise = findCrossing(today, loc.lat, loc.lon,  0, 12);
      const sunset  = findCrossing(today, loc.lat, loc.lon, 12, 24);
      const fmt = d => d ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "not found";
      console.log("Computed sunrise:", fmt(sunrise));
      console.log("Computed sunset: ", fmt(sunset));
      // Sydney 2026-05-22 reference: sunrise ≈ 06:53 AEST, sunset ≈ 17:11 AEST
      console.log("(Cross-check against a published value for your location and date)");
      console.groupEnd();
    })();
  }

  // ---------------------------------------------------------------------------

  return { sunElevation, sunPhase, defaultLocation, preciseLocation };
})();
