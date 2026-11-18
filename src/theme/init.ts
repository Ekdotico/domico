/**
 * Blocking init script.
 *
 * Theme and mode are restored from localStorage, which a React effect cannot
 * read until after first paint. Without this the page renders one frame in
 * Parchment light before switching — a full-page colour flash, and on a dark
 * theme an uncomfortable one.
 *
 * Inject the returned source in <head>, before any stylesheet, as a plain
 * synchronous script. Next.js App Router:
 *
 *   <head>
 *     <script dangerouslySetInnerHTML={{ __html: themeInitScript() }} />
 *   </head>
 *
 * Under a strict Content-Security-Policy this needs the request nonce on the
 * script tag. Where a per-request nonce is not available — an application
 * pinned to a static export, for instance — the recorded consequence is
 * `'unsafe-inline'` in `script-src`, and that trade should be written down
 * where the policy is defined rather than discovered later.
 *
 * The script touches only `documentElement` attributes and localStorage. The
 * only interpolation is the theme vocabulary, which is generated from
 * `tokens/source/` and JSON-encoded here, so there is no injection surface and
 * no second list to fall out of step with the stylesheet.
 */

import { themeNames } from '../../tokens/generated/tokens.js';
import { DEFAULT_THEME, MODE_STORAGE_KEY, THEME_STORAGE_KEY } from './appearance.js';

export function themeInitScript(): string {
  const themes = JSON.stringify(themeNames);
  const fallback = JSON.stringify(DEFAULT_THEME);
  const themeKey = JSON.stringify(THEME_STORAGE_KEY);
  const modeKey = JSON.stringify(MODE_STORAGE_KEY);

  return (
    `(function(){try{` +
    `var d=document.documentElement;` +
    // The theme attribute is always present, since the dark tokens are keyed on
    // it: the default first (so blocked storage still gets it), then a stored
    // theme over that.
    `if(!d.getAttribute("data-theme")){d.setAttribute("data-theme",${fallback});}` +
    `var t=localStorage.getItem(${themeKey});` +
    `if(${themes}.indexOf(t)!==-1){d.setAttribute("data-theme",t);}` +
    `var m=localStorage.getItem(${modeKey});` +
    `if(m==="light"||m==="dark"){d.setAttribute("data-mode",m);}` +
    // localStorage throws rather than returning null when a browser blocks
    // storage for the origin. Failing here must leave the default theme
    // applied, not an unstyled document.
    `}catch(e){}})();`
  );
}
