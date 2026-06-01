import { Link } from "react-router-dom";
import { useRef, useState, useEffect } from "react";
import "./MainPage.css";
import vsLogo from "../assets/vs-logo.svg";
import { useMainPageAnimations } from "../hooks/useMainPageAnimations.js";
import { useScrollToVote } from "./animations/useScrollToVote.js";
import { mainRouteTransitions } from "./animations/routeTransitions.js";
import { getMainFeaturedVote } from "../api/main.js";
import { getCandidateThumbnail } from "../utils/image.js";

import { getVoteHash } from "./vote/voteCards.js";

const voteLinkState = { transition: mainRouteTransitions.link };

const copy = {
  navLabel: "주요 메뉴",
  accountLabel: "계정",
  heroLead: "결정하기 어려울 땐",
  heroAccent: "픽픽!",
  heroDescription:
    "가볍게 비교하고 빠르게 골라보세요. 직관적인 투표 한 번으로 오늘의 선택을 완성할 수 있어요.",
  voteLabel: "인기 투표",
  candidateSuffix: " 후보",
  nextVote: "상세 투표 보러가기",
};

export default function MainPage() {
  const pageRef = useRef(null);
  const [featuredVote, setFeaturedVote] = useState(null);
  const [isFeaturedVoteLoading, setIsFeaturedVoteLoading] = useState(true);

  const isLeavingForVote = useScrollToVote();
  useMainPageAnimations(pageRef, isLeavingForVote, featuredVote);

  useEffect(() => {
    const fetchPopularVote = async () => {
      try {
        const item = await getMainFeaturedVote();
        if (item) {
          setFeaturedVote({
            id: item.id,
            title: item.title,
            leftCandidate: {
              name: item.candidate_a_name,
              image: item.candidate_a_image,
              type: item.candidate_a_type,
            },
            rightCandidate: {
              name: item.candidate_b_name,
              image: item.candidate_b_image,
              type: item.candidate_b_type,
            },
          });
        }
      } catch (error) {
        console.error("인기 투표를 불러오는데 실패했습니다.", error);
      } finally {
        setIsFeaturedVoteLoading(false);
      }
    };
    fetchPopularVote();
  }, []);

  const voteLink = featuredVote ? `/vote${getVoteHash(featuredVote.id)}` : "/vote";

  return (
    <div
      ref={pageRef}
      className={`main-page${isLeavingForVote ? " is-leaving-for-vote" : ""}`}
    >
      <main className="page-main">
        <section className="hero">
          <h1>
            {copy.heroLead} <span>{copy.heroAccent}</span>
          </h1>
          <p>{copy.heroDescription}</p>
        </section>

        <section className="vote-section" aria-label={copy.voteLabel}>
          <div className="rank-badge">
            <span className="rank-badge-inner">1st</span>
          </div>

          <article className="vote-card">
            <h2>
              {featuredVote
                ? featuredVote.title
                : isFeaturedVoteLoading
                  ? "로딩 중..."
                  : "등록된 투표가 없습니다."}
            </h2>

            <div className="vote-match">
              {featuredVote && (
                <>
                  <Link
                    to={voteLink}
                    state={voteLinkState}
                    className="candidate-card"
                    aria-label={`${featuredVote.leftCandidate.name}${copy.candidateSuffix}`}
                  >
                    {featuredVote.leftCandidate.image && (
                      <img
                        src={getCandidateThumbnail(featuredVote.leftCandidate.image, featuredVote.leftCandidate.type)}
                        alt={featuredVote.leftCandidate.name}
                      />
                    )}
                    <span className="candidate-name">
                      {featuredVote.leftCandidate.name}
                    </span>
                  </Link>

                  <div className="vs-mark" aria-hidden="true">
                    <img src={vsLogo} alt="" />
                  </div>

                  <Link
                    to={voteLink}
                    state={voteLinkState}
                    className="candidate-card"
                    aria-label={`${featuredVote.rightCandidate.name}${copy.candidateSuffix}`}
                  >
                    {featuredVote.rightCandidate.image && (
                      <img
                        src={getCandidateThumbnail(featuredVote.rightCandidate.image, featuredVote.rightCandidate.type)}
                        alt={featuredVote.rightCandidate.name}
                      />
                    )}
                    <span className="candidate-name">
                      {featuredVote.rightCandidate.name}
                    </span>
                  </Link>
                </>
              )}
            </div>
          </article>
        </section>

        <Link to={voteLink} state={voteLinkState} className="next-vote">
          {copy.nextVote}
        </Link>
      </main>
    </div>
  );
}
