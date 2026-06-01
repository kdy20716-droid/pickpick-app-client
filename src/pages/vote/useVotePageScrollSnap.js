import { useEffect, useEffectEvent, useRef } from "react";

const OUTSIDE_SCROLL_WHEEL_THRESHOLD = 36;
const OUTSIDE_SCROLL_TOUCH_THRESHOLD = 48;
const OUTSIDE_SCROLL_LOCK_MS = 380;

function getHeaderHeight() {
  const header = document.querySelector(".site-header");
  return Math.round(header?.getBoundingClientRect().height ?? 0);
}

function getWheelDeltaY(event, fallbackHeight) {
  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    return event.deltaY * 16;
  }

  if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    return event.deltaY * fallbackHeight;
  }

  return event.deltaY;
}

function getElementTarget(target) {
  return target instanceof Element ? target : target?.parentElement;
}

export function useVotePageScrollSnap({
  pageRef,
  feedRef,
  activeCardId,
  cardRefs,
  targetCardId = "",
}) {
  const alignedTargetCardIdRef = useRef("");

  const syncViewportOffset = useEffectEvent(() => {
    const page = pageRef.current;
    if (!page) {
      return;
    }

    page.style.setProperty("--vote-header-offset", `${getHeaderHeight()}px`);
  });

  const alignActiveCard = useEffectEvent((behavior = "auto") => {
    const feed = feedRef.current;
    const activeCard = cardRefs.current.get(activeCardId);

    if (!feed || !activeCard) {
      return false;
    }

    const feedRect = feed.getBoundingClientRect();
    const cardRect = activeCard.getBoundingClientRect();
    const nextTop = feed.scrollTop + (cardRect.top - feedRect.top);

    feed.scrollTo({
      top: Math.max(0, Math.round(nextTop)),
      behavior,
    });

    return true;
  });

  const scrollToAdjacentCard = useEffectEvent((direction) => {
    const feed = feedRef.current;
    const orderedCards = Array.from(cardRefs.current.entries())
      .map(([cardId, node]) => ({ cardId, node }))
      .filter(({ node }) => node instanceof HTMLElement)
      .sort((a, b) => a.node.offsetTop - b.node.offsetTop);

    if (!feed || orderedCards.length === 0) {
      return false;
    }

    let activeIndex = orderedCards.findIndex(
      ({ cardId }) => cardId === activeCardId,
    );

    if (activeIndex < 0) {
      const feedRect = feed.getBoundingClientRect();
      const viewportCenter = feedRect.top + feedRect.height / 2;
      let nearestDistance = Number.POSITIVE_INFINITY;

      orderedCards.forEach(({ node }, index) => {
        const rect = node.getBoundingClientRect();
        const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);

        if (distance < nearestDistance) {
          nearestDistance = distance;
          activeIndex = index;
        }
      });
    }

    const nextIndex = Math.min(
      orderedCards.length - 1,
      Math.max(0, activeIndex + direction),
    );

    if (nextIndex === activeIndex) {
      return false;
    }

    const targetCard = orderedCards[nextIndex].node;
    const feedRect = feed.getBoundingClientRect();
    const cardRect = targetCard.getBoundingClientRect();
    const nextTop = feed.scrollTop + (cardRect.top - feedRect.top);

    feed.scrollTo({
      top: Math.max(0, Math.round(nextTop)),
      behavior: "smooth",
    });

    return true;
  });

  useEffect(() => {
    syncViewportOffset();

    const handleResize = () => {
      syncViewportOffset();
      alignActiveCard();
    };

    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    const page = pageRef.current;
    const feed = feedRef.current;

    if (!page || !feed) {
      return undefined;
    }

    let lastTouchY = 0;
    let wheelDeltaY = 0;
    let outsideScrollLockedUntil = 0;
    let isProxyingTouch = false;
    let touchDeltaY = 0;

    const shouldProxyScroll = (target, clientY) => {
      if (clientY < getHeaderHeight()) {
        return false;
      }

      const elementTarget = getElementTarget(target);

      if (elementTarget?.closest(".comment-modal, .vote-filter-panel")) {
        return false;
      }

      return true;
    };

    const tryScrollAdjacent = (deltaY, threshold) => {
      if (Math.abs(deltaY) < threshold) {
        return false;
      }

      const now = window.performance.now();
      if (now < outsideScrollLockedUntil) {
        return true;
      }

      if (scrollToAdjacentCard(deltaY > 0 ? 1 : -1)) {
        outsideScrollLockedUntil = now + OUTSIDE_SCROLL_LOCK_MS;
      }

      return true;
    };

    const handleWheel = (event) => {
      if (!shouldProxyScroll(event.target, event.clientY)) {
        return;
      }

      event.preventDefault();

      const deltaY = getWheelDeltaY(event, feed.clientHeight);

      if (wheelDeltaY && Math.sign(wheelDeltaY) !== Math.sign(deltaY)) {
        wheelDeltaY = 0;
      }

      wheelDeltaY += deltaY;

      if (tryScrollAdjacent(wheelDeltaY, OUTSIDE_SCROLL_WHEEL_THRESHOLD)) {
        wheelDeltaY = 0;
      }
    };

    const handleTouchStart = (event) => {
      const touch = event.touches[0];
      if (!touch || !shouldProxyScroll(event.target, touch.clientY)) {
        isProxyingTouch = false;
        return;
      }

      isProxyingTouch = true;
      lastTouchY = touch.clientY;
      touchDeltaY = 0;
    };

    const handleTouchMove = (event) => {
      if (!isProxyingTouch) {
        return;
      }

      const touch = event.touches[0];
      if (!touch) {
        return;
      }

      const deltaY = lastTouchY - touch.clientY;
      lastTouchY = touch.clientY;

      if (deltaY === 0) {
        return;
      }

      event.preventDefault();
      touchDeltaY += deltaY;

      if (tryScrollAdjacent(touchDeltaY, OUTSIDE_SCROLL_TOUCH_THRESHOLD)) {
        touchDeltaY = 0;
      }
    };

    const handleTouchEnd = () => {
      isProxyingTouch = false;
      touchDeltaY = 0;
    };

    const handleKeyDown = (event) => {
      // Don't proxy if we're in an input or textarea
      if (
        event.target instanceof HTMLInputElement ||
        event.target instanceof HTMLTextAreaElement
      ) {
        return;
      }

      const { key, shiftKey } = event;

      if (key === "ArrowDown" || key === "PageDown") {
        if (scrollToAdjacentCard(1)) {
          event.preventDefault();
        }
      } else if (key === "ArrowUp" || key === "PageUp") {
        if (scrollToAdjacentCard(-1)) {
          event.preventDefault();
        }
      } else if (key === " ") {
        if (scrollToAdjacentCard(shiftKey ? -1 : 1)) {
          event.preventDefault();
        }
      }
    };

    window.addEventListener("wheel", handleWheel, {
      capture: true,
      passive: false,
    });
    window.addEventListener("touchstart", handleTouchStart, {
      capture: true,
      passive: true,
    });
    window.addEventListener("touchmove", handleTouchMove, {
      capture: true,
      passive: false,
    });
    window.addEventListener("touchend", handleTouchEnd, { capture: true });
    window.addEventListener("touchcancel", handleTouchEnd, { capture: true });
    window.addEventListener("keydown", handleKeyDown, { capture: true });

    return () => {
      window.removeEventListener("wheel", handleWheel, { capture: true });
      window.removeEventListener("touchstart", handleTouchStart, {
        capture: true,
      });
      window.removeEventListener("touchmove", handleTouchMove, {
        capture: true,
      });
      window.removeEventListener("touchend", handleTouchEnd, {
        capture: true,
      });
      window.removeEventListener("touchcancel", handleTouchEnd, {
        capture: true,
      });
      window.removeEventListener("keydown", handleKeyDown, { capture: true });
    };
  }, []);

  useEffect(() => {
    if (!targetCardId || activeCardId !== targetCardId) {
      return undefined;
    }

    if (alignedTargetCardIdRef.current === targetCardId) {
      return undefined;
    }

    const frameId = window.requestAnimationFrame(() => {
      if (alignActiveCard()) {
        alignedTargetCardIdRef.current = targetCardId;
      }
    });

    return () => {
      window.cancelAnimationFrame(frameId);
    };
  }, [activeCardId, targetCardId]);
}
