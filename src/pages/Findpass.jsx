import { useState } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../api/instance";
import "./Findpass.css";

export default function FindPassword() {
  const [email, setEmail] = useState("");

  const [isValid, setIsValid] = useState(false);
  const [msg, setMsg] = useState("");
  const [isSuccessMsg, setIsSuccessMsg] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const navigate = useNavigate();

  const checkEmail = (value) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value);
  };

  const handleEmailChange = (e) => {
    const value = e.target.value;
    setEmail(value);
    if (checkEmail(value)) {
      setIsValid(true);
      setIsSuccessMsg(true);
      setMsg("올바른 이메일 형식입니다.");
    } else {
      setIsValid(false);
      setIsSuccessMsg(false);
      setMsg("올바른 이메일 형식이 아닙니다.");
    }
  };

  const handleSendCode = async () => {
    if (!isValid || isSending) return;

    try {
      setIsSending(true);
      await instance.post("/users/send-temp-password", { email });
      setIsSuccessMsg(true);
      setMsg("임시 비밀번호가 발송되었습니다. 이메일을 확인해주세요.");
    } catch (error) {
      setIsSuccessMsg(false);
      setMsg(error.response?.data?.message || "발송 실패");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="findpass-page">
      <div className="findpass-container">
        <div className="findpass-card">
          <h2>비밀번호 찾기</h2>

          <p>
            가입하신 이메일 주소를 입력해 주세요.
            <br />
            임시 비밀번호를 발송해 드립니다.
          </p>
          <input
            type="email"
            placeholder="이메일 주소 입력"
            value={email}
            onChange={handleEmailChange}
          />
          <div className="findpass-buttons">
            <button className="back" onClick={() => navigate(-1)}>
              뒤로 가기
            </button>
            <button
              className={`submit ${isValid ? "active" : ""}`}
              disabled={!isValid || isSending}
              onClick={handleSendCode}
            >
              {isSending ? "발송 중..." : "임시 비밀번호 발급"}
            </button>
          </div>

          <small
            className={isSuccessMsg ? "findpass-success" : "findpass-error"}
          >
            {msg}
          </small>
        </div>
      </div>
    </div>
  );
}
