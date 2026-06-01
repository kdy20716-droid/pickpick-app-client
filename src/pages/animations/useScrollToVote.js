import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { mainRouteTransitions } from "./routeTransitions.js";

const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const SCROLL_TRANSITION_DURATION = 520;
const WHEEL_THRESHOLD = 80;
const TOUCH_THRESHOLD = 50;

export function useScrollToVote() {
  const navigate = useNavigate();
  const [isLeavingForVote, setIsLeavingForVote] = useState(false);
  const hasNavigatedRef = useRef(false);
  const wheelDeltaRef = useRef(0);
  const touchStartYRef = useRef(null);
  const navigateTimeoutRef = useRef(null);

  useEffect(() => {
    const navigateToVote = () => {
      if (hasNavigatedRef.current) {
        return;
      }

      hasNavigatedRef.current = true;
      setIsLeavingForVote(true);

      const transitionDuration = window.matchMedia(REDUCED_MOTION_QUERY).matches
        ? 0
        : SCROLL_TRANSITION_DURATION;

      navigateTimeoutRef.current = window.setTimeout(() => {
        navigate("/vote", {
          state: { transition: mainRouteTransitions.scroll },
        });
      }, transitionDuration);
    };

    const onWheel = (event) => {
      if (event.deltaY <= 0) {
        wheelDeltaRef.current = 0;
        return;
      }

      wheelDeltaRef.current += event.deltaY;
      if (wheelDeltaRef.current >= WHEEL_THRESHOLD) {
        event.preventDefault();
        navigateToVote();
      }
    };

    const onTouchStart = (event) => {
      touchStartYRef.current = event.touches[0]?.clientY ?? null;
    };

    const onTouchEnd = (event) => {
      const touchStartY = touchStartYRef.current;
      const touchEndY = event.changedTouches[0]?.clientY;
      touchStartYRef.current = null;

      if (touchStartY == null || touchEndY == null) {
        return;
      }

      if (touchStartY - touchEndY >= TOUCH_THRESHOLD) {
        navigateToVote();
      }
    };

    window.addEventListener("wheel", onWheel, { passive: false });
    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      if (navigateTimeoutRef.current) {
        window.clearTimeout(navigateTimeoutRef.current);
      }

      window.removeEventListener("wheel", onWheel);
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchend", onTouchEnd);
    };
  }, [navigate]);

  return isLeavingForVote;
}
