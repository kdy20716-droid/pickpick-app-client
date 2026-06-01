import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./ProfileEditor.module.css";
import { getImageUrl } from "../utils/image";

const createImage = (src) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous"; // CORS 이슈 방지
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const createCenteredSquareBlob = async (imageSrc, zoom) => {
  const img = await createImage(imageSrc);
  const canvas = document.createElement("canvas");
  const outputSize = 512;
  const ctx = canvas.getContext("2d");

  canvas.width = outputSize;
  canvas.height = outputSize;

  // 원본 이미지에서 중앙 정사각형 추출 및 줌 적용
  const naturalSize = Math.min(img.naturalWidth, img.naturalHeight);
  const sourceSize = naturalSize / zoom;
  const sourceX = (img.naturalWidth - sourceSize) / 2;
  const sourceY = (img.naturalHeight - sourceSize) / 2;

  ctx.drawImage(
    img,
    sourceX,
    sourceY,
    sourceSize,
    sourceSize,
    0,
    0,
    outputSize,
    outputSize,
  );

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
  });
};

const ProfileEditor = ({ initialImage, initialBorder, userTier, unlockedBorders, isAdmin, onSave, onCancel }) => {
  const [zoom, setZoom] = useState(1);
  const [selectedBorder, setSelectedBorder] = useState(initialBorder);
  const [previewImage, setPreviewImage] = useState(initialImage);
  const [hasNewImage, setHasNewImage] = useState(false);
  const fileInputRef = useRef(null);

  const borders = [
    { id: null, name: "기본", tier: "unranked" },
    { id: "bronze", name: "브론즈", tier: "bronze" },
    { id: "silver", name: "실버", tier: "silver" },
    { id: "gold", name: "골드", tier: "gold" },
    { id: "platinum", name: "플래티넘", tier: "platinum" },
    { id: "diamond", name: "다이아", tier: "diamond" },
    { id: "master", name: "마스터", tier: "master" },
    { id: "challenger", name: "챌린저", tier: "challenger" },
    { id: "pick", name: "Pick", tier: "master" }, // Added pick border
    { id: "admin", name: "Admin", tier: "admin" }, // Special border
  ];

  const isBorderUnlocked = (borderId, borderTier) => {
    // 1. 관리자면 전부 해금
    if (isAdmin) return true;
    
    // 2. 개별 지급된 테두리 확인
    if (unlockedBorders && unlockedBorders.split(',').includes(borderId)) return true;

    // 3. 티어별 해금 확인
    if (borderTier === "admin") return false; // 어드민 테두리는 티어로 해금 불가
    
    const tiers = ["unranked", "bronze", "silver", "gold", "platinum", "diamond", "master", "challenger"];
    
    // 유저 티어 정규화 (소문자로 변환)
    let normalizedUserTier = (userTier || "unranked").toLowerCase();
    
    // 테두리 티어 정규화
    let normalizedBorderTier = (borderTier || "unranked").toLowerCase();

    const userTierIndex = tiers.indexOf(normalizedUserTier);
    const borderTierIndex = tiers.indexOf(normalizedBorderTier);
    
    return userTierIndex >= borderTierIndex;
  };

  const handleSelectFile = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader();
      reader.onload = () => {
        setPreviewImage(reader.result);
        setHasNewImage(true);
        setZoom(1);
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  const handleSave = async () => {
    let imageBlob = null;
    
    // 새 이미지가 있거나, 줌을 조절한 경우 크롭 시도
    if (hasNewImage || zoom !== 1) {
      try {
        const src = hasNewImage ? previewImage : getImageUrl(previewImage);
        imageBlob = await createCenteredSquareBlob(src, zoom);
      } catch (e) {
        console.error("이미지 크롭 실패:", e);
      }
    }
    onSave(imageBlob, selectedBorder);
  };

  const modalContent = (
    <div className={styles.modalOverlay} onClick={onCancel}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <h3 className={styles.title}>프로필 편집</h3>
        
        <div className={styles.editorMain}>
          {/* 왼쪽: 미리보기 영역 */}
          <div className={styles.previewSection}>
            <div className={styles.avatarWrapper}>
              <div 
                className={`${styles.avatarContainer} ${selectedBorder ? `profile-border-${selectedBorder}` : ""}`}
              >
                <div style={{ width: "100%", height: "100%", borderRadius: "50%", overflow: "hidden" }}>
                  <img
                    src={hasNewImage ? previewImage : getImageUrl(previewImage)}
                    alt="Preview"
                    className={styles.avatarImage}
                    style={{ 
                      transform: `scale(${zoom})`,
                      borderRadius: "50%"
                    }}
                  />
                </div>
              </div>
            </div>
            <button 
              className={styles.changeImgBtn}
              onClick={() => fileInputRef.current.click()}
            >
              사진 변경
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              style={{ display: "none" }} 
              accept="image/*"
              onChange={handleSelectFile}
            />
          </div>

          {/* 오른쪽: 컨트롤 영역 */}
          <div className={styles.controlSection}>
            <div className={styles.controlGroup}>
              <label className={styles.label}>이미지 크기 조절</label>
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.01}
                onChange={(e) => setZoom(Number(e.target.value))}
                className={styles.rangeInput}
              />
            </div>

            <div className={styles.controlGroup}>
              <label className={styles.label}>프로필 테두리</label>
              <div className={styles.borderGrid}>
                {borders
                  .filter((border) => {
                    if (border.id === "admin" || border.id === "pick") {
                      if (isAdmin) return true;
                      if (unlockedBorders && unlockedBorders.split(',').includes(border.id)) return true;
                      return false;
                    }
                    return true;
                  })
                  .map((border) => {
                    const unlocked = isBorderUnlocked(border.id, border.tier);
                    return (
                      <div
                        key={border.id || "none"}
                        className={`${styles.borderItem} ${selectedBorder === border.id ? styles.active : ""} ${!unlocked ? styles.locked : ""}`}
                        onClick={() => unlocked && setSelectedBorder(border.id)}
                      >
                        <div className={`${styles.borderCircle} ${border.id ? `profile-border-${border.id}` : ""}`}>
                        </div>
                        <span className={styles.borderName}>{border.name}</span>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        </div>

        <div className={styles.footer}>
          <button className={styles.cancelBtn} onClick={onCancel}>취소</button>
          <button className={styles.saveBtn} onClick={handleSave}>저장하기</button>
        </div>
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
};

export default ProfileEditor;
