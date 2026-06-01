import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./ranking.css";
import goldMedal from "../assets/1위 메달.png";
import silverMedal from "../assets/2위메달.png";
import bronzeMedal from "../assets/3위 메달.png";
import vsImage from "../assets/vs.png";
import { getRanking } from "../api/posts.js";
import { getVoteHash } from "./vote/voteCards.js";
import { getCandidateThumbnail } from "../utils/image.js";

const API_ORIGIN = "https://dolphin-app-onqn2.ondigitalocean.app";
// "http://localhost:4000";

function Ranking() {
  const [topRankings, setTopRankings] = useState([]);
  const [rankingItems, setRankingItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const rankingRows = Array.from(
    { length: Math.max(3, rankingItems.length) },
    (_, index) =>
      rankingItems[index] ?? {
        id: `placeholder-${index + 4}`,
        title: "랭킹 집계 중 • • •",
        isPlaceholder: true,
      },
  );

  useEffect(() => {
    const fetchRanking = async () => {
      try {
        const data = await getRanking();

        // 데이터 포맷팅
        const formatted = data.map((item) => ({
          id: item.id,
          title: item.title,
          totalVotes: item.total_votes,
          topImage: getCandidateThumbnail(item.candidate_a_image, item.candidate_a_type),
          bottomImage: getCandidateThumbnail(item.candidate_b_image, item.candidate_b_type),
          leftImage: getCandidateThumbnail(item.candidate_a_image, item.candidate_a_type),
          rightImage: getCandidateThumbnail(item.candidate_b_image, item.candidate_b_type),
        }));

        // 1, 2, 3위 분리 (순서: 2위, 1위, 3위로 화면에 배치됨)
        const top3 = [];
        if (formatted.length >= 2)
          top3.push({
            ...formatted[1],
            rankClass: "second",
            medal: silverMedal,
            medalAlt: "silver medal",
            isBig: false,
          });
        if (formatted.length >= 1)
          top3.push({
            ...formatted[0],
            rankClass: "first",
            medal: goldMedal,
            medalAlt: "gold medal",
            isBig: true,
          });
        if (formatted.length >= 3)
          top3.push({
            ...formatted[2],
            rankClass: "third",
            medal: bronzeMedal,
            medalAlt: "bronze medal",
            isBig: false,
          });

        setTopRankings(top3);
        setRankingItems(formatted.slice(3));
      } catch (error) {
        console.error("랭킹을 불러오는데 실패했습니다.", error);
      } finally {
        setLoading(false);
      }
    };

    fetchRanking();
  }, []);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px", color: "white" }}>
        랭킹 로딩 중...
      </div>
    );
  }

  return (
    <>
      <section className="ranking-section">
        <div className="top3">
          {topRankings.map((ranking) => (
            <div key={ranking.id} className={`rank-card ${ranking.rankClass}`}>
              <img
                src={ranking.medal}
                className="medal"
                alt={ranking.medalAlt}
              />

              <Link
                to={`/vote${getVoteHash(ranking.id)}`}
                className={`card ranking-link${ranking.isBig ? " big" : ""}`}
                aria-label={`${ranking.title} 투표하기`}
              >
                {ranking.topImage && (
                  <img
                    src={ranking.topImage}
                    className="img top ranking-card-image"
                    alt="candidate A"
                  />
                )}
                <img src={vsImage} className="vs" alt="vs" />
                {ranking.bottomImage && (
                  <img
                    src={ranking.bottomImage}
                    className="img bottom ranking-card-image"
                    alt="candidate B"
                  />
                )}
              </Link>
              <Link
                to={`/vote${getVoteHash(ranking.id)}`}
                className="vote-title ranking-title-link"
              >
                {ranking.title}
              </Link>
              <div className="ranking-total-votes">
                총 {ranking.totalVotes?.toLocaleString() || 0}표
              </div>
            </div>
          ))}
        </div>

        <div className="ranking-list">
          {rankingRows.map((item, index) => {
            const usePlaceholderImages = item.isPlaceholder;

            return (
              <div
                key={item.id}
                className={`item${item.isPlaceholder ? " placeholder" : ""}`}
              >
                <div className="num">{index + 4}</div>

                {item.isPlaceholder ? (
                  <>
                    <div className="vs-row ranking-placeholder">
                      <div className="ranking-list-image placeholder-image" />
                      <img src={vsImage} className="vs-small" alt="vs" />
                      <div className="ranking-list-image placeholder-image" />
                    </div>

                    <div className="title placeholder-title">{item.title}</div>
                  </>
                ) : (
                  <>
                    <Link
                      to={`/vote${getVoteHash(item.id)}`}
                      className="vs-row ranking-link"
                      aria-label={`${item.title} 투표하기`}
                    >
                      {!usePlaceholderImages && item.leftImage ? (
                        <img
                          src={item.leftImage}
                          className="ranking-list-image"
                          alt="candidate A"
                        />
                      ) : (
                        <div className="ranking-list-image placeholder-image" />
                      )}
                      <img src={vsImage} className="vs-small" alt="vs" />
                      {!usePlaceholderImages && item.rightImage ? (
                        <img
                          src={item.rightImage}
                          className="ranking-list-image"
                          alt="candidate B"
                        />
                      ) : (
                        <div className="ranking-list-image placeholder-image" />
                      )}
                    </Link>

                    <Link
                      to={`/vote${getVoteHash(item.id)}`}
                      className="title ranking-title-link"
                    >
                      {item.title}
                    </Link>

                    <div className="list-total-votes">
                      총 {item.totalVotes?.toLocaleString() || 0}표
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </>
  );
}

export default Ranking;
