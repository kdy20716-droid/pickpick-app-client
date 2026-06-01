import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import "./Like.css";
import styles from "./MyPage.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { getVote, toggleLike } from "../../api/posts";
import Comments from "../../components/Comments.jsx";
import { getCandidateThumbnail } from "../../utils/image";

// 후보자 썸네일 컴포넌트 (중복 제거)
const CandidateThumbnail = ({ image, type, isPick }) => (
  <div className={`thumb-img${isPick ? " is-user-pick" : ""}`}>
    {image ? (
      <img src={getCandidateThumbnail(image, type)} alt="candidate" />
    ) : (
      <div className="no-img">No Img</div>
    )}
  </div>
);

const Like = () => {
  const [likedVotes, setLikedVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const { user: currentUser } = useAuth();
  const [selectedVoteForComments, setSelectedVoteForComments] = useState(null);
  const navigate = useNavigate();

  // 좋아요 목록 조회
  const fetchLikedVotes = useCallback(async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      const data = await getVote(
        searchKeyword, // keyword
        null,          // category
        null,          // sort
        currentUser.id,// user_id
        null,          // only_voted
        true           // only_liked
      );
      setLikedVotes(data);
    } catch (error) {
      console.error("좋아요 목록을 불러오는데 실패했습니다.", error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, searchKeyword]);

  useEffect(() => {
    fetchLikedVotes();
  }, [fetchLikedVotes]);

  // 좋아요 취소 처리
  const handleUnlike = async (vote) => {
    if (!currentUser) return;

    const postId = vote.id;
    const userId = currentUser.id;

    try {
      const res = await toggleLike(postId, userId, false);
      if (res.success && res.liked === false) {
        // 1. 목록에서 즉시 제거
        setLikedVotes((prev) => prev.filter((v) => v.id !== postId));

        // 2. localStorage 및 전역 상태 동기화
        const cardId = postId.toString();
        const savedActions = localStorage.getItem(`cardActions_${userId}`);
        const actions = savedActions ? JSON.parse(savedActions) : {};
        const previousAction = actions[cardId] ?? {};
        
        // 새로운 좋아요 수 결정
        const nextCount = Number(res?.like_count ?? res?.likes);
        const fallbackCount = Math.max(0, Number(previousAction.likeCount ?? vote.like_count ?? 1) - 1);
        const likeCount = Number.isFinite(nextCount) ? Math.max(0, nextCount) : fallbackCount;

        actions[cardId] = {
          ...previousAction,
          like: false,
          likeCount,
        };
        localStorage.setItem(`cardActions_${userId}`, JSON.stringify(actions));

        // 다른 컴포넌트에 알림
        window.dispatchEvent(
          new CustomEvent("vote-like-updated", {
            detail: { userId, cardId, liked: false, likeCount },
          })
        );
      } else if (res.success) {
        // 예상치 못한 성공 상태일 경우 재조회
        await fetchLikedVotes();
      }
    } catch (error) {
      console.error("좋아요 취소 실패:", error);
      alert("좋아요 취소에 실패했습니다.");
    }
  };

  const handleToggleComments = (vote) => {
    setSelectedVoteForComments((prev) => (prev?.id === vote.id ? null : vote));
  };

  return (
    <div className="like-page-container" key={currentUser?.id}>
      <div className={styles.topSearchRow} style={{ marginBottom: "20px" }}>
        <p className={styles.breadcrumb}>마이페이지 〉 좋아요한 투표</p>
      </div>

      <div className="like-search-section">
        <div className="like-search-bar">
          <input
            type="text"
            placeholder="좋아요한 투표 검색"
            value={searchKeyword}
            onChange={(e) => setSearchKeyword(e.target.value)}
          />
          <span className="like-search-icon">🔍</span>
        </div>
      </div>

      <div className="like-content">
        <p className="description-text">최근 좋아요한 항목부터 순서대로 표시됩니다.</p>

        {loading ? (
          <div className="like-list" style={{ textAlign: "center", color: "#bbb", padding: "60px" }}>
            데이터를 불러오는 중입니다...
          </div>
        ) : (
          <div className="like-list">
            {likedVotes.length > 0 ? (
              likedVotes.map((vote) => (
                <div key={vote.id} className="like-item-row">
                  <div
                    className="like-badge"
                    onClick={() => handleUnlike(vote)}
                    style={{ cursor: "pointer" }}
                    title="좋아요 취소"
                  >
                    <span className="material-icons">favorite</span>
                  </div>

                  <div
                    className="info-card"
                    onClick={() => navigate(`/vote/${vote.id}`)}
                    style={{ cursor: "pointer" }}
                  >
                    <CandidateThumbnail 
                      image={vote.candidate_a_image} 
                      type={vote.candidate_a_type} 
                      isPick={vote.user_voted_side?.toUpperCase() === "A"} 
                    />
                    <h3 className="vote-title">{vote.title}</h3>
                    <CandidateThumbnail 
                      image={vote.candidate_b_image} 
                      type={vote.candidate_b_type} 
                      isPick={vote.user_voted_side?.toUpperCase() === "B"} 
                    />
                  </div>

                  <button
                    className={`comment-icon-btn${selectedVoteForComments?.id === vote.id ? " active" : ""}`}
                    onClick={() => handleToggleComments(vote)}
                  >
                    <span className="material-icons">chat_bubble_outline</span>
                  </button>
                </div>
              ))
            ) : (
              <div style={{ textAlign: "center", color: "#bbb", padding: "60px" }}>
                좋아요한 투표가 없습니다.
              </div>
            )}
          </div>
        )}
      </div>

      {selectedVoteForComments && (
        <Comments
          title={selectedVoteForComments.title}
          targetCardId={`vote-item-${selectedVoteForComments.id}`}
          postDbId={selectedVoteForComments.id}
          onClose={() => setSelectedVoteForComments(null)}
          isCentered={true}
        />
      )}
    </div>
  );
};

export default Like;
