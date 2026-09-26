'use client';

import { useEffect } from 'react';

/**
 * A sticky `<thead>` for every `.tbl-wrap` on the page, at narrow viewports.
 *
 *   <StickyTableHead />                 // once, in the root layout
 *   <StickyTableHead rescanKey={path} /> // with a client-side router
 *
 * Why this exists. Below 920px `styles/table.css` gives `.tbl-wrap`
 * `overflow-x: auto`, so a wide table scrolls inside its card. By the CSS
 * overflow rules that coerces `overflow-y` to `auto` as well, which makes the
 * wrapper a scroll container in both axes, and `position: sticky` on a header
 * cell then resolves to the wrapper's top rather than the page's — the header
 * scrolls away with the rows. The stylesheet therefore makes the header static
 * there, and this component puts a fixed-position mirror of it at the viewport
 * instead, so a reader scrolling down a long table on a phone keeps the column
 * names.
 *
 * At 921px and above the wrapper does not scroll, the native sticky header in
 * the stylesheet is on duty, and this component does nothing at all. Running
 * the mirror there too would show two headers during a fast layout change,
 * because a mirror updated on animation frames trails native sticky by one.
 *
 * Why a mirror rather than CSS alone. `overflow-x: clip` would keep sticky
 * working and take horizontal scrolling away, and a reader on a phone needs
 * both. The original wrapper keeps its scroller; the mirror is a visual copy,
 * `aria-hidden` and inert, that tracks the wrapper's horizontal scroll.
 *
 * The header parks at `--table-sticky-offset`, the same token the native
 * sticky header reads, resolved to pixels through the cascade so a value in
 * `rem` or a `var(--topbar-h)` reference measures correctly. The documentation
 * site and the research area in deree each carried a copy of this component,
 * three hundred lines long and identical but for one comment; one of them
 * parked the mirror at a pixel default for the top bar while the stylesheet
 * parked the native header at the token, so the two could disagree about
 * where the header sits.
 *
 * Wrappers added or removed after mount — a tab panel switching, content
 * rendered late — are picked up by a MutationObserver on the body. A
 * client-side router that swaps the page without remounting the layout should
 * pass the route as `rescanKey`, which rebuilds every mirror from scratch.
 */

const NARROW_QUERY = '(max-width: 920px)';

export function StickyTableHead({ rescanKey }: { rescanKey?: unknown } = {}) {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const mq = window.matchMedia(NARROW_QUERY);
    const mirrors = new Map<HTMLElement, HeadMirror>();
    let observer: MutationObserver | null = null;

    const activate = (wrap: HTMLElement) => {
      if (mirrors.has(wrap)) return;
      const mirror = HeadMirror.tryCreate(wrap);
      if (mirror) mirrors.set(wrap, mirror);
    };

    const deactivate = (wrap: HTMLElement) => {
      const existing = mirrors.get(wrap);
      if (!existing) return;
      existing.destroy();
      mirrors.delete(wrap);
    };

    const within = (root: HTMLElement, fn: (wrap: HTMLElement) => void) => {
      // A mirror carries the wrapper's classes, `.tbl-wrap` included, so it
      // must never be mistaken for a table to mirror.
      if (root.matches('.tbl-wrap:not(.tbl-sticky-clone)')) fn(root);
      root.querySelectorAll<HTMLElement>('.tbl-wrap:not(.tbl-sticky-clone)').forEach(fn);
    };

    const enable = () => {
      within(document.body, activate);
      if (observer) return;
      observer = new MutationObserver((mutations) => {
        for (const m of mutations) {
          m.addedNodes.forEach((node) => {
            if (node instanceof HTMLElement) within(node, activate);
          });
          m.removedNodes.forEach((node) => {
            if (node instanceof HTMLElement) within(node, deactivate);
          });
        }
      });
      observer.observe(document.body, { childList: true, subtree: true });
    };

    const disable = () => {
      observer?.disconnect();
      observer = null;
      mirrors.forEach((mirror) => mirror.destroy());
      mirrors.clear();
    };

    const apply = (narrow: boolean) => (narrow ? enable() : disable());
    apply(mq.matches);
    const onChange = (event: MediaQueryListEvent) => apply(event.matches);
    mq.addEventListener('change', onChange);

    return () => {
      mq.removeEventListener('change', onChange);
      disable();
    };
  }, [rescanKey]);

  return null;
}

/**
 * The resolved `--table-sticky-offset`, in pixels.
 *
 * Read through a probe element rather than parsed from the custom property's
 * text: the token may be `0px`, a `rem` value, or a `var(--topbar-h)`
 * reference an application set, and `top` on a fixed element computes every
 * one of those to an absolute length.
 */
function stickyOffset(): number {
  const probe = document.createElement('div');
  probe.style.cssText = 'position:fixed;visibility:hidden;pointer-events:none;top:var(--table-sticky-offset)';
  document.body.appendChild(probe);
  const value = parseFloat(getComputedStyle(probe).top);
  probe.remove();
  return Number.isFinite(value) && value > 0 ? value : 0;
}

/**
 * One fixed-position mirror of one wrapper's `<thead>`. Owns its nodes, its
 * listeners, its ResizeObserver and its animation frame; `destroy()` releases
 * every one of them and is called exactly once.
 */
class HeadMirror {
  private readonly clone: HTMLDivElement;
  private readonly cloneScroll: HTMLDivElement;
  private readonly cloneTable: HTMLTableElement;

  private offset = 0;
  private cachedTableWidth = 0;
  private cachedColCount = 0;
  private rafId = 0;
  private resizeObserver: ResizeObserver | null = null;

  private readonly onWindowScroll = () => this.schedule();
  private readonly onWindowResize = () => {
    this.offset = stickyOffset();
    this.rebuild();
    this.update();
  };
  private readonly onWrapScroll = () => this.schedule();

  /** Null when the wrapper does not hold the `<table><thead>` shape. */
  static tryCreate(wrap: HTMLElement): HeadMirror | null {
    const table = wrap.querySelector(':scope > table');
    if (!(table instanceof HTMLTableElement)) return null;
    const thead = table.querySelector(':scope > thead');
    if (!(thead instanceof HTMLTableSectionElement)) return null;
    return new HeadMirror(wrap, table, thead);
  }

  private constructor(
    private readonly wrap: HTMLElement,
    private readonly table: HTMLTableElement,
    private readonly thead: HTMLTableSectionElement,
  ) {
    // The wrapper's classes travel with the mirror so any modifier an
    // application puts on a table cascades to its header copy too.
    this.clone = document.createElement('div');
    this.clone.className = `${wrap.className} tbl-sticky-clone`.trim();
    // A copy for the eye only. The real header is in the document, and a
    // screen reader or a Tab press that reached the copy would meet every
    // column name twice.
    this.clone.setAttribute('aria-hidden', 'true');
    this.clone.setAttribute('inert', '');

    this.cloneScroll = document.createElement('div');
    this.cloneScroll.className = 'tbl-sticky-clone-scroll';
    this.clone.appendChild(this.cloneScroll);

    this.cloneTable = document.createElement('table');
    this.cloneTable.className = table.className;
    this.cloneScroll.appendChild(this.cloneTable);

    document.body.appendChild(this.clone);

    this.offset = stickyOffset();
    this.rebuild();
    this.update();

    window.addEventListener('scroll', this.onWindowScroll, { passive: true });
    window.addEventListener('resize', this.onWindowResize);
    this.wrap.addEventListener('scroll', this.onWrapScroll, { passive: true });

    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver(() => {
        const liveCols = this.measureRow()?.children.length ?? 0;
        if (liveCols !== this.cachedColCount) this.rebuild();
        else this.schedule();
      });
      this.resizeObserver.observe(this.wrap);
    }
  }

  destroy() {
    window.removeEventListener('scroll', this.onWindowScroll);
    window.removeEventListener('resize', this.onWindowResize);
    this.wrap.removeEventListener('scroll', this.onWrapScroll);
    this.resizeObserver?.disconnect();
    if (this.rafId) cancelAnimationFrame(this.rafId);
    this.clone.remove();
  }

  /**
   * A body row, where there is one, for the column widths: its widths reflect
   * how the content is distributed, where a header of short labels might
   * collapse. The header row when the table is empty.
   */
  private measureRow(): HTMLTableRowElement | null {
    return (
      this.table.querySelector<HTMLTableRowElement>(':scope > tbody > tr') ??
      this.thead.querySelector<HTMLTableRowElement>(':scope > tr')
    );
  }

  private rebuild() {
    const row = this.measureRow();
    if (!row) return;

    const widths = Array.from(row.children).map((cell) => cell.getBoundingClientRect().width);
    this.cachedTableWidth = this.table.getBoundingClientRect().width;
    this.cachedColCount = widths.length;

    let colgroup = this.cloneTable.querySelector('colgroup');
    if (!colgroup) {
      colgroup = document.createElement('colgroup');
      this.cloneTable.appendChild(colgroup);
    }
    colgroup.replaceChildren(
      ...widths.map((w) => {
        const col = document.createElement('col');
        col.style.width = `${w}px`;
        return col;
      }),
    );

    this.cloneTable.querySelector('thead')?.remove();
    const fresh = this.thead.cloneNode(true) as HTMLTableSectionElement;
    // An id copied into the mirror would exist twice in the document, and an
    // aria reference to it would resolve to whichever came first.
    fresh.querySelectorAll('[id]').forEach((el) => el.removeAttribute('id'));
    this.cloneTable.appendChild(fresh);

    this.cloneTable.style.width = `${this.cachedTableWidth}px`;
    this.cloneTable.style.tableLayout = 'fixed';
  }

  private update() {
    const wrapRect = this.wrap.getBoundingClientRect();
    const theadRect = this.thead.getBoundingClientRect();
    const cloneH = this.clone.offsetHeight || theadRect.height;

    // Hidden only when the wrapper is wholly out of the viewport: there is
    // nothing to mirror, and the copy would dangle.
    if (wrapRect.bottom <= 0 || wrapRect.top >= window.innerHeight) {
      this.clone.classList.remove('is-visible');
      return;
    }

    // The same arithmetic as native sticky. While the real header is below the
    // offset the mirror sits exactly on it; once it would pass above, the
    // mirror holds at the offset and the real one scrolls on beneath; as the
    // wrapper's bottom edge arrives the mirror rides up with it, so it never
    // leaves its card.
    const top = Math.min(Math.max(this.offset, theadRect.top), wrapRect.bottom - cloneH);

    this.clone.style.top = `${top}px`;
    this.clone.style.left = `${wrapRect.left}px`;
    this.clone.style.width = `${wrapRect.width}px`;
    // A transform rather than scrollLeft for the horizontal sync. Safari, and
    // other engines under smooth scrolling, round scrollLeft to whole pixels,
    // which left the mirror a pixel behind a fractional wrapper offset; a
    // transform keeps the fraction. The scroll box keeps `overflow: hidden`,
    // so the shifted table is still clipped to the card.
    this.cloneTable.style.transform = `translate3d(${-this.wrap.scrollLeft}px, 0, 0)`;

    // The table reflowed — a rail collapsed, the viewport turned.
    if (Math.abs(this.table.getBoundingClientRect().width - this.cachedTableWidth) > 0.5) {
      this.rebuild();
    }

    this.clone.classList.add('is-visible');
  }

  private schedule() {
    if (this.rafId) return;
    this.rafId = requestAnimationFrame(() => {
      this.rafId = 0;
      this.update();
    });
  }
}
