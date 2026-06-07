// Solar position engine — ES-module port of legacy/solar.js (verbatim logic).
// Pure, synchronous core (NOAA low-precision); async location cascade is deferred
// and never blocks first paint. No DOM side-effects.

const DEG = Math.PI / 180;

const DAY_ELEV = 10;            // above this → day
const CIVIL_ELEV = -6;          // below this → night (civil twilight)
const LOOKAHEAD_MS = 10 * 60 * 1000;

const IP_CACHE_KEY = "solar_ipgeo_v1";
const LOC_PERSIST_KEY = "solar_loc_v1";

const TZ_CITY_ALIASES = {
  Saigon: "Ho Chi Minh City",
  Calcutta: "Kolkata",
  Bombay: "Mumbai",
  Rangoon: "Yangon",
  Peking: "Beijing",
  Ulaanbaatar: "Ulaanbaatar",
};

export function timezoneCity() {
  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!tz || !tz.includes("/")) return null;
    const raw = tz.split("/").pop().replace(/_/g, " ");
    return TZ_CITY_ALIASES[raw] || raw;
  } catch {
    return null;
  }
}

export function sunElevation(date, latDeg, lonDeg) {
  const JD = date.getTime() / 86400000 + 2440587.5;
  const T = (JD - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - T * 0.0001537);
  const Mrad = M * DEG;
  const e = 0.016708634 - T * (0.000042037 + T * 0.0000001267);
  const C =
    (1.914602 - T * (0.004817 + T * 0.000014)) * Math.sin(Mrad) +
    (0.019993 - T * 0.000101) * Math.sin(2 * Mrad) +
    0.000289 * Math.sin(3 * Mrad);
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * Math.sin(omega * DEG);
  const eps0 =
    23 + 26 / 60 + 21.448 / 3600 - T * (46.815 / 3600 + T * (0.00059 / 3600 - (T * 0.001813) / 3600));
  const eps = eps0 + 0.00256 * Math.cos(omega * DEG);
  const decl = Math.asin(Math.sin(eps * DEG) * Math.sin(lambda * DEG));
  const y = Math.pow(Math.tan((eps / 2) * DEG), 2);
  const L0r = L0 * DEG;
  const EoT =
    (4 / DEG) *
    (y * Math.sin(2 * L0r) -
      2 * e * Math.sin(Mrad) +
      4 * e * y * Math.sin(Mrad) * Math.cos(2 * L0r) -
      0.5 * y * y * Math.sin(4 * L0r) -
      1.25 * e * e * Math.sin(2 * Mrad));
  const utcMin = (date.getTime() % 86400000) / 60000;
  const TST = utcMin + lonDeg * 4 + EoT;
  const HA = TST / 4 - 180;
  const latRad = latDeg * DEG;
  const sinElev =
    Math.sin(latRad) * Math.sin(decl) + Math.cos(latRad) * Math.cos(decl) * Math.cos(HA * DEG);
  return Math.asin(Math.max(-1, Math.min(1, sinElev))) / DEG;
}

export function sunPhase(date, latDeg, lonDeg) {
  const elev = sunElevation(date, latDeg, lonDeg);
  const elevLater = sunElevation(new Date(date.getTime() + LOOKAHEAD_MS), latDeg, lonDeg);
  const rising = elevLater > elev;
  let phase;
  if (elev >= DAY_ELEV) phase = "day";
  else if (elev >= CIVIL_ELEV) phase = rising ? "morning" : "sunset";
  else phase = "night";
  return { phase, elevation: elev, rising };
}

export function defaultLocation() {
  try {
    const raw = localStorage.getItem(LOC_PERSIST_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      if (saved && typeof saved.lat === "number" && typeof saved.lon === "number") {
        return { lat: saved.lat, lon: saved.lon, source: "default" };
      }
    }
  } catch {}
  const year = new Date().getFullYear();
  const jan = new Date(Date.UTC(year, 0, 1)).getTimezoneOffset();
  const jul = new Date(Date.UTC(year, 6, 1)).getTimezoneOffset();
  const stdOffset = Math.max(jan, jul);
  const lon = -(stdOffset / 4);
  return { lat: 0, lon, source: "default" };
}

async function preciseLocation() {
  if (!("geolocation" in navigator) || !("permissions" in navigator)) return null;
  try {
    const perm = await navigator.permissions.query({ name: "geolocation" });
    if (perm.state !== "granted") return null;
  } catch {
    return null;
  }
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lon: pos.coords.longitude, source: "gps" }),
      () => resolve(null),
      { timeout: 3000, maximumAge: 30 * 60 * 1000, enableHighAccuracy: false }
    );
  });
}

async function ipLocation() {
  try {
    const raw = sessionStorage.getItem(IP_CACHE_KEY);
    if (raw) {
      const cached = JSON.parse(raw);
      if (cached && typeof cached.lat === "number" && typeof cached.lon === "number") return cached;
    }
  } catch {}
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 4000);
  try {
    const r = await fetch("https://get.geojs.io/v1/ip/geo.json", { signal: ctrl.signal });
    if (!r.ok) throw new Error("IP geo HTTP " + r.status);
    const data = await r.json();
    if (!data) return null;
    const lat = parseFloat(data.latitude);
    const lon = parseFloat(data.longitude);
    if (!isFinite(lat) || !isFinite(lon)) return null;
    const result = { lat, lon, city: data.city || null, timezone: data.timezone || null, source: "ip" };
    try {
      sessionStorage.setItem(IP_CACHE_KEY, JSON.stringify(result));
    } catch {}
    return result;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function reverseGeocode(lat, lon) {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 3000);
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=json&zoom=10`;
    const r = await fetch(url, { signal: ctrl.signal, headers: { "Accept-Language": "en" } });
    if (!r.ok) return null;
    const data = await r.json();
    const a = data && data.address;
    return (a && (a.city || a.town || a.village || a.suburb || a.county)) || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function resolveLocation() {
  const tzCity = timezoneCity();
  let deviceTz = null;
  try {
    deviceTz = Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {}
  const tzLoc = defaultLocation(); // longitude from the device's UTC offset

  const [gps, ip] = await Promise.all([preciseLocation(), ipLocation()]);

  // 1. GPS (only when already granted) = the true device location.
  if (gps) {
    const nomCity = await reverseGeocode(gps.lat, gps.lon);
    return { lat: gps.lat, lon: gps.lon, source: "gps", city: nomCity || tzCity || null };
  }

  // 2. IP geo only when its timezone matches the device's. A mismatch means the
  //    IP is a VPN / proxy / carrier hop reporting the wrong place (e.g. "Hanoi"
  //    for a device set to another zone) — distrust it and fall through to the
  //    device timezone instead.
  if (ip && deviceTz && ip.timezone && ip.timezone === deviceTz) {
    return { lat: ip.lat, lon: ip.lon, source: "ip", city: ip.city || tzCity || null };
  }

  // 3. Device timezone: the city the OS is set to, plus a longitude from the
  //    user's own clock offset — never fooled by IP routing.
  return { ...tzLoc, source: "tz", city: tzCity || null };
}

export function persistLocation(lat, lon) {
  try {
    localStorage.setItem(LOC_PERSIST_KEY, JSON.stringify({ lat, lon }));
  } catch {}
}
