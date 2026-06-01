import axios from "axios";

const instance = axios.create({
  // 개발 환경(localhost)일 경우 로컬 서버(4000포트)를 사용하고, 아닐 경우 배포 서버 사용
  // http://localhost:4000"
  baseURL: "https://dolphin-app-onqn2.ondigitalocean.app/",
});

// 인터셉터 (interceptor) : 요청 / 응답시 중간에 가로채는 함수
instance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    // 토큰이 있다면 요청시 헤더에 토큰을 붙여서 보냄
    // Authorization : Bearer 토큰은 JWT 인증의 표준 형식
    config.headers.Authorization = `Bearer ${token}`;
  }
  // 수정된 config를 반환해야 요청시 전송됨
  return config;
});

export default instance;
// 수정1
