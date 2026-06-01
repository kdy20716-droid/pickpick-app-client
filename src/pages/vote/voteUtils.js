export const initialActionState = {
  like: false,
  likeCount: 0,
};

const CANDIDATE_NAME_MAX_SIZE_REM = 2.65;
const CANDIDATE_NAME_MIN_SIZE_REM = 1.05;
const CANDIDATE_NAME_COMFORT_LENGTH = 6.5;
const CANDIDATE_NAME_SHRINK_RATE = 0.17;

export function getCandidateNameWeight(name = "") {
  return Array.from(String(name).trim()).reduce((total, character) => {
    if (/\s/.test(character)) return total + 0.35;
    if (/[A-Za-z0-9]/.test(character)) return total + 0.6;
    if (/[\x20-\x7E]/.test(character)) return total + 0.45;
    return total + 1;
  }, 0);
}

export function getCandidateNameStyle(name) {
  const overflowLength = Math.max(0, getCandidateNameWeight(name) - CANDIDATE_NAME_COMFORT_LENGTH);
  const sizeRem = Math.max(
    CANDIDATE_NAME_MIN_SIZE_REM,
    CANDIDATE_NAME_MAX_SIZE_REM - overflowLength * CANDIDATE_NAME_SHRINK_RATE,
  );
  return { "--vote-choice-name-fit-size": `${sizeRem.toFixed(2)}rem` };
}

export function formatVoteDeadline(expiresAt, currentTime) {
  if (!expiresAt) return "무기한";
  const date = new Date(expiresAt);
  if (Number.isNaN(date.getTime())) return "";

  const remainingMs = date.getTime() - currentTime;
  if (remainingMs <= 0) return "마감됨";

  const totalSeconds = Math.floor(remainingMs / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const pad = (num) => String(num).padStart(2, "0");
  const time = `${pad(hours)}:${pad(minutes)}:${pad(seconds)}`;

  return days > 0 ? `마감 ${days}일 ${time}` : `마감 ${time}`;
}

export function updateCardActionState(currentActions, cardId, actionId, options = {}) {
  const previousState = currentActions[cardId] ?? initialActionState;

  if (actionId === "like") {
    const nextLike = typeof options.like === "boolean" ? options.like : !previousState.like;
    const fallbackLikeCount = Math.max(0, previousState.likeCount + (nextLike ? 1 : -1));
    return {
      ...currentActions,
      [cardId]: {
        ...previousState,
        like: nextLike,
        likeCount: typeof options.likeCount === "number" ? Math.max(0, options.likeCount) : fallbackLikeCount,
      },
    };
  }

  return currentActions;
}
