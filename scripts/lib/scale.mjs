/**
 * The interface scale, applied to the package's stylesheets.
 *
 * `--scale` (tokens/source/layout.json) is one number, 1 by default. A length
 * that should grow with the interface is written `calc(<length> * var(--scale))`,
 * so at 1 it computes to exactly the length it was, and at 1.5 to half as much
 * again, with nothing zoomed. Positions a script measures with
 * getBoundingClientRect stay true, which `zoom` would break.
 *
 * What does not take the factor, and why:
 *   - lengths of 3px and under: hairlines, rules, carets, focus-ring geometry;
 *   - border, outline, box-shadow, text-shadow, text-decoration and
 *     text-underline-offset, whatever their length: lines and shadows;
 *   - the prelude of an at-rule: a media query cannot read a custom property,
 *     and a breakpoint is a fact about the viewport, not the interface;
 *   - comments.
 *
 * `scaleCss` and `unscaleCss` are inverse on any stylesheet this module wrote,
 * which is what `check:scale` holds the sources to.
 */

const KEEP_PROPERTY = /^(border|outline|box-shadow|text-shadow|text-decoration|text-underline-offset|column-rule)/;
// A px or rem length. An em follows the type, which carries the factor; vw,
// %, ch and the container units follow what they measure.
const LENGTH = /(?<![\w.-])(-?\d*\.?\d+)(px|rem)\b/g;
const WRAPPED = /calc\((-?\d*\.?\d+(?:px|rem)) \* var\(--scale\)\)/g;

// A fluid middle term, wrapped whole: `calc((1.6vw + 0.9rem) * var(--scale))`.
const WRAPPED_TERM = /calc\(\(([^()]+)\) \* var\(--scale\)\)/g;
const FLUID = /^clamp\((var\(--[\w-]+\)), ([^()]+), (var\(--[\w-]+\))\)$/;

/**
 * A token's value with the factor: a plain non-zero px or rem length, or the
 * middle term of a clamp whose limits are tokens (which carry the factor
 * themselves).
 */
export function scaleToken(value) {
  if (/^-?\d*\.?\d+(px|rem)$/.test(value) && Number.parseFloat(value) !== 0) {
    return `calc(${value} * var(--scale))`;
  }
  const fluid = FLUID.exec(value);
  if (fluid) return `clamp(${fluid[1]}, calc((${fluid[2]}) * var(--scale)), ${fluid[3]})`;
  return value;
}
export const HAIRLINE_MAX_PX = 3;

/** Wrap one run of declaration text, whose property is `property`. */
function wrapRun(run, property) {
  if (KEEP_PROPERTY.test(property)) return run;
  return run.replace(LENGTH, (whole, n, unit) =>
    unit === 'px' && Math.abs(Number(n)) <= HAIRLINE_MAX_PX ? whole : `calc(${n}${unit} * var(--scale))`,
  );
}

/** Remove every wrapper this module writes. */
export function unscaleCss(text) {
  return text.replace(WRAPPED, '$1').replace(WRAPPED_TERM, '$1');
}

/** Wrap every length that should grow. Idempotent. */
export function scaleCss(input) {
  const text = unscaleCss(input);
  let out = '';
  let i = 0;
  let run = '';
  let property = '';
  let inPrelude = false; // inside an at-rule's prelude, up to its `{` or `;`
  let atStatementStart = true;
  const flush = () => {
    out += inPrelude ? run : wrapRun(run, property);
    run = '';
  };
  while (i < text.length) {
    const c = text[i];
    if (c === '/' && text[i + 1] === '*') {
      flush();
      const end = text.indexOf('*/', i + 2);
      const stop = end === -1 ? text.length : end + 2;
      out += text.slice(i, stop);
      i = stop;
      continue;
    }
    if (c === '"' || c === "'") {
      const end = text.indexOf(c, i + 1);
      const stop = end === -1 ? text.length : end + 1;
      run += text.slice(i, stop);
      i = stop;
      atStatementStart = false;
      continue;
    }
    if (atStatementStart && c === '@') {
      flush();
      inPrelude = true;
    }
    if (c === '{' || c === '}' || c === ';') {
      flush();
      out += c;
      i += 1;
      inPrelude = false;
      property = '';
      atStatementStart = true;
      continue;
    }
    if (c === ':' && property === '' && !inPrelude) {
      // The text since the last boundary is a property name only if it is one
      // identifier; otherwise (a selector's pseudo-class) it is left alone.
      const name = run.trim();
      if (/^-{0,2}[a-zA-Z][\w-]*$/.test(name)) property = name.toLowerCase();
    }
    if (!/\s/.test(c)) atStatementStart = false;
    run += c;
    i += 1;
  }
  flush();
  return out;
}
