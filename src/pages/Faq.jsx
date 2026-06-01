import React, { useState } from "react";
import "./PolicyPage.css";

const Faq = () => {
  const [openIndex, setOpenIndex] = useState(null);

  const faqData = [
    {
      question: "투표는 어떻게 참여하나요?",
      answer:
        "메인 페이지나 투표 목록에서 마음에 드는 주제를 선택한 후, 원하는 항목을 클릭하여 투표할 수 있습니다. 로그인 후 참여하면 포인트와 등급 혜택을 받을 수 있습니다.",
    },
    {
      question: "나만의 투표를 만들 수 있나요?",
      answer:
        "네! 상단 메뉴의 'CREATE' 버튼을 클릭하여 자신만의 재미있는 투표를 생성할 수 있습니다. 이미지와 함께 매력적인 선택지를 만들어 보세요.",
    },
    {
      question: "한 번 한 투표를 취소하거나 변경할 수 있나요?",
      answer:
        "현재 시스템상 한 번 투표를 완료하면 취소나 변경이 불가능합니다. 신중하게 선택해 주세요!",
    },
    {
      question: "랭킹은 어떻게 산정되나요?",
      answer:
        "랭킹은 투표 참여 횟수, 생성한 투표의 인기 점수, 획득한 포인트 등을 종합하여 실시간으로 업데이트됩니다.",
    },
    {
      question: "포인트와 등급 시스템이 궁금해요.",
      answer:
        "투표 참여, 댓글 작성 등을 통해 포인트를 얻을 수 있으며, 포인트가 쌓이면 브론즈부터 챌린저까지 다양한 등급으로 승급하게 됩니다. 등급에 따라 특별한 프로필 테두리 혜택이 주어집니다.",
    },
    {
      question: "비밀번호를 잊어버렸어요.",
      answer:
        "로그인 페이지의 '비밀번호 찾기' 링크를 통해 가입 시 등록한 이메일로 임시 비밀번호를 발급받거나 재설정할 수 있습니다.",
    },
  ];

  const toggleFaq = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="policy-page">
      <h1>FAQ / 문의하기</h1>
      <p style={{ marginBottom: "40px" }}>
        픽픽은 유저 여러분의 소중한 의견을 귀담아듣고 항상 더 나은 서비스를
        만들기 위해 노력하겠습니다.
      </p>

      <section>
        <h2>FAQ (자주 묻는 질문)</h2>
        <div className="faq-container">
          {faqData.map((item, index) => (
            <div
              key={index}
              className={`faq-item ${openIndex === index ? "active" : ""}`}
            >
              <button
                className="faq-question"
                onClick={() => toggleFaq(index)}
                aria-expanded={openIndex === index}
              >
                <span>{item.question}</span>
                <span className="faq-icon">
                  {openIndex === index ? "−" : "+"}
                </span>
              </button>
              <div className="faq-answer">
                <p>{item.answer}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2>고객 지원</h2>
        <p>
          서비스 이용 장애, 버그 신고, 계정 관련 문의는 고객 지원 팀으로 메일을
          보내주시면 1~2영업일 이내에 답변을 드립니다.
        </p>
        <div className="contact-info">
          <p>
            <strong>Email:</strong> support@pickpick.dev
          </p>
        </div>
      </section>

      <section>
        <h2>비즈니스 및 제휴 문의</h2>
        <p>
          광고 게재, 파트너십 제안 등 비즈니스 관련 문의는 아래 메일로 상세
          내용을 전달해 주세요.
        </p>
        <div className="contact-info">
          <p>
            <strong>Email:</strong>{" "}
            <a
              href="https://mail.google.com/mail/?view=cm&fs=1&to=kdy20716@gmail.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "inherit", textDecoration: "underline" }}
            >
              kdy20716@gmail.com{" "}
            </a>
          </p>
        </div>
      </section>

      <p style={{ marginTop: "40px" }}>
        PICKPICK 서비스를 이용해 주셔서 감사합니다. 서비스 이용 중 궁금한 점이
        있거나 건의 사항, 비즈니스 협업 제안이 있으시면 위의 문의 채널을 통해
        연락해 주세요.
      </p>
    </div>
  );
};

export default Faq;
