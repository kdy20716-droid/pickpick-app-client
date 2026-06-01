import { useEffect } from "react";
import { getVoteHash } from "./voteCards.js";

export function useActiveVoteHash(activeCardId, location) {
  useEffect(() => {
    if (!activeCardId) {
      return;
    }

    const nextHash = getVoteHash(activeCardId);
    if (window.location.hash === nextHash) {
      return;
    }

    window.history.replaceState(
      window.history.state,
      "",
      `${location.pathname}${location.search}${nextHash}`,
    );
  }, [activeCardId, location.pathname, location.search]);
}
