import { useCallback, useLayoutEffect, useRef } from "react";

const MIN_PX = 12;

/**
 * Keeps text on one line by lowering font-size until it fits the element width.
 * Clears inline font-size first so the stylesheet "max" size (--vote-*-size) applies.
 */
export function useFitSingleLineText(dependency) {
  const ref = useRef(null);

  const fit = useCallback(() => {
    const node = ref.current;
    if (!node) return;

    node.style.whiteSpace = "nowrap";
    node.style.overflow = "hidden";

    node.style.fontSize = "";
    const maxPx = parseFloat(getComputedStyle(node).fontSize);
    if (!Number.isFinite(maxPx) || maxPx <= 0) return;

    const w = node.clientWidth;
    if (w <= 0) return;

    let lo = MIN_PX;
    let hi = maxPx;
    for (let i = 0; i < 56 && hi - lo > 0.35; i += 1) {
      const mid = (lo + hi) / 2;
      node.style.fontSize = `${mid}px`;
      if (node.scrollWidth <= w + 1) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    node.style.fontSize = `${lo}px`;
  }, []);

  useLayoutEffect(() => {
    const node = ref.current;
    if (!node) return undefined;

    fit();

    const ro = new ResizeObserver(() => {
      requestAnimationFrame(fit);
    });
    ro.observe(node);

    let cancelled = false;
    if (document.fonts?.ready) {
      document.fonts.ready.then(() => {
        if (!cancelled) requestAnimationFrame(fit);
      });
    }

    return () => {
      cancelled = true;
      ro.disconnect();
    };
  }, [dependency, fit]);

  return ref;
}
