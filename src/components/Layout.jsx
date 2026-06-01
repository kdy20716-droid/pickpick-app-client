import { Outlet, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import { useHeaderGlow } from "../hooks/useHeaderGlow";
import AppHandler from "./AppHandler";

const Layout = () => {
  const { scaleY, opacity } = useHeaderGlow();
  const location = useLocation();

  const isVotePage =
    location.pathname.startsWith("/vote") ||
    location.pathname.startsWith("/post");

  return (
    <div>
      <AppHandler />
      {/* 화면 전체 배경으로 들어가는 빛 효과 (Header의 z-index에 갇히지 않음) */}
      <Motion.div
        className="background-glow"
        aria-hidden="true"
        style={{ scaleY, opacity, transformOrigin: "top" }}
      />

      {/* 상단 메뉴바 (Header) */}
      <Header />

      {/* 하단 페이지 내용 (MainPage, LoginPage 등이 여기에 렌더링됨) */}
      <main className="site-main">
        <Outlet />
      </main>

      {/* 하단 푸터 (Footer) */}
      {!isVotePage && <Footer />}
    </div>
  );
};

export default Layout;
