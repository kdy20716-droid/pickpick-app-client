import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { signin, sendEmailCode, verifyEmailCode } from "../api/users";
import { Eye, EyeOff } from "lucide-react";
import "./Signin.css";

export default function Signin() {
  const navigate = useNavigate();
  // ✅ 1️⃣ 입력값 상태 관리
  const [form, setForm] = useState({
    id: "",
    pw: "",
    email: "",
    name: "",
  });

  // ✅ 4️⃣ 에러 모달 상태
  const [errorMsg, setErrorMsg] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ✅ 5️⃣ 이메일 인증 관련 상태
  const [emailCodeSent, setEmailCodeSent] = useState(false);
  const [verificationInput, setVerificationInput] = useState("");
  const [isEmailVerified, setIsEmailVerified] = useState(false);

  // 모달 자동 닫기 (3초 후)
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => setShowModal(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  // 입력값 변경
  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  // 이메일 코드 전송
  const handleSendEmailCode = async () => {
    if (!form.email) {
      setErrorMsg("이메일 주소를 먼저 입력해주세요.");
      setShowModal(true);
      return;
    }

    // 간단한 이메일 형식 체크
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(form.email)) {
      setErrorMsg("올바른 이메일 형식이 아닙니다.");
      setShowModal(true);
      return;
    }

    // 도메인 유효성 체크
    const emailParts = form.email.split("@");
    if (
      emailParts.length !== 2 ||
      !emailParts[1] ||
      emailParts[1].split(".").length < 2
    ) {
      setErrorMsg("존재하지 않는 이메일입니다.");
      setShowModal(true);
      return;
    }

    const domain = emailParts[1];
    const domainParts = domain.split(".");

    // 도메인의 마지막 부분(TLD)이 2자 이상이어야 함 (예: .com, .co.kr)
    if (domainParts[domainParts.length - 1].length < 2) {
      setErrorMsg("존재하지 않는 이메일입니다.");
      setShowModal(true);
      return;
    }

    try {
      // 백엔드 API 호출하여 이메일 전송
      await sendEmailCode(form.email);
      setEmailCodeSent(true);

      alert(`인증 코드가 발송되었습니다`);
    } catch (error) {
      // 서버 에러 응답 메시지 우선 사용
      const message =
        error.response?.data?.message || "이메일 발송 중 오류가 발생했습니다.";
      setErrorMsg(message);
      setShowModal(true);
      console.error(error);
    }
  };

  // 이메일 코드 확인
  const handleVerifyEmailCode = async () => {
    try {
      await verifyEmailCode(form.email, verificationInput);
      setIsEmailVerified(true);
      alert("이메일 인증이 완료되었습니다.");
    } catch (error) {
      const message =
        error.response?.data?.message || "인증 코드 확인 중 오류가 발생했습니다.";
      setErrorMsg(message);
      setShowModal(true);
    }
  };

  // 제출
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (form.id.length < 5) {
      setErrorMsg("아이디는 5자 이상 입력하세요.");
      setShowModal(true);
      return;
    }

    if (form.pw.length < 8) {
      setErrorMsg("비밀번호는 8자 이상 입력하세요.");
      setShowModal(true);
      return;
    }

    if (!form.name || form.name.length > 5) {
      setErrorMsg("이름은 1자 이상 5자 이하로 입력해주세요.");
      setShowModal(true);
      return;
    }

    if (!form.email) {
      setErrorMsg("이메일 주소를 입력해주세요.");
      setShowModal(true);
      return;
    }

    if (!isEmailVerified) {
      setErrorMsg("이메일 인증을 완료해주세요.");
      setShowModal(true);
      return;
    }

    try {
      const formData = {
        ...form,
      };
      await signin(formData);
      alert("회원가입이 완료되었습니다!");
      navigate("/login");
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message || "회원가입 중 오류가 발생했습니다.",
      );
    }
  };

  return (
    <div className="container">
      {/* 상단 에러 모달 */}
      {showModal && (
        <div className="error-modal">
          <p>{errorMsg}</p>
        </div>
      )}

      <div className="signup-box">
        <h2>회원 가입</h2>

        {/* 입력 */}
        <div className="input-group">
          <span>👤</span>
          <input
            type="text"
            name="id"
            placeholder="아이디"
            value={form.id}
            onChange={handleChange}
          />
        </div>

        <div className="input-group">
          <span>🔒</span>
          <input
            type={showPassword ? "text" : "password"}
            name="pw"
            placeholder="비밀번호"
            value={form.pw}
            onChange={handleChange}
          />
          <button
            type="button"
            className="password-toggle-btn"
            onClick={() => setShowPassword(!showPassword)}
            aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        <div className="input-group-with-btn">
          <div className="input-group">
            <span>✉️</span>
            <input
              type="email"
              name="email"
              placeholder="이메일 주소"
              value={form.email}
              onChange={handleChange}
              disabled={isEmailVerified}
            />
          </div>
          <button
            type="button"
            className="verify-btn"
            onClick={handleSendEmailCode}
            disabled={isEmailVerified}
          >
            {emailCodeSent ? "재전송" : "코드받기"}
          </button>
        </div>

        {emailCodeSent && !isEmailVerified && (
          <div className="input-group-with-btn animate-fade-in">
            <div className="input-group">
              <span>🔢</span>
              <input
                type="text"
                placeholder="인증코드 6자리"
                value={verificationInput}
                onChange={(e) => setVerificationInput(e.target.value)}
                maxLength={6}
              />
            </div>
            <button
              type="button"
              className="verify-confirm-btn"
              onClick={handleVerifyEmailCode}
            >
              확인
            </button>
          </div>
        )}

        {isEmailVerified && (
          <div className="verified-badge animate-fade-in">
            ✅ 이메일 인증 완료
          </div>
        )}

        <div className="input-group">
          <span>👤</span>
          <input
            type="text"
            name="name"
            placeholder="닉네임 (최대 5글자)"
            value={form.name}
            onChange={handleChange}
            maxLength={5}
          />
        </div>

        <button className="submit-btn" onClick={handleSubmit}>
          회원 가입
        </button>

        {/* 비밀번호 찾기 연결 */}
        <div
          style={{ textAlign: "center", marginTop: "15px", fontSize: "14px" }}
        ></div>
      </div>
    </div>
  );
}
