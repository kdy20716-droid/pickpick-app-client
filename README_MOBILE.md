# PICKPICK Mobile App Client

이 폴더는 PICKPICK 서비스의 **안드로이드 앱 전용 클라이언트**입니다.

## 📱 프로젝트 구조
- `src/`: React 기반의 프론트엔드 소스 코드
- `android/`: Capacitor를 이용한 안드로이드 네이티브 프로젝트
- `public/`: 정적 에셋 (아이콘, 매니페스트 등)

## 🔗 서버 연결 (API)
현재 `src/api/instance.js`에서 다음 운영 서버와 연결되도록 설정되어 있습니다:
- **Base URL**: `https://dolphin-app-onqn2.ondigitalocean.app/`

## 🚀 시작하기
1. 의존성 설치: `npm install`
2. 개발 모드: `npm run dev`
3. 안드로이드 빌드:
   - `npm run build`
   - `npx cap sync`
   - 안드로이드 스튜디오에서 `android` 폴더 열기

## 🧹 정리 완료
- 불필요한 서버 복사본 제거 완료
- Unity(capstone) 등 앱과 무관한 파일 제거 완료
- 독립적인 모바일 클라이언트로 구성 완료
