import React, { useEffect, useState, useCallback } from "react";
import { useLocation } from "react-router-dom";
import "./Result.css";
import styles from "./MyPage.module.css";
import { useAuth } from "../../contexts/AuthContext";
import { getVote } from "../../api/posts";
import Comments from "../../components/Comments.jsx";
import { getCandidateThumbnail } from "../../utils/image";

const Result = () => {
  const [voteResults, setVoteResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [selectedVoteForComments, setSelectedVoteForComments] = useState(null);
  const location = useLocation();
  const { user: currentUser } = useAuth();

  const isHistory = location.pathname.includes("/mypage/history");
  const isLike = location.pathname.includes("/mypage/like");
  const isMyPoll = location.pathname.includes("/mypage/mypoll");
  const isMyPageSub = isHistory || isLike || isMyPoll;

  const userId = currentUser?.id || "guest";

  const fetchResults = useCallback(async () => {
    try {
      let passedUserId = null;
      let onlyVoted = null;
      let onlyLiked = null;
      let authorId = null;

      // Use the stable currentUser from context
      if (isMyPageSub) {
        if (!currentUser) {
          setVoteResults([]);
          setLoading(false);
          return;
        }
        passedUserId = currentUser.id;
        if (isHistory) onlyVoted = true;
        if (isLike) onlyLiked = true;
        if (isMyPoll) authorId = currentUser.id;
      }

      const data = await getVote(
        searchKeyword,
        null,
        null,
        passedUserId,
        onlyVoted,
        onlyLiked,
        authorId,
      );
      setVoteResults(data);
    } catch (error) {
      console.error("결과를 불러오는데 실패했습니다.", error);
    } finally {
      setLoading(false);
    }
  }, [isMyPageSub, isHistory, isLike, isMyPoll, searchKeyword, currentUser]);

  useEffect(() => {
    fetchResults();
  }, [fetchResults, location.pathname]);

  if (loading) {
    return (
      <div
        className="result-container"
        style={{ color: "white", textAlign: "center", padding: "50px" }}
      >
        로딩 중...
      </div>
    );
  }

  const getBreadcrumb = () => {
    if (isHistory) return "마이페이지 〉 투표 히스토리";
    if (isLike) return "마이페이지 〉 좋아요한 투표";
    if (isMyPoll) return "마이페이지 〉 내가 만든 투표";
    return "";
  };

  const handleToggleComments = (vote) => {
    if (selectedVoteForComments?.id === vote.id) {
      setSelectedVoteForComments(null);
    } else {
      setSelectedVoteForComments(vote);
    }
  };

  return (
    <div
      key={userId}
      className={`result-container${selectedVoteForComments ? " has-comment-modal" : ""}`}
    >
      <div className="result-layout">
        {isMyPageSub && (
          <div className={styles.topSearchRow} style={{ marginBottom: "20px" }}>
            <p className={styles.breadcrumb}>{getBreadcrumb()}</p>
          </div>
        )}
        <div className="result-search-section">
          <div className="result-search-bar">
            <input
              type="text"
              placeholder="투표 결과 모아보기"
              value={searchKeyword}
              onChange={(e) => setSearchKeyword(e.target.value)}
            />
            <span className="result-search-icon">🔍</span>
          </div>
        </div>

        <main className="result-card">
          {voteResults.length > 0 ? (
            voteResults.map((vote) => {
              const leftVotes = vote.candidate_a_count || 0;
              const rightVotes = vote.candidate_b_count || 0;
              const total = leftVotes + rightVotes;
              const leftPercent =
                total === 0 ? 50 : Math.round((leftVotes / total) * 100);
              const rightPercent = total === 0 ? 50 : 100 - leftPercent;
              const isLeftWinner = vote.winner_side === 'A' || (vote.winner_side === null && leftVotes > rightVotes);
              const isRightWinner = vote.winner_side === 'B' || (vote.winner_side === null && rightVotes > leftVotes);
              const isExpired = new Date(vote.expires_at) <= new Date();
              const userVotedSide = vote.user_voted_side?.toUpperCase();
              const isLeftPicked = isHistory && userVotedSide === "A";
              const isRightPicked = isHistory && userVotedSide === "B";

              return (
                <div
                  key={vote.id}
                  className={`result-item ${isExpired ? 'is-expired' : ''}`}
                  id={`vote-item-${vote.id}`}
                >
                  <h3 className="result-title">
                    {vote.title}
                    {isExpired && <span className="status-badge">종료</span>}
                  </h3>
                  <div className="result-row">
                    {/* ... (existing candidate elements) */}
                    <div className={`candidate ${isLeftWinner && isExpired ? 'winner' : ''}${isLeftPicked ? ' is-user-pick' : ''}`}>
                      {isLeftWinner && (
                        isExpired ? <div className="win-badge">WIN</div> : <div className="crown">👑</div>
                      )}
                      <div className="img-wrapper">
                        {vote.candidate_a_image ? (
                          <img
                            src={getCandidateThumbnail(vote.candidate_a_image, vote.candidate_a_type)}
                            alt="left"
                          />
                        ) : (
                          <div className="img-placeholder">
                            {vote.candidate_a_name?.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <span className="percent">{leftPercent}%</span>
                      <span className="candidate-name">{vote.candidate_a_name}</span>
                    </div>

                    {/* 중앙 게이지 */}
                    <div className="gauge-track">
                      <div
                        className="gauge-fill left-fill"
                        style={{ width: `${leftPercent}%` }}
                      >
                        <span className="count">{leftVotes} 표</span>
                      </div>
                      <div
                        className="gauge-fill right-fill"
                        style={{ width: `${rightPercent}%` }}
                      >
                        <span className="count">{rightVotes} 표</span>
                      </div>
                    </div>

                    {/* 오른쪽 후보 */}
                    <div className={`candidate ${isRightWinner && isExpired ? 'winner' : ''}${isRightPicked ? ' is-user-pick' : ''}`}>
                      {isRightWinner && (
                        isExpired ? <div className="win-badge">WIN</div> : <div className="crown">👑</div>
                      )}
                      <div className="img-wrapper">
                        {vote.candidate_b_image ? (
                          <img
                            src={getCandidateThumbnail(vote.candidate_b_image, vote.candidate_b_type)}
                            alt="right"
                          />
                        ) : (
                          <div className="img-placeholder">
                            {vote.candidate_b_name?.slice(0, 1)}
                          </div>
                        )}
                      </div>
                      <span className="percent">{rightPercent}%</span>
                      <span className="candidate-name">{vote.candidate_b_name}</span>
                    </div>
                    {/* test */}
                    {/* 댓글 버튼 */}
                    <button
                      className={`icon-btn${selectedVoteForComments?.id === vote.id ? " active" : ""}`}
                      onClick={() => handleToggleComments(vote)}
                    >
                      <span className="material-icons">
                        chat_bubble_outline
                      </span>
                    </button>
                  </div>
                  {/* 남은 시간 표시 */}
                  <div className="remaining-time">
                    {calculateRemainingTime(vote.expires_at)}
                  </div>
                </div>
              );
            })
          ) : (
            <div
              style={{ color: "white", textAlign: "center", padding: "50px" }}
            >
              결과가 없습니다.
            </div>
          )}
        </main>
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

// 남은 시간 계산 함수를 컴포넌트 외부로 이동
const calculateRemainingTime = (expiresAt) => {
  if (!expiresAt) return "정보 없음";
  const now = new Date();
  const expiration = new Date(expiresAt);
  const diff = expiration - now;

  if (diff <= 0) return "만료됨";

  const hours = Math.floor(diff / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  
  if (hours > 0) {
    return `남은 시간: ${hours}시간 ${minutes}분`;
  } else {
    return `남은 시간: ${minutes}분`;
  }
};

export default Result;
