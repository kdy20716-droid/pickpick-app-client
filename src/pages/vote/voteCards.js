function shuffleCards(cards) {
  const shuffledCards = [...cards];

  for (let index = shuffledCards.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [shuffledCards[index], shuffledCards[randomIndex]] = [
      shuffledCards[randomIndex],
      shuffledCards[index],
    ];
  }

  return shuffledCards;
}

export function getVoteFeedIdFromHash(hash) {
  try {
    return decodeURIComponent(hash.replace(/^#/, ""));
  } catch {
    return hash.replace(/^#/, "");
  }
}

export function getVoteHash(feedId) {
  return `#${encodeURIComponent(feedId)}`;
}

/**
 * Note: createVoteCards and createVoteBatch were removed as they depended on undefined voteTemplates
 * and are no longer used in the current API-driven architecture of VotePage.
 */

export function pinTargetCard(cards, targetCardId) {
  if (!targetCardId) {
    return shuffleCards(cards);
  }

  const pinnedCard = cards.find((card) => card.feedId === targetCardId);

  if (!pinnedCard) {
    return shuffleCards(cards);
  }

  return [
    pinnedCard,
    ...shuffleCards(cards.filter((card) => card.feedId !== targetCardId)),
  ];
}
