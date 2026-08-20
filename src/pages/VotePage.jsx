import { useEffect, useRef, useState, useCallback, useMemo } from "react";
import { useLocation, useParams } from "react-router-dom";
import { X } from "lucide-react";
import "./VotePage.css";
import favoriteIcon from "../assets/favorite.svg";
import reportIcon from "../assets/report.svg";
import commentIcon from "../assets/comment.svg";
import shareIcon from "../assets/share.svg";
import filterIcon from "../assets/filter.svg";
import Comments from "../components/Comments.jsx";
import Report from "../components/Report.jsx";
import { isMainRouteTransition } from "./animations/routeTransitions.js";
import { useActiveVoteCard } from "./vote/useActiveVoteCard.js";
import { useActiveVoteHash } from "./vote/useActiveVoteHash.js";
import { useVotePageScrollSnap } from "./vote/useVotePageScrollSnap.js";
import { getVoteFeedIdFromHash, getVoteHash } from "./vote/voteCards.js";
import { VoteCard } from "./vote/VoteElements.jsx";
import {
  initialActionState,
  updateCardActionState
} from "./vote/voteUtils.js";

import {
  getVote,
  submitVote,
  toggleLike,
  incrementView,
} from "../api/posts.js";
import { useAuth } from "../contexts/AuthContext";

const tags = ["전체", "연예", "음식", "애니메이션", "동물", "스포츠", "일상", "게임", "음악", "영화 / 드라마", "웹툰 / 웹소설", "유튜버 / 스트리머", "밸런스 게임", "밈", "기타"];

const actionButtons = [
  { id: "like", label: "좋아요", icon: favoriteIcon, kind: "toggle" },
  { id: "comment", label: "댓글", icon: commentIcon, kind: "modal" },
  { id: "share", label: "공유", icon: shareIcon, kind: "button" },
  { id: "report", label: "신고", icon: reportIcon, kind: "button" },
  { id: "theme", label: "다크모드", kind: "theme" },
];

function getTargetVoteId(routePostId, search, hash) {
  const searchParams = new URLSearchParams(search);
  const candidates = [routePostId, searchParams.get("post"), searchParams.get("postId"), searchParams.get("vote"), searchParams.get("voteId"), searchParams.get("id"), getVoteFeedIdFromHash(hash)];
  return candidates.find(c => typeof c === "string" && c.trim().length > 0)?.trim() ?? "";
}

function pinTargetCard(cards, targetCardId) {
  if (!targetCardId) return cards;
  const targetIndex = cards.findIndex((card) => card.feedId === targetCardId);
  if (targetIndex < 0) return cards;
  return [cards[targetIndex], ...cards.slice(0, targetIndex), ...cards.slice(targetIndex + 1)];
}

export default function VotePage() {
  const location = useLocation();
  const { postId: routePostId } = useParams();
  const { user: currentUser, isLoggedIn } = useAuth();
  const userId = currentUser?.id || "guest";
  
  const targetVoteId = useMemo(() => getTargetVoteId(routePostId, location.search, location.hash), [routePostId, location.search, location.hash]);
  const entersFromMain = isMainRouteTransition(location.state?.transition);
  
  const [cards, setCards] = useState([]);
  const [isVotesLoading, setIsVotesLoading] = useState(true);
  const [votesError, setVotesError] = useState("");
  const [currentTime, setCurrentTime] = useState(() => Date.now());
  const [selectedVotes, setSelectedVotes] = useState(() => JSON.parse(localStorage.getItem(`selectedVotes_${userId}`) || "{}"));
  const [cardActions, setCardActions] = useState(() => JSON.parse(localStorage.getItem(`cardActions_${userId}`) || "{}"));
  const [copiedCardId, setCopiedCardId] = useState("");
  const [commentCardId, setCommentCardId] = useState("");
  const [reportCardId, setReportCardId] = useState("");
  const [selectedTag, setSelectedTag] = useState("전체");
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem("pickpick_dark_mode") === "true";
  });

  const pageRef = useRef(null);
  const copyTimeoutRef = useRef(null);
  const fetchSequenceRef = useRef(0);
  const { activeCardId, cardRefs, feedRef, registerCardRef } = useActiveVoteCard(cards, targetVoteId);

  // Sync dark mode class
  useEffect(() => {
    localStorage.setItem("pickpick_dark_mode", String(isDarkMode));
    if (isDarkMode) {
      document.body.classList.add("dark-theme");
    } else {
      document.body.classList.remove("dark-theme");
    }
  }, [isDarkMode]);

  // Sync with localStorage
  useEffect(() => {
    setSelectedVotes(JSON.parse(localStorage.getItem(`selectedVotes_${userId}`) || "{}"));
    setCardActions(JSON.parse(localStorage.getItem(`cardActions_${userId}`) || "{}"));
  }, [userId]);

  useEffect(() => {
    localStorage.setItem(`selectedVotes_${userId}`, JSON.stringify(selectedVotes));
  }, [selectedVotes, userId]);

  useEffect(() => {
    localStorage.setItem(`cardActions_${userId}`, JSON.stringify(cardActions));
  }, [cardActions, userId]);

  // Global event listener for like updates
  useEffect(() => {
    const handleLikeUpdated = (e) => {
      const { userId: eventUserId, cardId, liked, likeCount } = e.detail ?? {};
      if (String(eventUserId) !== String(userId) || !cardId) return;

      setCardActions(prev => {
        const state = prev[cardId] ?? initialActionState;
        return { ...prev, [cardId]: { ...state, like: !!liked, likeCount: Number.isFinite(likeCount) ? Math.max(0, likeCount) : state.likeCount } };
      });
    };
    window.addEventListener("vote-like-updated", handleLikeUpdated);
    return () => window.removeEventListener("vote-like-updated", handleLikeUpdated);
  }, [userId]);

  useEffect(() => {
    const id = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (activeCardId) {
      const card = cards.find(c => c.feedId === activeCardId);
      if (card) incrementView(card.id).catch(console.error);
    }
  }, [activeCardId, cards]);

  const fetchVotes = useCallback(async () => {
    const fetchId = ++fetchSequenceRef.current;
    setIsVotesLoading(true);
    setVotesError("");

    try {
      const data = await getVote(null, selectedTag, "random", isLoggedIn ? currentUser?.id : null, null, null, null, targetVoteId || null);
      if (fetchSequenceRef.current !== fetchId) return;

      const serverVotes = {};
      const serverActions = {};
      const savedLocalVotes = JSON.parse(localStorage.getItem(`selectedVotes_${userId}`) || "{}");

      const formattedCards = data.map(item => {
        const cardId = item.id.toString();
        const total = (item.candidate_a_count || 0) + (item.candidate_b_count || 0);
        if (item.user_voted_side) serverVotes[cardId] = item.user_voted_side.toLowerCase();
        serverActions[cardId] = { like: !!item.user_liked, likeCount: item.like_count || 0 };

        const isUserVoted = Boolean(item.user_voted_side || savedLocalVotes[cardId]);
        const isExp = item.expires_at ? new Date(item.expires_at) <= new Date() : false;

        return {
          id: cardId, feedId: cardId, title: item.title, expiresAt: item.expires_at,
          isExpired: isExp,
          isVoted: isUserVoted,
          leftCandidate: { id: "a", name: item.candidate_a_name, image: item.candidate_a_image, type: item.candidate_a_type || "image", tone: "light" },
          rightCandidate: { id: "b", name: item.candidate_b_name, image: item.candidate_b_image, type: item.candidate_b_type || "image", tone: "dark" },
          shares: { 
            left: total === 0 ? 50 : Math.round((item.candidate_a_count / total) * 100),
            right: total === 0 ? 50 : Math.round((item.candidate_b_count / total) * 100)
          }
        };
      });

      // 1. 기간 남은 투표 -> 2. 무기한 투표 -> 3. 마감된 투표 -> 4. 이미 투표한 것 순 정렬
      const getCardPriority = (c) => {
        const isExp = c.expiresAt ? new Date(c.expiresAt) <= new Date() : false;
        const hasDeadline = Boolean(c.expiresAt);

        if (!c.isVoted) {
          if (hasDeadline && !isExp) return 0; // 1. 기간 남은 투표
          if (!hasDeadline) return 1;          // 2. 무기한 투표
          return 2;                            // 3. 마감된 투표
        } else {
          // 4. 이미 참여한 투표
          if (hasDeadline && !isExp) return 10;
          if (!hasDeadline) return 11;
          return 12;
        }
      };

      const sorted = formattedCards.sort((a, b) => {
        const pA = getCardPriority(a);
        const pB = getCardPriority(b);
        return pA - pB;
      });

      setSelectedVotes(prev => ({ ...prev, ...serverVotes }));
      setCardActions(prev => ({ ...prev, ...serverActions }));
      setCards(pinTargetCard(sorted, targetVoteId));
    } catch {
      if (fetchSequenceRef.current === fetchId) {
        setCards([]);
        setVotesError("투표 목록을 불러오지 못했습니다.");
      }
    } finally {
      if (fetchSequenceRef.current === fetchId) setIsVotesLoading(false);
    }
  }, [selectedTag, isLoggedIn, currentUser?.id, targetVoteId, userId]);

  useEffect(() => { fetchVotes(); }, [fetchVotes]);

  // Handle comment modal auto-close on scroll
  useEffect(() => {
    if (!commentCardId || !feedRef.current) return;
    const feed = feedRef.current;
    let canClose = false;
    const frameId = requestAnimationFrame(() => { canClose = true; });
    const handleScroll = () => { if (canClose) setCommentCardId(""); };
    feed.addEventListener("scroll", handleScroll, { passive: true });
    return () => { cancelAnimationFrame(frameId); feed.removeEventListener("scroll", handleScroll); };
  }, [commentCardId, feedRef]);

  useVotePageScrollSnap({ pageRef, feedRef, activeCardId, cardRefs, targetCardId: targetVoteId });
  useActiveVoteHash(activeCardId, location);

  const handleVote = useCallback(async (cardId, candidateId) => {
    // Already voted? Check current state.
    if (selectedVotes[cardId]) return;
    
    const card = cards.find(c => c.feedId === cardId);
    if (!card) return;

    // 비회원인 경우: DB 투표는 하지 않지만 로컬에서 결과(게이지/퍼센트)를 바로 확인할 수 있도록 허용
    if (userId === "guest" || !isLoggedIn) {
      setSelectedVotes(prev => ({ ...prev, [cardId]: candidateId }));
      return;
    }

    // 1. Optimistic Update (로그인 회원)
    setSelectedVotes(prev => ({ ...prev, [cardId]: candidateId }));

    try {
      const res = await submitVote(card.id, userId, candidateId.toUpperCase());
      if (res.success) {
        // 2. Sync with real data from server
        const total = res.counts.candidate_a_count + res.counts.candidate_b_count;
        setCards(prev => prev.map(c => c.feedId === cardId ? { ...c, isVoted: true, shares: { 
          left: total === 0 ? 50 : Math.round((res.counts.candidate_a_count / total) * 100),
          right: total === 0 ? 50 : Math.round((res.counts.candidate_b_count / total) * 100)
        }} : c));
      } else {
        throw new Error("Vote failed");
      }
    } catch (err) {
      // 3. Revert on failure
      setSelectedVotes(prev => {
        const next = { ...prev };
        delete next[cardId];
        return next;
      });
      alert(err.response?.data?.message || "투표 처리에 실패했습니다.");
    }
  }, [userId, isLoggedIn, cards, selectedVotes]);

  const handleToggleAction = useCallback(async (cardId, actionId) => {
    if (actionId === "theme") {
      setIsDarkMode(prev => !prev);
      return;
    }

    const card = cards.find(c => c.feedId === cardId);
    if (!card) return;

    if (actionId === "like") {
      if (userId === "guest" || !isLoggedIn) return alert("로그인이 필요합니다.");
      
      const currentLiked = !!cardActions[cardId]?.like;
      const nextLiked = !currentLiked;
      
      // Optimistic update for like
      setCardActions(prev => updateCardActionState(prev, cardId, "like", {
        like: nextLiked,
        likeCount: (prev[cardId]?.likeCount || 0) + (nextLiked ? 1 : -1)
      }));

      try {
        const res = await toggleLike(card.id, userId, nextLiked);
        if (res.success) {
          setCardActions(prev => updateCardActionState(prev, cardId, "like", {
            like: !!res.liked,
            likeCount: Number(res?.like_count ?? res?.likes ?? (prev[cardId]?.likeCount))
          }));
        }
      } catch {
        // Revert on failure
        setCardActions(prev => updateCardActionState(prev, cardId, "like", {
          like: currentLiked,
          likeCount: (prev[cardId]?.likeCount || 0) + (currentLiked ? 1 : -1)
        }));
        alert("좋아요 처리에 실패했습니다."); 
      }
    } else if (actionId === "report") {
      setReportCardId(cardId);
    }
  }, [userId, isLoggedIn, cards, cardActions]);

  const handleShare = useCallback(async (cardId) => {
    const card = cards.find(c => c.feedId === cardId);
    const title = card ? `${card.title} - PICKPICK` : "PICKPICK 투표";
    const shareUrl = `https://pickpick.dev/vote${getVoteHash(cardId)}`;
    const text = card ? `"${card.title}" 밸런스 게임 투표에 참여해보세요!` : "PICKPICK 밸런스 게임 투표에 참여해보세요!";

    if (navigator.share) {
      try {
        await navigator.share({ title, text, url: shareUrl });
        setCopiedCardId(cardId);
        if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
        copyTimeoutRef.current = setTimeout(() => setCopiedCardId(""), 1600);
        return;
      } catch (err) {
        if (err.name === "AbortError") return;
      }
    }

    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(shareUrl);
      } else {
        const textarea = document.createElement("textarea");
        textarea.value = shareUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand("copy");
        document.body.removeChild(textarea);
      }
      setCopiedCardId(cardId);
      if (copyTimeoutRef.current) clearTimeout(copyTimeoutRef.current);
      copyTimeoutRef.current = setTimeout(() => setCopiedCardId(""), 1600);
    } catch {
      setCopiedCardId("");
    }
  }, [cards]);

  const handleOpenComments = useCallback((cardId) => {
    setIsFilterOpen(false);
    setCommentCardId(cardId);
  }, []);

  const handleCloseComments = useCallback(() => {
    setCommentCardId("");
  }, []);

  const handleCloseReport = useCallback(() => {
    setReportCardId("");
  }, []);

  const commentCard = useMemo(() => cards.find(c => c.feedId === commentCardId), [cards, commentCardId]);
  const reportCard = useMemo(() => cards.find(c => c.feedId === reportCardId), [cards, reportCardId]);

  return (
    <div key={userId} ref={pageRef} className={`vote-page${entersFromMain ? " is-entering-from-main" : ""}${commentCardId ? " has-comment-modal" : ""}`}>
      {!isFilterOpen && !commentCardId && !reportCardId && (
        <button type="button" className="vote-action-button vote-filter-toggle" onClick={() => setIsFilterOpen(true)}><img src={filterIcon} alt="" /></button>
      )}

      {isFilterOpen && !commentCardId && !reportCardId && (
        <aside className="vote-filter-panel">
          <header className="vote-filter-header">
            <h2>카테고리</h2>
            <button type="button" className="vote-filter-close" onClick={() => setIsFilterOpen(false)}>
              <X size={22} />
            </button>
          </header>
          <div className="vote-filter-list">
            {tags.map(tag => (
              <button key={tag} type="button" className={`vote-filter-chip${selectedTag === tag ? " is-active" : ""}`} onClick={() => setSelectedTag(tag)}>{tag}</button>
            ))}
          </div>
        </aside>
      )}

      <div className="vote-layout">
        <div ref={feedRef} className="vote-feed">
          {isVotesLoading ? <div className="empty-state">투표 목록을 불러오는 중입니다.</div> :
           votesError ? <div className="empty-state">{votesError}</div> :
           cards.length > 0 ? cards.map(card => (
             <VoteCard
               key={card.feedId} card={card} selectedCandidateId={selectedVotes[card.feedId]}
               onSelect={handleVote} actionState={cardActions[card.feedId]}
               likeCount={cardActions[card.feedId]?.likeCount ?? 0}
               copied={copiedCardId === card.feedId}
               onToggleAction={handleToggleAction} onShare={handleShare}
               onOpenComments={handleOpenComments} isCommentsOpen={commentCardId === card.feedId}
               isActive={activeCardId === card.feedId} currentTime={currentTime}
               registerCardRef={registerCardRef} actionButtons={actionButtons}
               isDarkMode={isDarkMode}
             />
           )) : <div className="empty-state">검색 결과가 없습니다.</div>}
        </div>
      </div>
      {commentCard && (
        <Comments title={commentCard.title} targetCardId={commentCard.feedId} postDbId={commentCard.id} onClose={handleCloseComments} layerClassName="is-vote-page" />
      )}
      {reportCard && (
        <Report title={reportCard.title} targetCardId={reportCard.feedId} onClose={handleCloseReport} userId={userId} />
      )}
    </div>
  );
}
