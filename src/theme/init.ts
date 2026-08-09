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
 * script tag. It touches only documentElement.dataset and localStorage, and
 * interpolates nothing, so there is no injection surface.
 */
export function themeInitScript(): string {
  return `(function(){try{var t=localStorage.getItem('ekd-theme');if(t==='parchment'||t==='library'||t==='sepia'||t==='mono'){document.documentElement.dataset.theme=t}var m=localStorage.getItem('ekd-mode');if(m==='light'||m==='dark'){document.documentElement.dataset.mode=m}}catch(e){}})();`;
}
