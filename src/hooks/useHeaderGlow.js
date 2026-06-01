import { useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export const useHeaderGlow = () => {
  const scrollVelocity = useMotionValue(0);
  
  useEffect(() => {
    let timeoutId;
    
    const handleWheel = (e) => {
      // 마우스 휠 이벤트 (e.deltaY가 음수면 위로 스크롤, 양수면 아래로 스크롤)
      scrollVelocity.set(e.deltaY * 15); // 속도 증폭
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        scrollVelocity.set(0); // 휠이 멈추면 0으로 복귀
      }, 50);
    };
    
    // 모바일 터치 이벤트 처리
    let lastTouchY = 0;
    const handleTouchStart = (e) => {
      lastTouchY = e.touches[0].clientY;
    };
    const handleTouchMove = (e) => {
      const touchY = e.touches[0].clientY;
      const deltaY = lastTouchY - touchY; // 양수면 아래로, 음수면 위로 스와이프
      scrollVelocity.set(deltaY * 25);
      lastTouchY = touchY;
      
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        scrollVelocity.set(0);
      }, 50);
    };

    window.addEventListener("wheel", handleWheel, { passive: true });
    window.addEventListener("touchstart", handleTouchStart, { passive: true });
    window.addEventListener("touchmove", handleTouchMove, { passive: true });

    return () => {
      window.removeEventListener("wheel", handleWheel);
      window.removeEventListener("touchstart", handleTouchStart);
      window.removeEventListener("touchmove", handleTouchMove);
      clearTimeout(timeoutId);
    };
  }, [scrollVelocity]);

  // 스프링 효과를 더 부드럽고 탄력있게 조정
  const smoothVelocity = useSpring(scrollVelocity, {
    damping: 40,
    stiffness: 200
  });

  // 애니메이션 범위를 적절한 수준으로 재조정 (최대 6배 길이)
  // 스크롤 올릴 때: 빛이 적당히 뻗어나옴
  // 정지 시: 기본 얇은 빛
  // 스크롤 내릴 때: 빛이 숨음
  const scaleY = useTransform(smoothVelocity, [-1500, 0, 1500], [6, 1, 0]);
  const opacity = useTransform(smoothVelocity, [-1500, 0, 1500], [0.6, 0.3, 0]);

  return { scaleY, opacity };
};
