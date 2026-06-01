import React from "react";
import "./PolicyPage.css";

const About = () => {
  return (
    <div className="policy-page">
      <h1>서비스 소개 (About PICKPICK)</h1>
      
      <section>
        <h2>당신의 선택이 가치가 되는 곳, PICKPICK</h2>
        <p>
          PICKPICK은 일상의 소소한 고민부터 심도 있는 주제까지, 사람들의 다양한 의견을 투표를 통해 확인하고 소통하는 양자택일 투표 플랫폼입니다. 
          우리는 복잡한 세상 속에서 결정을 내리기 어려운 순간, 타인의 지혜를 빌리고 서로의 취향을 공유하며 즐거움을 찾는 공간을 지향합니다.
        </p>
      </section>

      <section>
        <h2>PICKPICK의 핵심 기능</h2>
        <ul>
          <li><strong>누구나 쉬운 투표 생성:</strong> 두 가지 선택지만 있다면 누구나 1분 안에 투표를 만들 수 있습니다. 이미지와 텍스트를 활용해 더욱 풍성한 투표를 구성해 보세요.</li>
          <li><strong>실시간 투표 결과:</strong> 투표 참여 즉시 업데이트되는 통계를 통해 실시간 여론과 선호도를 확인할 수 있습니다.</li>
          <li><strong>랭킹 시스템:</strong> 인기 있는 투표와 활발하게 활동하는 유저들을 랭킹을 통해 확인하고, 커뮤니티의 트렌드를 파악해 보세요.</li>
          <li><strong>댓글을 통한 소통:</strong> 투표 결과에 대해 자유롭게 의견을 나누고, 자신의 선택 이유를 설명하며 다른 유저와 교류할 수 있습니다.</li>
        </ul>
      </section>

      <section>
        <h2>우리의 비전</h2>
        <p>
          PICKPICK은 단순한 투표 서비스를 넘어, 대중의 집단지성이 발현되는 건강한 데이터 플랫폼을 꿈꿉니다. 
          유저들이 생성하는 수많은 투표 데이터는 현재 우리 사회의 관심사와 트렌드를 가장 직관적으로 보여주는 지표가 될 것입니다.
          우리는 데이터의 가치를 소중히 여기며, 유저들이 투표하고 참여하는 모든 활동이 의미 있는 정보로 남을 수 있도록 최선을 다하겠습니다.
        </p>
      </section>

      <section>
        <h2>PICKPICK과 함께하세요</h2>
        <p>
          오늘 당신의 고민을 PICKPICK에 올려보세요. 수많은 '픽커(Picker)'들이 당신의 결정을 도와줄 준비가 되어 있습니다. 
          때로는 가벼운 재미로, 때로는 진지한 조언으로 소통하며 새로운 투표 문화를 만들어가요!
        </p>
      </section>

      <div className="contact-info">
        <p>서비스 관련 제안이나 비즈니스 문의는 언제든 환영합니다.</p>
        <p>Email: support@pickpick.dev</p>
      </div>
    </div>
  );
};

export default About;
