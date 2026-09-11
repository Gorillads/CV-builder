import { useEffect, useRef, useState } from "react";

export interface PageOverflow {
  overflowing: boolean;
  overflowPx: number;
  /** Room left in the box, in px — negative while overflowing. */
  remainingPx: number;
}

/** 96dpi (the box's own px sizing) → mm. */
const PX_PER_MM = 96 / 25.4;

export function pxToMm(px: number): number {
  return Math.round(px / PX_PER_MM);
}

/** Measures whether an element's content exceeds its own (fixed) box
 *  height — used to warn when a CV page won't fit on one printed sheet.
 *  The element must have an explicit `height` (not `min-height`) and
 *  `overflow: visible` so content is still shown, not clipped, while
 *  `scrollHeight` still reports how far past the box it actually reaches.
 *
 *  `scrollHeight` alone can't tell us how much room is left, though: the
 *  page's direct content block (`.cv-flow`/`.cv-grid-sidebar`) is flex-
 *  stretched to fill the page (so a tinted sidebar reaches the bottom
 *  edge), which makes its own box — and so the page's scrollHeight — as
 *  tall as the page even when the actual content ends well short of it.
 *  So "remaining" is measured separately, from the bottom edge of the
 *  actual content blocks (header/sections/footer), which aren't stretched. */
export function usePageOverflow<T extends HTMLElement>(): [React.RefObject<T | null>, PageOverflow] {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<PageOverflow>({ overflowing: false, overflowPx: 0, remainingPx: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const over = el.scrollHeight - el.clientHeight;
      const overflowing = over > 4;

      let remainingPx = -over;
      if (!overflowing) {
        const style = getComputedStyle(el);
        const innerBottom =
          el.getBoundingClientRect().bottom -
          (parseFloat(style.paddingBottom) || 0) -
          (parseFloat(style.borderBottomWidth) || 0);
        const blocks = el.querySelectorAll<HTMLElement>(":scope > .cv-header, :scope .cv-section, :scope > .cv-footer");
        let contentBottom = el.getBoundingClientRect().top + (parseFloat(style.paddingTop) || 0);
        blocks.forEach((b) => {
          const bottom = b.getBoundingClientRect().bottom;
          if (bottom > contentBottom) contentBottom = bottom;
        });
        remainingPx = Math.round(innerBottom - contentBottom);
      }

      setState((prev) => {
        const overflowPx = overflowing ? over : 0;
        if (prev.overflowing === overflowing && prev.overflowPx === overflowPx && prev.remainingPx === remainingPx) {
          return prev;
        }
        return { overflowing, overflowPx, remainingPx };
      });
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    Array.from(el.children).forEach((child) => ro.observe(child));
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true, characterData: true });

    return () => {
      ro.disconnect();
      mo.disconnect();
    };
  });

  return [ref, state];
}
