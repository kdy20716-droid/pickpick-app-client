import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { login as apiLogin, googleLogin as apiGoogleLogin } from "../api/users";
import { useAuth } from "../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ username: "", password: "" });
  const [showModal, setShowModal] = useState(false);
  const [msg, setMsg] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const data = await apiLogin({
        username: form.username.trim(),
        password: form.password,
      });
      // 로그인 성공 시 Context의 login 함수 호출
      login(data.user, data.token);

      setMsg("로그인 성공!");

      // 약간의 지연 후 메인 페이지로 이동
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error(error);
      const errorMsg =
        error.response?.data?.message || "아이디 또는 비밀번호 오류";
      setMsg(errorMsg);
      setShowModal(true); // 에러 발생 시 모달 표시
    }
  };

  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      const data = await apiGoogleLogin(credentialResponse.credential);
      login(data.user, data.token);
      setMsg("구글 로그인 성공!");
      setTimeout(() => {
        navigate("/");
      }, 500);
    } catch (error) {
      console.error(error);
      const errorMsg = error.response?.data?.message || "구글 로그인 실패";
      setMsg(errorMsg);
      setShowModal(true);
    }
  };

  const handleGoogleError = () => {
    setMsg("구글 로그인 중 오류가 발생했습니다.");
    setShowModal(true);
  };

  // 모달 자동 닫기 (선택 사항)
  useEffect(() => {
    if (showModal) {
      const timer = setTimeout(() => {
        setShowModal(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showModal]);

  return (
    <div className="container">
      {/* 상단 모달 (에러 메시지 표시) */}
      {showModal && (
        <div className="error-modal">
          <p>{msg}</p>
        </div>
      )}

      <div className="login-box">
        <h1>PICKPICK</h1>

        <form onSubmit={handleLogin}>
          {/* 아이디 */}
          <div className="input-group">
            <input
              type="text"
              required
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
            />
            <label>아이디 또는 이메일</label>
          </div>

          {/* 비밀번호 */}
          <div className="input-group">
            <input
              type={showPassword ? "text" : "password"}
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
            <label>비밀번호</label>
            <button
              type="button"
              className="password-toggle-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? "비밀번호 숨기기" : "비밀번호 보기"}
            >
              {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
            </button>
          </div>

          {/* 로그인 버튼 */}
          <button type="submit">Login</button>

          {/* 비밀번호 찾기 및 회원가입 */}
          <div className="forgot">
            <Link to="/findpass">비밀번호를 잊으셨습니까?</Link>
            <div className="signup-link">
              <span>계정이 없으신가요? </span>
              <Link to="/signin">회원가입</Link>
            </div>
          </div>
        </form>

        <div className="social-login">
          <div className="divider">
            <span>또는</span>
          </div>
          <GoogleLogin
            onSuccess={handleGoogleSuccess}
            onError={handleGoogleError}
            useOneTap
            theme="outline"
            size="large"
            width="100%"
          />
        </div>
      </div>
    </div>
  );
}
