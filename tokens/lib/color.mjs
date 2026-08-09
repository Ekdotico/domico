/**
 * OKLCH <-> sRGB hex, for the one consumer that cannot take oklch.
 *
 * The token source is authored in OKLCH and every CSS artefact ships OKLCH
 * verbatim. Mermaid is the exception: its theming API does colour arithmetic
 * on the values it is handed (deriving shades, borders, and contrast pairs),
 * and it is not safe to assume its parser accepts oklch. The Mermaid palette
 * is therefore generated back down to hex from the same source, so there is
 * still exactly one place a colour is authored.
 *
 * Matrices are Björn Ottosson's published OKLab constants.
 */

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * Math.pow(c, 1 / 2.4) - 0.055);

/** Parse `oklch(L% C H)` or `oklch(L% C H / A)`. Returns null for anything else. */
export function parseOklch(value) {
  const m = /^oklch\(\s*([\d.]+)%\s+([\d.]+)\s+([\d.]+)\s*(?:\/\s*([\d.]+)\s*)?\)$/.exec(value.trim());
  if (!m) return null;
  return {
    L: parseFloat(m[1]) / 100,
    C: parseFloat(m[2]),
    H: parseFloat(m[3]),
    alpha: m[4] === undefined ? null : parseFloat(m[4]),
  };
}

/** OKLCH -> sRGB hex. Channels are clamped: out-of-gamut values clip, as they would on screen. */
export function oklchToHex(value) {
  const p = parseOklch(value);
  if (!p) return null;
  const { L, C, H } = p;

  const h = (H * Math.PI) / 180;
  const a = C * Math.cos(h);
  const b = C * Math.sin(h);

  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  const lr = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const lg = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const lb = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;

  const to255 = (x) => Math.max(0, Math.min(255, Math.round(linearToSrgb(x) * 255)));
  const [r, g, bl] = [to255(lr), to255(lg), to255(lb)];
  return '#' + [r, g, bl].map((v) => v.toString(16).padStart(2, '0')).join('');
}

/** sRGB hex -> OKLCH string. Used by the round-trip self-check in the build. */
export function hexToOklch(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.split('').map((c) => c + c).join('');
  const n = parseInt(h, 16);
  const [r, g, b] = [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255].map(srgbToLinear);

  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);

  const L = 0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s;
  const A = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s;
  const B = 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s;

  const C = Math.sqrt(A * A + B * B);
  let H = (Math.atan2(B, A) * 180) / Math.PI;
  if (H < 0) H += 360;

  const trim = (x, d) => x.toFixed(d).replace(/\.?0+$/, '');
  const achromatic = C < 1e-4;
  return `oklch(${trim(L * 100, 3)}% ${achromatic ? '0' : trim(C, 4)} ${achromatic ? '0' : trim(H, 2)})`;
}
