// Palette engine — continuous OKLab interpolation between the four authored
// [data-theme] anchors, driven by solar elevation.
// Probes the authored palettes synchronously at startup (no network, no async).
// Exposes window.Palette.resolve(elevation, rising, osDark) → token map.
// solar.js must be loaded before this script; theme.js loads after.

(function () {
  "use strict";

  // Custom properties to probe and interpolate across all four phases
  const TOKENS = [
    "--page-bg", "--surface", "--surface-strong", "--surface-soft",
    "--border", "--border-soft", "--text", "--muted", "--accent",
    "--accent-soft", "--shadow", "--shadow-soft",
    "--hero-gradient", "--background",
    "--chart-projects", "--glass-tint", "--glass-edge", "--glass-specular"
  ];

  // Solar elevation anchors (degrees) — independent of solar.js thresholds
  const NIGHT_ELEV    = -6;   // ≤ this → pure night palette
  const TWILIGHT_PEAK =  5;   // morning/sunset anchor peak
  const DAY_ELEV      = 30;   // ≥ this → pure day palette

  // ---------------------------------------------------------------------------
  // Perceptual color math — OKLab (Bjorn Ottosson, 2020)
  // Reference: https://bottosson.github.io/posts/oklab/
  // ---------------------------------------------------------------------------

  function gammaToLinear(c) {
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  }

  function linearToGamma(c) {
    return c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(Math.max(0, c), 1 / 2.4) - 0.055;
  }

  function rgbToOKLab(r, g, b) {
    const rl = gammaToLinear(r / 255);
    const gl = gammaToLinear(g / 255);
    const bl = gammaToLinear(b / 255);
    const l_ = Math.cbrt(0.4122214708 * rl + 0.5363325363 * gl + 0.0514459929 * bl);
    const m_ = Math.cbrt(0.2119034982 * rl + 0.6806995451 * gl + 0.1073969566 * bl);
    const s_ = Math.cbrt(0.0883024619 * rl + 0.2817188376 * gl + 0.6299787005 * bl);
    return {
      L: 0.2104542553 * l_ + 0.7936177850 * m_ - 0.0040720468 * s_,
      a: 1.9779984951 * l_ - 2.4285922050 * m_ + 0.4505937099 * s_,
      b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.8086757660 * s_
    };
  }

  function oklabToRGB(L, a, b) {
    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
    const l = l_ * l_ * l_;
    const m = m_ * m_ * m_;
    const s = s_ * s_ * s_;
    return [
      Math.round(Math.max(0, Math.min(255, linearToGamma( 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s) * 255))),
      Math.round(Math.max(0, Math.min(255, linearToGamma(-1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s) * 255))),
      Math.round(Math.max(0, Math.min(255, linearToGamma(-0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s) * 255)))
    ];
  }

  // ---------------------------------------------------------------------------
  // CSS color parser / formatter
  // ---------------------------------------------------------------------------

  function parseCSSColor(str) {
    if (!str) return null;
    str = str.trim();
    if (str === "transparent") return { r: 0, g: 0, b: 0, a: 0 };
    const hexM = str.match(/^#([0-9a-f]{3,8})$/i);
    if (hexM) {
      const h = hexM[1];
      if (h.length === 3)
        return { r: parseInt(h[0]+h[0], 16), g: parseInt(h[1]+h[1], 16), b: parseInt(h[2]+h[2], 16), a: 1 };
      if (h.length === 6)
        return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16), a: 1 };
      if (h.length === 8)
        return { r: parseInt(h.slice(0,2), 16), g: parseInt(h.slice(2,4), 16), b: parseInt(h.slice(4,6), 16),
                 a: parseInt(h.slice(6,8), 16) / 255 };
    }
    const rgbM = str.match(/^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)$/);
    if (rgbM)
      return { r: +rgbM[1], g: +rgbM[2], b: +rgbM[3], a: rgbM[4] !== undefined ? +rgbM[4] : 1 };
    return null;
  }

  function formatColor(r, g, b, a) {
    if (a >= 0.9995) {
      const h = n => n.toString(16).padStart(2, "0");
      return `#${h(r)}${h(g)}${h(b)}`;
    }
    return `rgba(${r}, ${g}, ${b}, ${+a.toFixed(3)})`;
  }

  function interpolateColor(ca, cb, t) {
    const pa = parseCSSColor(ca);
    const pb = parseCSSColor(cb);
    if (!pa || !pb) return t < 0.5 ? ca : cb;
    const labA = rgbToOKLab(pa.r, pa.g, pa.b);
    const labB = rgbToOKLab(pb.r, pb.g, pb.b);
    const [r, g, b] = oklabToRGB(
      labA.L + (labB.L - labA.L) * t,
      labA.a + (labB.a - labA.a) * t,
      labA.b + (labB.b - labA.b) * t
    );
    return formatColor(r, g, b, pa.a + (pb.a - pa.a) * t);
  }

  // Matches #hex, rgb/rgba(), and the `transparent` keyword inside CSS strings
  const COLOR_PATTERN = /#[0-9a-f]{3,8}\b|rgba?\([^)]+\)|\btransparent\b/gi;

  function interpolateValue(va, vb, t) {
    if (t <= 0) return va;
    if (t >= 1) return vb;
    // Simple color token — one direct interpolation
    if (parseCSSColor(va) && parseCSSColor(vb)) return interpolateColor(va, vb, t);
    // Complex value (gradient, shadow) — swap embedded colors positionally
    const aColors = va.match(new RegExp(COLOR_PATTERN.source, "gi")) || [];
    const bColors = vb.match(new RegExp(COLOR_PATTERN.source, "gi")) || [];
    if (aColors.length === 0 || aColors.length !== bColors.length) return t < 0.5 ? va : vb;
    let i = 0;
    return va.replace(new RegExp(COLOR_PATTERN.source, "gi"), () => interpolateColor(aColors[i], bColors[i++], t));
  }

  // ---------------------------------------------------------------------------
  // Smoothstep easing — works with inverted ranges (e0 > e1) for falling sun
  // ---------------------------------------------------------------------------

  function smoothstep(e0, e1, x) {
    const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
    return t * t * (3 - 2 * t);
  }

  // ---------------------------------------------------------------------------
  // Palette probe — synchronous, runs before first paint
  // Sets each data-theme, reads every token via getComputedStyle, then restores.
  // The browser won't paint between synchronous script statements, so there is
  // no flash from the temporary theme switches.
  // ---------------------------------------------------------------------------

  function probeAnchors() {
    const html = document.documentElement;
    const saved = html.getAttribute("data-theme");
    const out = {};
    for (const phase of ["morning", "day", "sunset", "night"]) {
      html.dataset.theme = phase;
      const cs = window.getComputedStyle(html);
      const map = {};
      for (const tok of TOKENS) map[tok] = cs.getPropertyValue(tok).trim();
      out[phase] = map;
    }
    // Restore original data-theme exactly as found
    if (saved !== null) html.dataset.theme = saved;
    else html.removeAttribute("data-theme");
    return out;
  }

  // ---------------------------------------------------------------------------
  // Token map blending
  // ---------------------------------------------------------------------------

  function blend(anchorA, anchorB, t) {
    const out = {};
    for (const tok of TOKENS) out[tok] = interpolateValue(anchorA[tok], anchorB[tok], t);
    return out;
  }

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  let _anchors = null;

  /**
   * Resolve the interpolated palette token map for the given solar state.
   *
   * Segment model (rising):   NIGHT → MORNING → DAY
   * Segment model (falling):  DAY   → SUNSET  → NIGHT
   *
   * @param {number}  elevation  Sun elevation in degrees
   * @param {boolean} rising     True while sun is ascending
   * @param {boolean} osDark     True when prefers-color-scheme: dark
   * @returns {{ [tokenName: string]: string }}
   */
  function resolve(elevation, rising, osDark) {
    if (!_anchors) _anchors = probeAnchors();
    const A = _anchors;

    if (elevation <= NIGHT_ELEV) return Object.assign({}, A.night);
    if (elevation >= DAY_ELEV)   return Object.assign({}, A.day);

    if (rising) {
      return elevation <= TWILIGHT_PEAK
        ? blend(A.night,   A.morning, smoothstep(NIGHT_ELEV,    TWILIGHT_PEAK, elevation))
        : blend(A.morning, A.day,     smoothstep(TWILIGHT_PEAK, DAY_ELEV,      elevation));
    } else {
      return elevation >= TWILIGHT_PEAK
        ? blend(A.day,    A.sunset, smoothstep(DAY_ELEV,      TWILIGHT_PEAK, elevation))
        : blend(A.sunset, A.night,  smoothstep(TWILIGHT_PEAK, NIGHT_ELEV,    elevation));
    }
  }

  window.Palette = { resolve };
})();
