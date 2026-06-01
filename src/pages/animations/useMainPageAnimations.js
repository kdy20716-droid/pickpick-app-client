import { useEffect } from "react";

const MOTION_QUERY = "(prefers-reduced-motion: reduce)";
const NAV_IDLE_COLOR = "rgba(17, 17, 17, 0.58)";
const NAV_ACTIVE_COLOR = "rgba(17, 17, 17, 0.98)";
const NEXT_IDLE_COLOR = "rgb(85, 85, 85)";
const NEXT_ACTIVE_COLOR = "rgb(252, 146, 199)";
const ENTRANCE_BOUNCE_DELAY = 3000;

function animate(element, keyframes, options) {
  if (!element?.animate) {
    return null;
  }

  return element.animate(keyframes, {
    fill: "forwards",
    ...options,
  });
}

function getCssNumber(name, fallback) {
  const value = getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  const parsed = Number.parseFloat(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function useMainPageAnimations(pageRef) {
  useEffect(() => {
    const page = pageRef.current;
    if (!page) {
      return undefined;
    }

    const mediaQuery = window.matchMedia(MOTION_QUERY);
    if (mediaQuery.matches) {
      return undefined;
    }

    const voteSection = page.querySelector(".vote-section");
    const nextVote = page.querySelector(".next-vote");
    const candidateCards = Array.from(page.querySelectorAll(".candidate-card"));
    const navLinks = Array.from(
      page.querySelectorAll(".site-nav a:not(.account-link)"),
    );

    const floatDistance = getCssNumber("--float-distance", 12);
    const hoverLift = getCssNumber("--hover-lift", 14);
    const runningAnimations = new Set();
    const cleanups = [];

    const track = (animation) => {
      if (!animation) {
        return null;
      }

      runningAnimations.add(animation);
      animation.addEventListener(
        "finish",
        () => {
          runningAnimations.delete(animation);
        },
        { once: true },
      );
      animation.addEventListener(
        "cancel",
        () => {
          runningAnimations.delete(animation);
        },
        { once: true },
      );

      return animation;
    };

    const playBounce = (element, delay) => {
      track(
        animate(
          element,
          [
            { transform: "translateY(0)" },
            {
              offset: 0.32,
              transform: `translateY(-${floatDistance}px)`,
            },
            { offset: 0.64, transform: "translateY(4px)" },
            { transform: "translateY(0)" },
          ],
          {
            duration: 2700,
            delay,
            easing: "cubic-bezier(0.2, 0.8, 0.2, 1)",
          },
        ),
      );
    };

    playBounce(voteSection, ENTRANCE_BOUNCE_DELAY);
    playBounce(nextVote, ENTRANCE_BOUNCE_DELAY);

    navLinks.forEach((link) => {
      let currentAnimation = null;

      const enter = () => {
        currentAnimation?.cancel();
        currentAnimation = track(
          animate(
            link,
            [{ color: NAV_IDLE_COLOR }, { color: NAV_ACTIVE_COLOR }],
            { duration: 250, easing: "ease" },
          ),
        );
      };

      const leave = () => {
        currentAnimation?.cancel();
        currentAnimation = track(
          animate(
            link,
            [
              { color: getComputedStyle(link).color },
              { color: NAV_IDLE_COLOR },
            ],
            { duration: 250, easing: "ease" },
          ),
        );
      };

      link.addEventListener("mouseenter", enter);
      link.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        currentAnimation?.cancel();
        link.removeEventListener("mouseenter", enter);
        link.removeEventListener("mouseleave", leave);
      });
    });

    candidateCards.forEach((card) => {
      const image = card.querySelector("img");
      let cardAnimation = null;
      let imageAnimation = null;

      const enter = () => {
        cardAnimation?.cancel();
        imageAnimation?.cancel();

        cardAnimation = track(
          animate(
            card,
            [
              { transform: "scale(1)" },
              { transform: "scale(1.03)" },
            ],
            { duration: 280, easing: "ease" },
          ),
        );

        imageAnimation = track(
          animate(
            image,
            [{ transform: "scale(1)" }, { transform: "scale(1.04)" }],
            { duration: 280, easing: "ease" },
          ),
        );
      };

      const leave = () => {
        cardAnimation?.cancel();
        imageAnimation?.cancel();

        cardAnimation = track(
          animate(
            card,
            [
              { transform: getComputedStyle(card).transform },
              { transform: "scale(1)" },
            ],
            { duration: 280, easing: "ease" },
          ),
        );

        imageAnimation = track(
          animate(
            image,
            [{ transform: getComputedStyle(image).transform }, { transform: "scale(1)" }],
            { duration: 280, easing: "ease" },
          ),
        );
      };

      card.addEventListener("mouseenter", enter);
      card.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        cardAnimation?.cancel();
        imageAnimation?.cancel();
        card.removeEventListener("mouseenter", enter);
        card.removeEventListener("mouseleave", leave);
      });
    });

    if (nextVote && voteSection) {
      let nextVoteAnimation = null;
      let voteSectionAnimation = null;

      const enter = () => {
        nextVoteAnimation?.cancel();
        voteSectionAnimation?.cancel();

        nextVoteAnimation = track(
          animate(
            nextVote,
            [{ color: NEXT_IDLE_COLOR }, { color: NEXT_ACTIVE_COLOR }],
            { duration: 250, easing: "ease" },
          ),
        );

        voteSectionAnimation = track(
          animate(
            voteSection,
            [
              { transform: "translateY(0)" },
              { transform: `translateY(-${hoverLift}px)` },
            ],
            { duration: 350, easing: "ease" },
          ),
        );
      };

      const leave = () => {
        nextVoteAnimation?.cancel();
        voteSectionAnimation?.cancel();

        nextVoteAnimation = track(
          animate(
            nextVote,
            [{ color: getComputedStyle(nextVote).color }, { color: NEXT_IDLE_COLOR }],
            { duration: 250, easing: "ease" },
          ),
        );

        voteSectionAnimation = track(
          animate(
            voteSection,
            [
              { transform: getComputedStyle(voteSection).transform },
              { transform: "translateY(0)" },
            ],
            { duration: 350, easing: "ease" },
          ),
        );
      };

      nextVote.addEventListener("mouseenter", enter);
      nextVote.addEventListener("mouseleave", leave);
      cleanups.push(() => {
        nextVoteAnimation?.cancel();
        voteSectionAnimation?.cancel();
        nextVote.removeEventListener("mouseenter", enter);
        nextVote.removeEventListener("mouseleave", leave);
      });
    }

    return () => {
      cleanups.forEach((cleanup) => cleanup());
      runningAnimations.forEach((animation) => animation.cancel());
      runningAnimations.clear();
    };
  }, [pageRef]);
}
