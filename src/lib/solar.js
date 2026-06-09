// Solar position engine — ES-module port of legacy/solar.js (verbatim logic).
// Pure, synchronous core (NOAA low-precision); async location cascade is deferred
// and never blocks first paint. No DOM side-effects.

const DEG = Math.PI / 180;

const DAY_ELEV = 10;            // above this → day
const CIVIL_ELEV = -6;          // below this → night (civil twilight)
const LOOKAHEAD_MS = 10 * 60 * 1000;

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

// Location = the device timezone ONLY. We deliberately make no third-party
// network requests (no IP-geo / reverse-geocode) and don't touch the geolocation
// API — those are tracking/fingerprinting vectors that privacy browsers block,
// e.g. Safari Private Browsing's protection, which then prompts the user to
// "reduce protections". The OS timezone gives the city label and a longitude
// from the clock offset — enough for the location pill + solar phase, with zero
// tracking surface and no blocked requests.
export async function resolveLocation() {
  return { ...defaultLocation(), source: "tz", city: timezoneCity() || null };
}

export function persistLocation(lat, lon) {
  try {
    localStorage.setItem(LOC_PERSIST_KEY, JSON.stringify({ lat, lon }));
  } catch {}
}
