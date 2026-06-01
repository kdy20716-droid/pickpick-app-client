import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { App } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';

const AppHandler = () => {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // 플랫폼 클래스 추가 (CSS 스타일 분기용)
    const platform = Capacitor.getPlatform();
    document.body.classList.add(`platform-${platform}`);

    // 안드로이드 하드웨어 뒤로가기 버튼 처리
    const setupBackButton = async () => {
      if (platform !== 'android') return;

      const listener = await App.addListener('backButton', ({ canGoBack }) => {
        if (location.pathname === '/') {
          // 메인 페이지에서 뒤로가기 시 앱 종료
          App.exitApp();
        } else if (canGoBack) {
          // 이전 히스토리가 있으면 뒤로가기
          window.history.back();
        } else {
          // 히스토리가 없으면 메인으로 이동
          navigate('/', { replace: true });
        }
      });

      return () => {
        listener.remove();
      };
    };

    const cleanup = setupBackButton();
    return () => {
      cleanup.then(removeListener => removeListener && removeListener());
    };
  }, [location.pathname, navigate]);

  return null; // UI는 렌더링하지 않음
};

export default AppHandler;
