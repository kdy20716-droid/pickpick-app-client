import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Menu from "../../components/menu";
import styles from "./MyPage.module.css";
import { useAuth } from "../../contexts/AuthContext";
import instance from "../../api/instance";
import { useRouteAnimation } from "../../hooks/useRouteAnimation";

// 등급 순서 (비교용)
const gradeOrder = [
  "UNRANKED",
  "BRONZE",
  "SILVER",
  "GOLD",
  "PLATINUM",
  "MASTER",
];

const normalizeGrade = (grade) => {
  const normalized = grade?.toUpperCase() || "UNRANKED";
  return normalized === "DIAMOND" ? "MASTER" : normalized;
};

const MyPage = () => {
  const navigate = useNavigate();
  const { user: currentUser, token, logout } = useAuth();
  const [confirmModal, setConfirmModal] = useState(null); // 'logout', 'delete', or null
  const [promotionInfo, setPromotionInfo] = useState(null); // { oldGrade, newGrade } or null
  const [isSupportModalOpen, setIsSupportModalOpen] = useState(false);
  const { displayOutlet, transitionStage, onTransitionEnd, activePath } =
    useRouteAnimation();

  const getGradeEmoji = (grade) => {
    const g = normalizeGrade(grade);
    if (g === "BRONZE") return "🥉";
    if (g === "SILVER") return "🥈";
    if (g === "GOLD") return "🥇";
    if (g === "PLATINUM") return "💎";
    if (g === "MASTER") return "👑";
    return "⚪";
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText("support@pickpick.dev");
    alert("이메일 주소가 복사되었습니다.");
  };

  const openInGmail = () => {
    window.open(
      "https://mail.google.com/mail/?view=cm&fs=1&to=support@pickpick.dev",
      "_blank"
    );
  };

  useEffect(() => {
    if (!token) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/login");
      return;
    }

    // 등업 체크 로직
    if (currentUser) {
      const rawStoredGrade = localStorage.getItem(`prevGrade_${currentUser.id}`);
      const storedGrade = rawStoredGrade ? normalizeGrade(rawStoredGrade) : null;
      const currentGrade = normalizeGrade(currentUser.grade);

      if (storedGrade && storedGrade !== currentGrade) {
        const oldIndex = gradeOrder.indexOf(storedGrade);
        const newIndex = gradeOrder.indexOf(currentGrade);

        // 등급이 상승했을 때만 축하 (UnRanked -> BRONZE 등)
        if (newIndex > oldIndex && oldIndex !== -1) {
          setTimeout(() => {
            setPromotionInfo({
              oldGrade: storedGrade,
              newGrade: currentGrade,
            });
          }, 0);
        }
      }
      // 현재 등급을 저장 (다음 비교를 위해)
      localStorage.setItem(`prevGrade_${currentUser.id}`, currentGrade);
    }
  }, [token, navigate, currentUser]);

  const executeLogout = async () => {
    setConfirmModal(null);
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("서버 로그아웃 처리 중 에러:", error);
    }
  };

  const executeDeleteAccount = async () => {
    if (!currentUser) return;
    setConfirmModal(null);
    try {
      await instance.delete(`/users/account/${currentUser.id}`);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("회원 탈퇴 에러:", error);
      alert(error.response?.data?.message || "회원 탈퇴 처리에 실패했습니다.");
    }
  };

  const handleConfirm = () => {
    if (confirmModal === "logout") {
      executeLogout();
    } else if (confirmModal === "delete") {
      executeDeleteAccount();
    }
  };

  return (
    <div className={styles.wrapper}>
      <nav className={styles.sidebar}>
        <div className={styles.navLinks}>
          <Menu />
        </div>
      </nav>

      <main className={styles.mainContent}>
        <div
          key={activePath}
          className={
            transitionStage === "enter"
              ? styles.animateEnter
              : styles.animateExit
          }
          onAnimationEnd={onTransitionEnd}
          style={{ width: "100%" }}
        >
          {displayOutlet}
        </div>
      </main>

      <button
        type="button"
        className={styles.supportButton}
        onClick={() => setIsSupportModalOpen(true)}
      >
        Support
      </button>

      {isSupportModalOpen && (
        <div
          className={styles.modalOverlay}
          onClick={() => setIsSupportModalOpen(false)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>문의하기</h3>
            <p className={styles.modalText}>
              서비스 이용 중 궁금한 점이나 불편한 사항이 있으신가요? 아래 이메일로
              문의해 주시면 친절하게 답변해 드리겠습니다.
              <br />
              <strong
                style={{
                  color: "#f1a0c0",
                  fontSize: "17px",
                  display: "block",
                  marginTop: "10px",
                }}
              >
                support@pickpick.dev
              </strong>
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={copyEmailToClipboard}
              >
                이메일 복사
              </button>
              <button className={styles.modalConfirmBtn} onClick={openInGmail}>
                Gmail로 보내기
              </button>
            </div>
            <button
              className={styles.modalCloseBtn}
              onClick={() => setIsSupportModalOpen(false)}
            >
              닫기
            </button>
          </div>
        </div>
      )}

      {confirmModal && (
        <div
          className={styles.modalOverlay}
          onClick={() => setConfirmModal(null)}
        >
          <div
            className={styles.modalContent}
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className={styles.modalTitle}>
              {confirmModal === "logout" ? "로그아웃" : "회원 탈퇴"}
            </h3>
            <p className={styles.modalText}>
              {confirmModal === "logout"
                ? "정말로 로그아웃 하시겠습니까?"
                : "정말로 탈퇴하시겠습니까?\n이 작업은 되돌릴 수 없으며 모든 데이터가 삭제됩니다."}
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.modalCancelBtn}
                onClick={() => setConfirmModal(null)}
              >
                취소
              </button>
              <button
                className={
                  confirmModal === "logout"
                    ? styles.modalConfirmBtn
                    : styles.modalDangerBtn
                }
                onClick={handleConfirm}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}

      {promotionInfo && (
        <div
          className={styles.promoOverlay}
          onClick={() => setPromotionInfo(null)}
        >
          <div className={styles.confettiContainer}>
            {[...Array(20)].map((_, i) => (
              <div key={i} className={styles.confetti} />
            ))}
          </div>
          <div
            className={styles.promoContent}
            onClick={(e) => e.stopPropagation()}
          >
            <div className={styles.promoEmoji}>
              {getGradeEmoji(promotionInfo.newGrade)}
            </div>
            <h2 className={styles.promoTitle}>등급 상승 축하드려요!</h2>
            <p className={styles.promoText}>
              <span className={styles.oldGrade}>{promotionInfo.oldGrade}</span>
              <span className={styles.arrow}>→</span>
              <span className={styles.newGrade}>{promotionInfo.newGrade}</span>
            </p>
            <p className={styles.promoSubText}>
              꾸준한 활동으로 다음 등급에도 도전해보세요!
            </p>
            <button
              className={styles.promoBtn}
              onClick={() => setPromotionInfo(null)}
            >
              확인
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPage;
