import React, { useRef, memo } from "react";
import { Sun, Moon } from "lucide-react";
import vsLogo from "../../assets/vs-logo.svg";
import { 
  formatVoteDeadline, 
  getCandidateNameStyle, 
} from "./voteUtils.js";
import { useFitSingleLineText } from "../../hooks/useFitSingleLineText.js";

// Sub-components
export const VoteActionButton = memo(({ action, active, count, disabled, onToggle, onShare, onComment, copied, cardId, isDarkMode }) => {
  const handleClick = () => {
    if (disabled) return;
    if (action.id === "share") { onShare(cardId); return; }
    if (action.id === "comment") { onComment(cardId); return; }
    onToggle(cardId, action.id);
  };

  const isActive = action.id === "share" ? copied : action.id === "theme" ? isDarkMode : active;

  return (
    <button
      type="button"
      className={`vote-action-button action-${action.id}${isActive ? " is-active" : ""}`}
      aria-label={action.label}
      disabled={disabled}
      onClick={handleClick}
    >
      {action.id === "theme" ? (
        isDarkMode ? (
          <Sun size={25} className="theme-toggle-svg" strokeWidth={2.4} />
        ) : (
          <Moon size={25} className="theme-toggle-svg" strokeWidth={2.4} />
        )
      ) : (
        <img src={action.icon} alt="" aria-hidden="true" />
      )}
      {action.id === "like" && <span className="vote-action-count">{count}</span>}
    </button>
  );
});

export const VoteSheetTitle = memo(({ children }) => {
  const ref = useFitSingleLineText(children);
  return <h2 ref={ref} className="vote-sheet-title">{children}</h2>;
});

export const YouTubePlayer = memo(({ videoId, title, isActive }) => {
  const iframeRef = useRef(null);

  if (!isActive) {
    return (
      <div className="custom-youtube-container">
        <img src={`https://img.youtube.com/vi/${videoId}/0.jpg`} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        <div className="player-controls is-paused"><div className="play-icon" /></div>
      </div>
    );
  }

  return (
    <div className="custom-youtube-container">
      <div className="youtube-iframe-target">
        <iframe
          ref={iframeRef} width="100%" height="100%"
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=0&mute=0&controls=1&loop=1&playlist=${videoId}&rel=0&playsinline=1&enablejsapi=1`}
          title={title} frameBorder="0" allowFullScreen
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        />
      </div>
    </div>
  );
});

export const VoteCard = memo(({
  card, selectedCandidateId, onSelect, actionState, likeCount, copied,
  onToggleAction, onShare, onOpenComments, isCommentsOpen, isActive,
  currentTime, registerCardRef, actionButtons, isDarkMode
}) => {
  const expiresAtTime = card.expiresAt ? new Date(card.expiresAt).getTime() : NaN;
  const isExpired = (Number.isFinite(expiresAtTime) && expiresAtTime <= currentTime) || Boolean(card.isExpired);
  const hasVoted = Boolean(selectedCandidateId) || isExpired;
  const deadlineLabel = formatVoteDeadline(card.expiresAt, currentTime);

  return (
    <article
      ref={registerCardRef(card.feedId)}
      className={`vote-feed-item vote-${card.id}${isActive ? " is-active" : ""}`}
      id={card.feedId}
    >
      <div className={`vote-sheet${hasVoted ? " has-results" : ""}${isExpired ? " is-expired" : ""}`}>
        {isExpired ? (
          <div className="vote-toast-badge is-expired">마감됨!</div>
        ) : (
          deadlineLabel && <div className="vote-deadline-badge">{deadlineLabel}</div>
        )}
        <VoteSheetTitle>{card.title}</VoteSheetTitle>

        <div className="vote-sheet-match">
          {[card.leftCandidate, card.rightCandidate].map((candidate) => {
            const isSelected = selectedCandidateId === candidate.id;
            const isVideo = candidate.type === "youtube" || candidate.type === "video";
            const isLeft = candidate.id === "a";
            const isIndefinite = !card.expiresAt;
            const isLoser = !isIndefinite && hasVoted && (
              (isLeft && card.shares.left < card.shares.right) ||
              (!isLeft && card.shares.right < card.shares.left)
            );

            return (
              <div key={candidate.id} className={`vote-choice tone-${candidate.tone}${isSelected ? " is-selected" : ""}${isLoser ? " is-loser" : ""}`}>
                {!hasVoted && isVideo && (
                  <button type="button" className="vote-pick-badge" onClick={(e) => { e.stopPropagation(); onSelect(card.feedId, candidate.id); }}>PICK</button>
                )}
                <div
                  className="vote-choice-inner" style={{ width: "100%", height: "100%" }}
                  onClick={!isVideo && !hasVoted ? () => onSelect(card.feedId, candidate.id) : undefined}
                >
                  {candidate.image ? (
                    candidate.type === "youtube" ? (
                      <div className="vote-choice-media"><YouTubePlayer videoId={candidate.image} title={candidate.name} isActive={isActive} /></div>
                    ) : candidate.type === "video" ? (
                      <div className="vote-choice-media">
                        <video src={candidate.image} autoPlay loop muted playsInline 
                          onClick={(e) => { e.stopPropagation(); if (e.currentTarget.paused) e.currentTarget.play(); else e.currentTarget.pause(); }} 
                        />
                      </div>
                    ) : candidate.type === "audio" ? (
                      <div className="vote-choice-audio-container">
                        <div className="audio-icon-large">🎵</div>
                        <audio src={candidate.image} controls={hasVoted} className="vote-choice-audio-player" onClick={(e) => e.stopPropagation()} />
                      </div>
                    ) : <img src={candidate.image} alt={candidate.name} />
                  ) : <span className="vote-choice-image-fallback">{candidate.name?.slice(0, 1) || "?"}</span>}
                  <span className="vote-choice-overlay" aria-hidden="true" />
                  <p className="vote-choice-name" style={getCandidateNameStyle(candidate.name)}>{candidate.name}</p>
                </div>
              </div>
            );
          })}
          <div className="vote-sheet-vs"><img src={vsLogo} alt="" /></div>
        </div>

        {hasVoted && (
          <div className="vote-sheet-results">
            <div className="vote-share-bar">
              <div className="vote-share-segment vote-share-left" style={{ width: `${card.shares.left}%` }} />
              <div className="vote-share-segment vote-share-right" style={{ width: `${card.shares.right}%` }} />
            </div>
            <div className="vote-share-footer"><span>{card.shares.left}%</span><span>{card.shares.right}%</span></div>
          </div>
        )}
      </div>

      <div className="vote-action-rail">
        {actionButtons.map((action) => (
          <VoteActionButton
            key={action.id} action={action}
            active={action.id === "comment" ? isCommentsOpen : Boolean(actionState?.[action.id])}
            disabled={action.id === "comment" && !hasVoted}
            count={action.id === "like" ? likeCount : 0}
            onToggle={onToggleAction} onShare={onShare} onComment={onOpenComments}
            copied={copied} cardId={card.feedId}
            isDarkMode={isDarkMode}
          />
        ))}
      </div>
    </article>
  );
});
