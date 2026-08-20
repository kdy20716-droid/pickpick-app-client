import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import CommentItem from "./CommentItem.jsx";
import "./comments.css";
import {
  getComments,
  addComment,
  deleteComment,
  toggleCommentLike,
} from "../api/posts.js";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/image";

const COMMENT_OVERLAY_BREAKPOINT = 950;
const COMMENT_SIDE_BY_SIDE_MARGIN = 24;

function toTimestamp(value) {
  if (!value) {
    return Date.now();
  }

  const timestamp = new Date(value).getTime();
  return Number.isNaN(timestamp) ? Date.now() : timestamp;
}

function normalizeReply(reply) {
  return {
    ...reply,
    id: reply.id,
    name: reply.name ?? reply.author ?? reply.user_name ?? "익명",
    text: reply.text ?? reply.content ?? "",
    createdAt: reply.createdAt ?? toTimestamp(reply.created_at),
    likes: reply.likes ?? 0,
    author_border: reply.author_border ?? null,
    author_image: reply.author_image ?? null,
  };
}

function normalizeComment(comment, reaction = null) {
  const serverDislikes = comment.dislikes ?? 0;

  return {
    ...comment,
    id: comment.id,
    user_id: comment.user_id,
    parent_id: comment.parent_id ?? null,
    name: comment.name ?? comment.author ?? comment.user_name ?? "익명",
    text: comment.text ?? comment.content ?? "",
    createdAt: comment.createdAt ?? toTimestamp(comment.created_at),
    likes: comment.likes ?? 0,
    dislikes: reaction === "dislike" ? serverDislikes + 1 : serverDislikes,
    author_border: comment.author_border ?? null,
    author_image: comment.author_image ?? null,
    reaction,
    replyItems: (comment.replyItems ?? comment.replies ?? []).map(
      normalizeReply,
    ),
  };
}

function buildCommentTree(comments, reactions) {
  const parents = [];
  const parentById = new Map();
  const replies = [];

  comments.forEach((comment) => {
    const normalized = normalizeComment(comment, reactions[comment.id] ?? null);

    if (normalized.parent_id) {
      replies.push(normalized);
      return;
    }

    parents.push(normalized);
    parentById.set(normalized.id, normalized);
  });

  replies.forEach((reply) => {
    const parent = parentById.get(reply.parent_id);
    if (parent) {
      parent.replyItems.push(normalizeReply(reply));
    }
  });

  return parents;
}

export default function Comments({
  title,
  targetCardId,
  onClose,
  postDbId,
  isFixed = false,
  isCentered = false,
  layerClassName = "",
}) {
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [openReplies, setOpenReplies] = useState({});
  const [replyDrafts, setReplyDrafts] = useState({});
  const [openMenuId, setOpenMenuId] = useState(null);
  const [isOverlayMode, setIsOverlayMode] = useState(false);
  const modalRef = useRef(null);

  const { user: currentUser, isAdmin } = useAuth();
  const userId = currentUser?.id || "guest";

  const [commentReactions, setCommentReactions] = useState(() => {
    const saved = localStorage.getItem(`commentReactions_${userId}`);

    try {
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem(
      `commentReactions_${userId}`,
      JSON.stringify(commentReactions),
    );
  }, [commentReactions, userId]);

  useEffect(() => {
    let ignore = false;

    if (!postDbId) {
      Promise.resolve().then(() => {
        if (!ignore) setComments((prev) => (prev.length === 0 ? prev : []));
      });
      return () => {
        ignore = true;
      };
    }

    const fetchComments = async () => {
      try {
        const res = await getComments(postDbId);
        if (!ignore && res.success) {
          setComments(buildCommentTree(res.comments ?? [], commentReactions));
        }
      } catch (error) {
        console.error("댓글을 불러오는데 실패했습니다.", error);
      }
    };

    fetchComments();

    return () => {
      ignore = true;
    };
  }, [postDbId, commentReactions]);

  useLayoutEffect(() => {
    if (isCentered) {
      return undefined;
    }

    const modal = modalRef.current;
    if (!modal) {
      return undefined;
    }

    const page =
      document.querySelector(".vote-page") ||
      document.querySelector(".result-container");
    const compactLayoutQuery = window.matchMedia(
      `(max-width: ${COMMENT_OVERLAY_BREAKPOINT}px)`,
    );
    let frameId = 0;
    let settleTimeoutId = 0;

    const getTargetVoteSheet = () => {
      const targetCard = targetCardId
        ? document.getElementById(targetCardId)
        : null;

      return (
        targetCard?.querySelector(".vote-sheet") ??
        targetCard ??
        document.querySelector(".vote-feed-item.is-active .vote-sheet") ??
        document.querySelector(".vote-sheet") ??
        document.querySelector(".result-layout")
      );
    };

    const syncModalSize = () => {
      const voteSheet = getTargetVoteSheet();
      if (!voteSheet) {
        return;
      }

      const targetCard = targetCardId
        ? document.getElementById(targetCardId)
        : null;
      const actionRail = targetCard?.querySelector(".vote-action-rail");
      let sheetRect = voteSheet.getBoundingClientRect();
      let railRect = actionRail?.getBoundingClientRect();
      const modalWidth = modal.getBoundingClientRect().width;
      const sheetToRailGap = railRect
        ? Math.max(0, railRect.left - sheetRect.right)
        : 24;
      const requiredSideBySideWidth =
        sheetRect.width +
        sheetToRailGap * 2 +
        (railRect ? railRect.width : 0) +
        modalWidth +
        COMMENT_SIDE_BY_SIDE_MARGIN * 2;
      const shouldUseOverlay =
        compactLayoutQuery.matches ||
        window.innerWidth < requiredSideBySideWidth;

      setIsOverlayMode((currentOverlayMode) =>
        currentOverlayMode === shouldUseOverlay
          ? currentOverlayMode
          : shouldUseOverlay,
      );

      if (shouldUseOverlay) {
        page?.style.removeProperty("--vote-comment-group-shift");
      } else {
        page?.style.setProperty("--vote-comment-group-shift", "0px");
      }

      if (!shouldUseOverlay) {
        page?.style.setProperty("--vote-comment-group-shift", "0px");

        sheetRect = voteSheet.getBoundingClientRect();
        if (railRect) railRect = actionRail.getBoundingClientRect();

        const settledGap = railRect
          ? Math.max(0, railRect.left - sheetRect.right)
          : 24;
        const groupWidth =
          sheetRect.width +
          settledGap +
          (railRect ? railRect.width : 0) +
          settledGap +
          modalWidth;
        const centeredGroupLeft = (window.innerWidth - groupWidth) / 2;
        const nextGroupLeft = Math.max(24, centeredGroupLeft);
        const nextShift = isFixed ? 0 : nextGroupLeft - sheetRect.left;
        const nextModalLeft =
          (isFixed ? sheetRect.right : nextGroupLeft + sheetRect.width) +
          settledGap +
          (railRect ? railRect.width : 0) +
          settledGap;

        page?.style.setProperty("--vote-comment-group-shift", `${nextShift}px`);
        modal.style.setProperty("--comment-modal-left", `${nextModalLeft}px`);
        modal.style.setProperty("--comment-modal-right", "auto");
      }

      if (isFixed) {
        modal.style.setProperty("--comment-modal-top", "120px");
        modal.style.setProperty(
          "--comment-modal-height",
          "calc(100vh - 180px)",
        );
      } else {
        modal.style.setProperty("--comment-modal-top", `${sheetRect.top}px`);
        modal.style.setProperty(
          "--comment-modal-height",
          `${sheetRect.height}px`,
        );
      }
    };

    const scheduleSync = () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      frameId = requestAnimationFrame(syncModalSize);
    };

    syncModalSize();
    scheduleSync();

    const targetVoteSheet = getTargetVoteSheet();
    const feed = document.querySelector(".vote-feed") || window;
    const resizeObserver =
      window.ResizeObserver && targetVoteSheet
        ? new ResizeObserver(scheduleSync)
        : null;

    resizeObserver?.observe(targetVoteSheet);
    window.addEventListener("resize", scheduleSync);
    feed?.addEventListener("scroll", scheduleSync, { passive: true });

    return () => {
      if (frameId) {
        cancelAnimationFrame(frameId);
      }

      window.clearTimeout(settleTimeoutId);
      resizeObserver?.disconnect();
      page?.style.removeProperty("--vote-comment-group-shift");
      window.removeEventListener("resize", scheduleSync);
      feed?.removeEventListener("scroll", scheduleSync);
    };
  }, [targetCardId, isFixed, isCentered]);

  const handleAddComment = async () => {
    const text = newComment.trim();

    if (!text || !postDbId) {
      return;
    }

    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await addComment(postDbId, currentUser.id, text);
      if (res.success) {
        setComments((prev) => [normalizeComment(res.comment, null), ...prev]);
        setNewComment("");
      }
    } catch (err) {
      console.error(err);
      alert("댓글 작성에 실패했습니다.");
    }
  };

  const handleToggleReplies = (commentId) => {
    setOpenReplies((currentOpenReplies) => ({
      ...currentOpenReplies,
      [commentId]: !currentOpenReplies[commentId],
    }));
  };

  const handleReplyDraftChange = (commentId, value) => {
    setReplyDrafts((currentReplyDrafts) => ({
      ...currentReplyDrafts,
      [commentId]: value,
    }));
  };

  const handleAddReply = async (parentId) => {
    const text = (replyDrafts[parentId] ?? "").trim();

    if (!text || !postDbId) {
      return;
    }

    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await addComment(postDbId, currentUser.id, text, parentId);
      if (res.success) {
        setComments((currentComments) =>
          currentComments.map((comment) =>
            comment.id === parentId
              ? {
                  ...comment,
                  replyItems: [
                    ...comment.replyItems,
                    normalizeReply(res.comment),
                  ],
                }
              : comment,
          ),
        );
        setReplyDrafts((currentReplyDrafts) => ({
          ...currentReplyDrafts,
          [parentId]: "",
        }));
        setOpenReplies((currentOpenReplies) => ({
          ...currentOpenReplies,
          [parentId]: true,
        }));
      }
    } catch (err) {
      console.error(err);
      alert("답글 작성에 실패했습니다.");
    }
  };

  const handleToggleMenu = (commentId) => {
    setOpenMenuId((currentOpenMenuId) =>
      currentOpenMenuId === commentId ? null : commentId,
    );
  };

  const handleDeleteComment = async (commentId) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await deleteComment(postDbId, commentId, currentUser.id);
      if (res.success) {
        setComments((currentComments) => {
          const newComments = currentComments.filter((comment) => comment.id !== commentId);
          return newComments.map((comment) => ({
            ...comment,
            replyItems: comment.replyItems.filter((reply) => reply.id !== commentId),
          }));
        });
        setOpenMenuId(null);
      }
    } catch (err) {
      console.error(err);
      alert("댓글 삭제에 실패했습니다.");
    }
  };

  const handleLike = async (commentId) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    try {
      const res = await toggleCommentLike(postDbId, commentId, currentUser.id);
      if (!res.success) {
        return;
      }

      setCommentReactions((prev) => ({
        ...prev,
        [commentId]: res.liked ? "like" : null,
      }));

      setComments((current) => {
        const updateItem = (item) => {
          if (item.id !== commentId) return item;
          return {
            ...item,
            reaction: res.liked ? "like" : null,
            likes: res.likes ?? (res.liked ? (item.likes || 0) + 1 : Math.max(0, (item.likes || 0) - 1)),
          };
        };

        return current.map((comment) => {
          if (comment.id === commentId) return updateItem(comment);
          return {
            ...comment,
            replyItems: comment.replyItems.map(updateItem),
          };
        });
      });
    } catch (error) {
      console.error(error);
      alert("좋아요 처리에 실패했습니다.");
    }
  };

  const handleDislike = async (commentId) => {
    if (!currentUser) {
      alert("로그인이 필요합니다.");
      return;
    }

    let targetItem = null;
    for (const c of comments) {
      if (c.id === commentId) {
        targetItem = c;
        break;
      }
      const r = c.replyItems.find((reply) => reply.id === commentId);
      if (r) {
        targetItem = r;
        break;
      }
    }

    if (!targetItem) return;

    const hadLike = targetItem.reaction === "like";
    const hadDislike = targetItem.reaction === "dislike";
    const willDislike = !hadDislike;

    // 1. 좋아요 상태였는데 싫어요를 누른 경우, 서버에서 좋아요를 먼저 취소
    let serverLikes = null;
    if (hadLike && willDislike) {
      try {
        const res = await toggleCommentLike(postDbId, commentId, currentUser.id);
        if (res.success) {
          serverLikes = res.likes;
        }
      } catch (err) {
        console.error(err);
      }
    }

    // 2. 리액션 상태 업데이트
    setCommentReactions((prev) => ({
      ...prev,
      [commentId]: willDislike ? "dislike" : null,
    }));

    // 3. 전체 댓글 목록 상태 업데이트
    setComments((current) => {
      const updateItem = (item) => {
        if (item.id !== commentId) return item;
        return {
          ...item,
          reaction: willDislike ? "dislike" : null,
          likes: serverLikes !== null ? serverLikes : (hadLike ? Math.max(0, (item.likes || 0) - 1) : item.likes),
        };
      };

      return current.map((comment) => {
        if (comment.id === commentId) return updateItem(comment);
        return {
          ...comment,
          replyItems: comment.replyItems.map(updateItem),
        };
      });
    });
  };

  return createPortal(
    <div
      className={`comment-modal-layer${isCentered ? " is-centered" : ""}${
        isOverlayMode ? " is-overlay-mode" : ""
      }${
        layerClassName ? ` ${layerClassName}` : ""
      }`}
      key={userId}
    >
      <button
        type="button"
        className="comment-modal-backdrop"
        aria-label="댓글창 닫기"
        onClick={onClose}
      />
      <aside
        ref={modalRef}
        className="comment-modal"
        aria-label={`${title} 댓글`}
      >
        <header className="comment-modal-header">
          <div>
            <span className="comment-modal-label">댓글</span>
            <h2>{title}</h2>
          </div>
          <button
            type="button"
            className="comment-modal-close"
            onClick={onClose}
          >
            닫기
          </button>
        </header>

        <div className="comment-list">
          {comments.map((comment) => (
            <CommentItem
              key={comment.id}
              comment={comment}
              isOpen={Boolean(openReplies[comment.id])}
              replyDraft={replyDrafts[comment.id] ?? ""}
              openMenuId={openMenuId}
              onLike={handleLike}
              onDislike={handleDislike}
              onToggleReplies={handleToggleReplies}
              onReplyDraftChange={handleReplyDraftChange}
              onAddReply={handleAddReply}
              onToggleMenu={handleToggleMenu}
              onDeleteComment={handleDeleteComment}
              currentUser={currentUser}
              isAdmin={isAdmin}
            />
          ))}
        </div>

        <footer className="comment-input">
          <div className={`comment-avatar comment-avatar-small ${currentUser?.selected_border ? `profile-border-${currentUser.selected_border}` : ""}`} aria-hidden="true">
            {currentUser?.profile_image ? (
              <img
                src={getImageUrl(currentUser.profile_image)}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  borderRadius: "50%",
                  objectFit: "cover",
                }}
              />
            ) : null}
          </div>
          <input
            type="text"
            value={newComment}
            placeholder="댓글 추가..."
            onChange={(event) => setNewComment(event.target.value)}
            onKeyDown={(event) => {
              if (event.nativeEvent.isComposing || event.repeat) {
                return;
              }

              if (event.key === "Enter") {
                handleAddComment();
              }
            }}
          />
          <button
            type="button"
            className="comment-submit"
            onClick={handleAddComment}
          >
            등록
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
