import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { addVote, updateVote } from "../api/posts";
import { useAuth } from "../contexts/AuthContext";
import { Pencil, Trash2, Maximize, Minus, Plus } from "lucide-react";
import { compressImage } from "../utils/image";
import vsLogo from "../assets/vs-logo.svg";
import "./Create.css";

const DEFAULT_DEADLINE_MINUTES = 24 * 60;
const DEADLINE_OPTIONS = [
  { label: "30분", minutes: 30 }, { label: "1시간", minutes: 60 },
  { label: "2시간", minutes: 2 * 60 }, { label: "4시간", minutes: 4 * 60 },
  { label: "8시간", minutes: 8 * 60 }, { label: "12시간", minutes: 12 * 60 },
  { label: "1일", minutes: 24 * 60 }, { label: "3일", minutes: 3 * 24 * 60 },
  { label: "7일", minutes: 7 * 24 * 60 }, { label: "15일", minutes: 15 * 24 * 60 },
  { label: "30일", minutes: 30 * 24 * 60 },
];

const TAGS = [
  "연예", "음식", "애니메이션", "동물", "스포츠", "일상", "게임", "음악",
  "영화 / 드라마", "웹툰 / 웹소설", "유튜버 / 스트리머", "밸런스 게임", "밈", "기타",
];

const getYouTubeId = (url) => {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=|shorts\/)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
};

// 후보자 박스 컴포넌트 (중복 제거)
const CandidateBox = ({ 
  num, name, preview, mediaType, zoom, setZoom, 
  onFileChange, onPaste, onDrop, onYoutubeInput, onRemove, onEditToggle, showEdit 
}) => {
  const fileInputRef = useRef(null);

  return (
    <div
      className="candidate-box"
      onPaste={(e) => onPaste(e, num)}
      onDragOver={(e) => e.preventDefault()}
      onDrop={(e) => onDrop(e, num)}
      tabIndex="0"
    >
      <input
        type="file"
        ref={fileInputRef}
        style={{ display: "none" }}
        accept="image/*"
        onChange={(e) => onFileChange(e, num)}
      />
      {preview ? (
        <>
          <div className="image-wrapper">
            <img
              src={preview}
              alt={`Preview ${num}`}
              className="candidate-box__img"
              style={{ transform: `scale(${zoom})` }}
            />
            {mediaType === "youtube" && <div className="youtube-badge">YouTube</div>}
          </div>
          <button className="image-edit-trigger" onClick={() => onEditToggle(num)}>
            <Pencil size={18} />
          </button>
          {showEdit && (
            <div className="image-edit-overlay">
              <div className="edit-controls">
                <button onClick={() => fileInputRef.current.click()} title="이미지 교체">
                  <Maximize size={16} /> <span>이미지</span>
                </button>
                <button onClick={() => onRemove(num)} title="삭제">
                  <Trash2 size={16} /> <span>삭제</span>
                </button>
              </div>
              <div className="zoom-control">
                <Minus size={14} onClick={() => setZoom(num, Math.max(0.5, zoom - 0.1))} />
                <input
                  type="range" min="0.5" max="3" step="0.1" value={zoom}
                  onChange={(e) => setZoom(num, parseFloat(e.target.value))}
                />
                <Plus size={14} onClick={() => setZoom(num, Math.min(3, zoom + 0.1))} />
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="candidate-box__upload">
          <div className="upload-buttons">
            <button className="upload-button" onClick={() => fileInputRef.current.click()}>
              이미지 삽입
            </button>
          </div>
          <div className="youtube-input-group">
            <input 
              type="text" placeholder="유튜브 링크 붙여넣기"
              onChange={(e) => onYoutubeInput(e.target.value, num)}
              className="youtube-url-input"
            />
          </div>
          <p style={{ fontSize: "11px", color: "#f589b4", marginTop: "8px", textAlign: "center" }}>
            * 이미지 드래그/붙여넣기 지원<br/>
            * 유튜브 링크 입력 시 영상 자동 연결
          </p>
        </div>
      )}
      <div className="candidate-box__label">{name || "후보군 이름"}</div>
    </div>
  );
};

const Create = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user: currentUser, token } = useAuth();
  
  const editData = location.state?.editData || null;
  const isEditing = !!editData;

  const [title, setTitle] = useState("");
  const [selectedTag, setSelectedTag] = useState("영화 / 드라마");
  const [deadlineMinutes, setDeadlineMinutes] = useState(DEFAULT_DEADLINE_MINUTES);
  const [isDeadlineUnlimited, setIsDeadlineUnlimited] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 후보자 상태 통합
  const [candidates, setCandidates] = useState({
    1: { name: "", preview: null, file: null, mediaType: "image", youtubeUrl: "", zoom: 1, showEdit: false },
    2: { name: "", preview: null, file: null, mediaType: "image", youtubeUrl: "", zoom: 1, showEdit: false }
  });

  useEffect(() => {
    if (!token) {
      alert("로그인이 필요한 페이지입니다.");
      navigate("/login");
    }
  }, [token, navigate]);

  useEffect(() => {
    if (isEditing) {
      setTitle(editData.title);
      setSelectedTag(editData.category || "기타");
      setIsDeadlineUnlimited(!editData.expires_at);
      
      const type1 = editData.candidate_a_type || "image";
      const type2 = editData.candidate_b_type || "image";
      
      setCandidates({
        1: { 
          name: editData.candidate_a_name, preview: editData.candidate_a_image, file: null, 
          mediaType: (type1 === "video" || type1 === "audio" ? "youtube" : type1),
          youtubeUrl: type1 === "youtube" ? editData.candidate_a_image : "", zoom: 1, showEdit: false 
        },
        2: { 
          name: editData.candidate_b_name, preview: editData.candidate_b_image, file: null, 
          mediaType: (type2 === "video" || type2 === "audio" ? "youtube" : type2),
          youtubeUrl: type2 === "youtube" ? editData.candidate_b_image : "", zoom: 1, showEdit: false 
        }
      });
    }
  }, [isEditing, editData]);

  const updateCandidate = (num, updates) => {
    setCandidates(prev => ({
      ...prev,
      [num]: { ...prev[num], ...updates }
    }));
  };

  const processAndSetFile = async (num, file) => {
    if (!file) return;
    try {
      // 클라이언트 측 압축 적용 (용량 감소 -> 전송 속도 향상)
      const compressedBlob = await compressImage(file, 1200, 1200, 0.7);
      const compressedFile = new File([compressedBlob], file.name, { type: "image/jpeg" });
      
      const reader = new FileReader();
      reader.onloadend = () => {
        updateCandidate(num, { preview: reader.result, file: compressedFile, mediaType: "image", zoom: 1 });
      };
      reader.readAsDataURL(compressedFile);
    } catch (err) {
      console.error("이미지 압축 실패:", err);
      // 실패 시 원본 사용
      const reader = new FileReader();
      reader.onloadend = () => updateCandidate(num, { preview: reader.result, file, mediaType: "image", zoom: 1 });
      reader.readAsDataURL(file);
    }
  };

  const handleFileChange = (e, num) => {
    const file = e.target.files[0];
    if (file) processAndSetFile(num, file);
  };

  const handlePaste = (e, num) => {
    const text = e.clipboardData.getData("text");
    const youtubeId = getYouTubeId(text);

    if (youtubeId) {
      updateCandidate(num, { 
        mediaType: "youtube", preview: `https://img.youtube.com/vi/${youtubeId}/0.jpg`, 
        file: null, youtubeUrl: youtubeId, zoom: 1 
      });
      return;
    }

    const item = Array.from(e.clipboardData.items).find(i => i.kind === "file");
    if (item) processAndSetFile(num, item.getAsFile());
  };

  const handleDrop = (e, num) => {
    e.preventDefault();
    if (e.dataTransfer.files?.length > 0) processAndSetFile(num, e.dataTransfer.files[0]);
  };

  const handleYoutubeInput = (url, num) => {
    const youtubeId = getYouTubeId(url);
    if (youtubeId) {
      updateCandidate(num, { 
        mediaType: "youtube", preview: `https://img.youtube.com/vi/${youtubeId}/0.jpg`, 
        file: null, youtubeUrl: youtubeId, zoom: 1 
      });
    }
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    if (!title.trim() || !candidates[1].name.trim() || !candidates[2].name.trim()) {
      alert("필수 항목을 모두 입력해주세요."); return;
    }
    if (!currentUser?.id) { alert("로그인이 필요합니다."); navigate("/login"); return; }

    setIsSubmitting(true);
    const expiresAt = isDeadlineUnlimited ? null : new Date(Date.now() + deadlineMinutes * 60 * 1000).toISOString();

    try {
      const f1 = candidates[1].mediaType === "youtube" ? candidates[1].youtubeUrl : candidates[1].file;
      const f2 = candidates[2].mediaType === "youtube" ? candidates[2].youtubeUrl : candidates[2].file;

      const payload = [
        currentUser.id, selectedTag, title,
        candidates[1].name, f1, candidates[2].name, f2,
        candidates[1].mediaType, candidates[2].mediaType,
        expiresAt, isDeadlineUnlimited
      ];

      if (isEditing) await updateVote(editData.id, ...payload);
      else await addVote(...payload);
      
      alert(`투표가 성공적으로 ${isEditing ? "수정" : "등록"}되었습니다!`);
      navigate("/vote");
    } catch (error) {
      console.error("처리 에러:", error);
      alert(`${isEditing ? "수정" : "등록"}에 실패했습니다.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="create-page-container">
      <main className="main-content">
        <section className="editor-card preview-section">
          <input
            type="text" className="editor-card__title-input" placeholder="제목을 입력하세요"
            value={title} onChange={(e) => setTitle(e.target.value)}
          />

          <div className="vs-container">
            {[1, 2].map(num => (
              <React.Fragment key={num}>
                <CandidateBox 
                  num={num} name={candidates[num].name} preview={candidates[num].preview}
                  mediaType={candidates[num].mediaType} zoom={candidates[num].zoom}
                  showEdit={candidates[num].showEdit}
                  setZoom={(n, z) => updateCandidate(n, { zoom: z })}
                  onFileChange={handleFileChange} onPaste={handlePaste}
                  onDrop={handleDrop} onYoutubeInput={handleYoutubeInput}
                  onEditToggle={(n) => updateCandidate(n, { showEdit: !candidates[n].showEdit })}
                  onRemove={(n) => updateCandidate(n, { preview: null, file: null, zoom: 1, mediaType: "image", youtubeUrl: "", showEdit: false })}
                />
                {num === 1 && <div className="vs-badge"><img src={vsLogo} alt="VS" /></div>}
              </React.Fragment>
            ))}
          </div>
        </section>

        <section className="editor-card settings-section">
          <div className="settings-group">
            <h3 className="settings-group__title">후보군 이름</h3>
            <div className="settings-group__list">
              {[1, 2].map(num => (
                <div key={num} className="list-item">
                  <span className="list-item__num">{num}</span>
                  <input
                    type="text" className="candidate-name-input" placeholder="이름을 입력하세요"
                    value={candidates[num].name} onChange={(e) => updateCandidate(num, { name: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div className="settings-group">
            <h3 className="settings-group__title">TAG</h3>
            <div className="tag-cloud">
              {TAGS.map(tag => (
                <button
                  key={tag} className={`tag-button ${selectedTag === tag ? "tag-button--active" : ""}`}
                  onClick={() => setSelectedTag(tag)}
                >{tag}</button>
              ))}
            </div>
          </div>

          <div className="settings-group deadline-settings-group">
            <h3 className="settings-group__title">마감시간</h3>
            <select
              className="deadline-select" value={deadlineMinutes}
              onChange={(e) => { setIsDeadlineUnlimited(false); setDeadlineMinutes(Number(e.target.value)); }}
            >
              {DEADLINE_OPTIONS.map(opt => <option key={opt.minutes} value={opt.minutes}>{opt.label}</option>)}
            </select>
            <button
              type="button" className={`deadline-unlimited-button${isDeadlineUnlimited ? " deadline-unlimited-button--active" : ""}`}
              onClick={() => { setIsDeadlineUnlimited(true); alert("무기한 선택 시 랭킹 진입은 불가합니다."); }}
            >무기한</button>
          </div>

          <button
            className="fab-button" onClick={handleSubmit}
            disabled={isSubmitting || !candidates[1].name.trim() || !candidates[2].name.trim()}
          ><span>{isEditing ? "Update" : "Upload"}</span></button>
        </section>
      </main>
    </div>
  );
};

export default Create;
