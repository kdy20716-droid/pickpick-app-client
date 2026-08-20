import { getImageUrl } from "../utils/image";

function formatRelativeTime(createdAt) {
  const diffMinutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));

  if (diffMinutes < 1) {
    return "방금 전";
  }

  if (diffMinutes < 60) {
    return `${diffMinutes}분 전`;
  }

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours}시간 전`;
  }

  return `${Math.floor(diffHours / 24)}일 전`;
}

function LikeIcon({ isActive = false }) {
  return (
    <svg
      className={`like-icon${isActive ? " is-filled" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M9 21H6.2a1.2 1.2 0 0 1-1.2-1.2V11a1.2 1.2 0 0 1 1.2-1.2H9m0 11V9.2l3.2-5.1A1.3 1.3 0 0 1 14.6 5l-.5 4.8h4.7a1.8 1.8 0 0 1 1.8 2.1l-1.1 6.8A2.8 2.8 0 0 1 16.8 21H9Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CommentIcon({ isActive = false }) {
  return (
    <svg
      className={`comment-icon${isActive ? " is-filled" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M6.8 18.5 4 20V6.8A1.8 1.8 0 0 1 5.8 5h12.4A1.8 1.8 0 0 1 20 6.8v8.4a1.8 1.8 0 0 1-1.8 1.8H6.8Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function DislikeIcon({ isActive = false }) {
  return (
    <svg
      className={`dislike-icon${isActive ? " is-filled" : ""}`}
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M15 3h2.8A1.2 1.2 0 0 1 19 4.2V13a1.2 1.2 0 0 1-1.2 1.2H15M15 3v11.8l-3.2 5.1a1.3 1.3 0 0 1-2.4-.9l.5-4.8H5.2A1.8 1.8 0 0 1 3.4 12l1.1-6.8A2.8 2.8 0 0 1 7.2 3H15Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg
      className="trash-icon"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M4 7h16M9 7V5.8A1.8 1.8 0 0 1 10.8 4h2.4A1.8 1.8 0 0 1 15 5.8V7m-8.8 0 .7 10.1A2 2 0 0 0 8.9 19h6.2a2 2 0 0 0 2-1.9L17.8 7M10 10.5v5.5M14 10.5v5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ReplyItem({ reply, openMenuId, onToggleMenu, onDeleteComment, currentUser, isAdmin }) {
  const isMenuOpen = openMenuId === reply.id;
  const canDelete = Boolean(
    isAdmin ||
    (currentUser && (
      (reply.user_id && String(currentUser.id) === String(reply.user_id)) ||
      (reply.name && currentUser.name === reply.name)
    ))
  );
  
  return (
    <div className="reply-item">
      <div className={`comment-avatar comment-avatar-small ${reply.author_border ? `profile-border-${reply.author_border}` : ""}`} aria-hidden="true">
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
          {reply.author_image ? (
            <img
              src={getImageUrl(reply.author_image)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
      </div>
      <div className="reply-content">
        <div className="comment-top">
          <div className="name-row">
            <span className="comment-name">{reply.name}</span>
            <span className="time-label">
              {formatRelativeTime(reply.createdAt)}
            </span>
          </div>
          {canDelete && (
            <div className="comment-menu-wrap">
              <button
                type="button"
                className="menu-button"
                onClick={() => onToggleMenu(reply.id)}
                aria-label="댓글 메뉴 열기"
              >
                ...
              </button>
              {isMenuOpen ? (
                <button
                  type="button"
                  className="comment-delete"
                  onClick={() => onDeleteComment(reply.id)}
                >
                  <TrashIcon />
                  댓글 삭제
                </button>
              ) : null}
            </div>
          )}
        </div>
        <p className="comment-text">{reply.text}</p>
      </div>
    </div>
  );
}

export default function CommentItem({
  comment,
  isOpen,
  replyDraft,
  openMenuId,
  onLike,
  onDislike,
  onToggleReplies,
  onReplyDraftChange,
  onAddReply,
  onToggleMenu,
  onDeleteComment,
  currentUser,
  isAdmin,
}) {
  const replyCount = comment.replyItems.length;
  const isMenuOpen = openMenuId === comment.id;
  const canDelete = Boolean(
    isAdmin ||
    (currentUser && (
      (comment.user_id && String(currentUser.id) === String(comment.user_id)) ||
      (comment.name && currentUser.name === comment.name)
    ))
  );

  return (
    <article className="comment-item">
      <div className={`comment-avatar ${comment.author_border ? `profile-border-${comment.author_border}` : ""}`} aria-hidden="true">
        <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
          {comment.author_image ? (
            <img
              src={getImageUrl(comment.author_image)}
              alt=""
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          ) : null}
        </div>
      </div>
      <div className="comment-body">
        <div className="comment-top">
          <div className="name-row">
            <span className="comment-name">{comment.name}</span>
            <span className="time-label">
              {formatRelativeTime(comment.createdAt)}
            </span>
          </div>
          {canDelete && (
            <div className="comment-menu-wrap">
              <button
                type="button"
                className="menu-button"
                onClick={() => onToggleMenu(comment.id)}
                aria-label="댓글 메뉴 열기"
              >
                ...
              </button>
              {isMenuOpen ? (
                <button
                  type="button"
                  className="comment-delete"
                  onClick={() => onDeleteComment(comment.id)}
                >
                  <TrashIcon />
                  댓글 삭제
                </button>
              ) : null}
            </div>
          )}
        </div>

        <p className="comment-text">{comment.text}</p>

        <div className="comment-meta">
          <div className="actions">
            <button
              type="button"
              className={`action-button like-button${
                comment.reaction === "like" ? " is-active" : ""
              }`}
              onClick={() => onLike(comment.id)}
            >
              <LikeIcon isActive={comment.reaction === "like"} />
              <span>{comment.likes}</span>
            </button>
            <button
              type="button"
              className={`action-button dislike-button${
                comment.reaction === "dislike" ? " is-active" : ""
              }`}
              onClick={() => onDislike(comment.id)}
            >
              <DislikeIcon isActive={comment.reaction === "dislike"} />
            </button>
            <button
              type="button"
              className={`action-button comment-button${
                isOpen ? " is-active" : ""
              }`}
              onClick={() => onToggleReplies(comment.id)}
            >
              <CommentIcon isActive={isOpen} />
              <span>{replyCount > 0 ? replyCount : ""}</span>
            </button>
          </div>
          <button
            type="button"
            className={`reply${isOpen ? " is-active" : ""}`}
            onClick={() => onToggleReplies(comment.id)}
          >
            {isOpen
              ? "답글 숨기기"
              : replyCount > 0
                ? `답글 ${replyCount}개`
                : "답글 달기"}
          </button>
        </div>

        {isOpen ? (
          <>
            {replyCount > 0 ? (
              <div className="reply-list">
                {comment.replyItems.map((reply) => (
                  <ReplyItem 
                    key={reply.id} 
                    reply={reply}
                    openMenuId={openMenuId}
                    onToggleMenu={onToggleMenu}
                    onDeleteComment={onDeleteComment}
                    currentUser={currentUser}
                    isAdmin={isAdmin}
                  />
                ))}
              </div>
            ) : null}
            <div className="reply-input">
              <input
                type="text"
                placeholder="답글 추가..."
                value={replyDraft}
                onChange={(event) =>
                  onReplyDraftChange(comment.id, event.target.value)
                }
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing || event.repeat) {
                    return;
                  }

                  if (event.key === "Enter") {
                    onAddReply(comment.id);
                  }
                }}
              />
              <button
                type="button"
                className="reply-submit"
                onClick={() => onAddReply(comment.id)}
              >
                등록
              </button>
            </div>
          </>
        ) : null}
      </div>
    </article>
  );
}
