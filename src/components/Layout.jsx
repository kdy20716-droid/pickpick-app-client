import { Outlet, useLocation } from "react-router-dom";
import { motion as Motion } from "framer-motion";
import Header from "./Header";
import Footer from "./Footer";
import BottomNav from "./BottomNav";
import { useHeaderGlow } from "../hooks/useHeaderGlow";
import AppHandler from "./AppHandler";

const Layout = () => {
  const { scaleY, opacity } = useHeaderGlow();
  const location = useLocation();

  const hideFooter =
    location.pathname === "/" ||
    location.pathname.startsWith("/vote") ||
    location.pathname.startsWith("/post");

  const hideBottomNav =
    location.pathname.startsWith("/post") ||
    location.pathname === "/login" ||
    location.pathname === "/signin";

  return (
    <div className="mobile-app-root">
      <AppHandler />

      {/* 상단 모바일 앱 헤더 */}
      <Header />

      {/* 헤더 바로 아래 배경 빛 효과 */}
      <Motion.div
        className="background-glow"
        aria-hidden="true"
        style={{ scaleY, opacity, transformOrigin: "top" }}
      />

      {/* 모바일 컨텐츠 영역 */}
      <main className="mobile-app-main">
        <Outlet />
      </main>

      {/* 하단 푸터 */}
      {!hideFooter && <Footer />}

      {/* 하단 네비게이션 탭 바 */}
      {!hideBottomNav && <BottomNav />}
    </div>
  );
};

export default Layout;
