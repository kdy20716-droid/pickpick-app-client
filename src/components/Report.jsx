import React, { useState } from "react";
import { createPortal } from "react-dom";
import "./Report.css";
import instance from "../api/instance";

const REPORT_REASONS = [
  "부적절한 제목 또는 선택지",
  "스팸 또는 광고성 콘텐츠",
  "증오심 표현 또는 괴롭힘",
  "권리 침해 (저작권 등)",
  "성적인 콘텐츠",
  "기타 사유",
];

export default function Report({ title, targetCardId, onClose, userId }) {
  const [selectedReason, setSelectedReason] = useState("");
  const [otherReason, setOtherReason] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!selectedReason) {
      alert("신고 사유를 선택해주세요.");
      return;
    }

    const finalReason =
      selectedReason === "기타 사유" ? otherReason : selectedReason;
    if (selectedReason === "기타 사유" && !otherReason.trim()) {
      alert("상세 사유를 입력해주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      await instance.post("/reports", {
        postId: targetCardId,
        userId: userId !== "guest" ? userId : null,
        reason: finalReason,
      });

      alert("신고가 정상적으로 접수되었습니다. 검토 후 조치하겠습니다.");
      onClose();
    } catch (error) {
      console.error("신고 제출 실패:", error);
      alert(
        error.response?.data?.message ||
          "신고 접수에 실패했습니다. 다시 시도해주세요.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <div className="report-modal-layer">
      <button
        type="button"
        className="report-modal-backdrop"
        aria-label="신고창 닫기"
        onClick={onClose}
      />
      <aside className="report-modal">
        <div className="report-content">
          <p className="report-guide">신고 사유를 선택해 주세요.</p>
          <div className="report-reasons">
            {REPORT_REASONS.map((reason) => (
              <label key={reason} className="report-reason-item">
                <input
                  type="radio"
                  name="reportReason"
                  value={reason}
                  checked={selectedReason === reason}
                  onChange={(e) => setSelectedReason(e.target.value)}
                />
                <span>{reason}</span>
              </label>
            ))}
          </div>

          {selectedReason === "기타 사유" && (
            <textarea
              className="report-other-input"
              placeholder="상세 사유를 입력해주세요."
              value={otherReason}
              onChange={(e) => setOtherReason(e.target.value)}
            />
          )}
        </div>

        <footer className="report-footer">
          <button type="button" className="report-cancel-btn" onClick={onClose}>
            취소
          </button>
          <button
            type="button"
            className="report-submit-btn"
            onClick={handleSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? "처리 중..." : "신고 완료"}
          </button>
        </footer>
      </aside>
    </div>,
    document.body,
  );
}
