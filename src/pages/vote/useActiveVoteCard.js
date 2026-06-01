import {
  useCallback,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from "react";

export function useActiveVoteCard(cards, preferredCardId = "") {
  const [manualActiveCardId, setManualActiveCardId] = useState("");
  const feedRef = useRef(null);
  const cardRefs = useRef(new Map());

  const cardIds = useMemo(() => {
    return new Set(cards.map((card) => card.feedId));
  }, [cards]);

  const activeCardId =
    manualActiveCardId && cardIds.has(manualActiveCardId)
      ? manualActiveCardId
      : preferredCardId && cardIds.has(preferredCardId)
        ? preferredCardId
        : (cards[0]?.feedId ?? "");

  const registerCardRef = useCallback((cardId) => (node) => {
    if (node) {
      cardRefs.current.set(cardId, node);
      return;
    }

    cardRefs.current.delete(cardId);
  }, []);

  const syncActiveCard = useEffectEvent(() => {
    const feed = feedRef.current;
    if (!feed) {
      return;
    }

    const feedRect = feed.getBoundingClientRect();
    const viewportCenter = feedRect.top + feedRect.height / 2;
    let nearestCardId = "";
    let nearestDistance = Number.POSITIVE_INFINITY;

    cardRefs.current.forEach((node, cardId) => {
      const rect = node.getBoundingClientRect();
      const distance = Math.abs(rect.top + rect.height / 2 - viewportCenter);

      if (distance < nearestDistance) {
        nearestDistance = distance;
        nearestCardId = cardId;
      }
    });

    if (nearestCardId && nearestCardId !== activeCardId) {
      setManualActiveCardId(nearestCardId);
    }
  });

  useEffect(() => {
    const feed = feedRef.current;
    let frameId = 0;

    if (!feed) {
      return undefined;
    }

    const handleViewportChange = () => {
      if (frameId) {
        return;
      }

      frameId = window.requestAnimationFrame(() => {
        frameId = 0;
        syncActiveCard();
      });
    };

    handleViewportChange();
    feed.addEventListener("scroll", handleViewportChange, { passive: true });
    window.addEventListener("resize", handleViewportChange);

    return () => {
      if (frameId) {
        window.cancelAnimationFrame(frameId);
      }

      feed.removeEventListener("scroll", handleViewportChange);
      window.removeEventListener("resize", handleViewportChange);
    };
  }, []);

  return {
    activeCardId,
    cardRefs,
    feedRef,
    registerCardRef,
  };
}
