import { useState, useEffect, useRef } from "react";
import { useLocation, useOutlet } from "react-router-dom";

export const useRouteAnimation = () => {
  const location = useLocation();
  const outlet = useOutlet(); // 현재 경로에 해당하는 컴포넌트 요소
  
  // 현재 화면에 보여줄 요소와 경로 상태
  const [displayOutlet, setDisplayOutlet] = useState(outlet);
  const [transitionStage, setTransitionStage] = useState("enter");
  const [activePath, setActivePath] = useState(location.pathname);
  
  const prevPath = useRef(location.pathname);

  useEffect(() => {
    // 경로가 실제로 바뀌었을 때만 퇴장 애니메이션 시작
    if (location.pathname !== prevPath.current) {
      Promise.resolve().then(() => {
        setTransitionStage("exit");
      });
      // 주의: 이때 displayOutlet은 업데이트하지 않고 "이전 것"을 유지합니다.
    }
    prevPath.current = location.pathname;
  }, [location.pathname]);

  const onTransitionEnd = () => {
    if (transitionStage === "exit") {
      // 퇴장 애니메이션이 끝나면 비로소 새로운 페이지로 교체하고 진입 애니메이션 시작
      setTransitionStage("enter");
      setDisplayOutlet(outlet);
      setActivePath(location.pathname);
    }
  };

  return {
    displayOutlet,
    transitionStage,
    onTransitionEnd,
    activePath
  };
};
