import { useEffect, useRef, useState } from "react";

export interface PageOverflow {
  overflowing: boolean;
  overflowPx: number;
}

/** Measures whether an element's content exceeds its own (fixed) box
 *  height — used to warn when a CV page won't fit on one printed sheet.
 *  The element must have an explicit `height` (not `min-height`) and
 *  `overflow: visible` so content is still shown, not clipped, while
 *  `scrollHeight` still reports how far past the box it actually reaches. */
export function usePageOverflow<T extends HTMLElement>(): [React.RefObject<T | null>, PageOverflow] {
  const ref = useRef<T | null>(null);
  const [state, setState] = useState<PageOverflow>({ overflowing: false, overflowPx: 0 });

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const measure = () => {
      const over = el.scrollHeight - el.clientHeight;
      setState((prev) => {
        const overflowing = over > 4;
        const overflowPx = overflowing ? over : 0;
        if (prev.overflowing === overflowing && prev.overflowPx === overflowPx) return prev;
        return { overflowing, overflowPx };
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
