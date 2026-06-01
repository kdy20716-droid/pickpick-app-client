import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import instance from "../api/instance";
import "./Admin.css";

const Admin = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [votes, setVotes] = useState([]);
  const [comments, setComments] = useState([]);
  const [selectedVoteId, setSelectedVoteId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("votes"); // 'votes', 'users', 'reports', or 'bans'
  const [deleteModal, setDeleteModal] = useState(null); // null, 'vote', 'user'
  const [itemToDelete, setItemToDelete] = useState(null);
  const [users, setUsers] = useState([]);
  const [bannedEmails, setBannedEmails] = useState([]);
  const [newBanEmail, setNewBanEmail] = useState("");
  const [reports, setReports] = useState([]);
  const [voteRecords, setVoteRecords] = useState([]);
  const [showVoteDetails, setShowVoteDetails] = useState(false);
  const [selectedVoteTitle, setSelectedVoteTitle] = useState("");

  // 페이지네이션 상태
  const [pagination, setPagination] = useState({
    votes: { current: 1, total: 0, limit: 50 },
    users: { current: 1, total: 0, limit: 50 },
    reports: { current: 1, total: 0, limit: 30 },
    bans: { current: 1, total: 0, limit: 30 }
  });

  // 2차 인증 상태 (로그인 초기 인증용) - 새로고침 시에도 유지되도록 sessionStorage 사용
  const [isVerified, setIsVerified] = useState(() => {
    return sessionStorage.getItem("isAdminVerified") === "true";
  });
  const [serverCode, setServerCode] = useState("");
  const [inputCode, setInputCode] = useState("");
  const [isSendingCode, setIsSendingCode] = useState(false);

  // 유저 삭제 전용 인증 상태
  const [userDeleteStep, setUserDeleteStep] = useState(0); // 0: 초기, 1: 확인됨, 2: 인증코드입력중
  const [deleteVerifyCode, setDeleteVerifyCode] = useState("");
  const [deleteInputCode, setDeleteInputCode] = useState("");

  const userStr = localStorage.getItem("user");
  const currentUser = userStr ? JSON.parse(userStr) : null;
  const token = localStorage.getItem("token");

  // 관리자 권한 확인
  useEffect(() => {
    if (!currentUser || currentUser.role !== "admin") {
      alert("관리자 권한이 필요합니다.");
      navigate("/");
    }
  }, [currentUser, navigate]);

  // 관리자 인증 완료 시 초기 목록 로드
  useEffect(() => {
    if (isVerified) {
      fetchList("votes", 1);
    }
  }, [isVerified]);

  // 인증 코드 발송 (범용)
  const handleSendCode = async (isForUserDelete = false) => {
    setIsSendingCode(true);
    try {
      const response = await instance.post(
        "/admin/send-verification",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (isForUserDelete) {
        setDeleteVerifyCode(response.data.code);
        setUserDeleteStep(2);
      } else {
        setServerCode(response.data.code);
      }
      alert("관리자 이메일로 인증 코드가 발송되었습니다.");
    } catch (error) {
      console.error("인증 코드 발송 에러:", error);
      if (!handleAuthError(error)) {
        alert("인증 코드 발송에 실패했습니다.");
      }
    } finally {
      setIsSendingCode(false);
    }
  };

  // 인증 코드 발송 (로그인용)
  const handleSendVerificationCode = () => handleSendCode(false);

  // 인증 코드 확인 (로그인용)
  const handleVerifyCode = () => {
    if (!serverCode) {
      alert("먼저 인증 코드를 발송해주세요.");
      return;
    }
    if (inputCode === serverCode) {
      setIsVerified(true);
      sessionStorage.setItem("isAdminVerified", "true"); // 세션에 저장
      alert("관리자 인증이 완료되었습니다.");
    } else {
      alert("인증 코드가 일치하지 않습니다.");
    }
  };

  // 공통 목록 로드 함수
  const fetchList = async (tab, page = 1) => {
    setLoading(true);
    try {
      let endpoint = "";
      let limit = 50;
      if (tab === "votes") {
        endpoint = "/admin/votes";
        limit = 50;
      } else if (tab === "users") {
        endpoint = "/admin/users";
        limit = 50;
      } else if (tab === "reports") {
        endpoint = "/admin/reports";
        limit = 30;
      } else if (tab === "bans") {
        endpoint = "/admin/banned-emails";
        limit = 30;
      }

      const response = await instance.get(endpoint, {
        params: { page, limit },
        headers: { Authorization: `Bearer ${token}` },
      });

      if (tab === "votes") setVotes(response.data.votes);
      else if (tab === "users") setUsers(response.data.users);
      else if (tab === "reports") setReports(response.data.reports);
      else if (tab === "bans") setBannedEmails(response.data.bannedEmails);

      setPagination(prev => ({
        ...prev,
        [tab]: { ...prev[tab], current: page, total: response.data.total }
      }));
      setActiveTab(tab);
    } catch (error) {
      console.error(`${tab} 로드 에러:`, error);
      if (!handleAuthError(error)) {
        alert("데이터를 불러오는 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 페이지네이션 컴포넌트
  const Pagination = ({ tab }) => {
    const { current, total, limit } = pagination[tab];
    const totalPages = Math.ceil(total / limit);
    if (totalPages <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPages; i++) {
      pages.push(i);
    }

    return (
      <div className="admin-pagination">
        <button 
          onClick={() => fetchList(tab, current - 1)} 
          disabled={current === 1}
          className="page-nav-btn"
        >
          &lt;
        </button>
        {pages.map(p => (
          <button 
            key={p} 
            onClick={() => fetchList(tab, p)}
            className={`page-btn ${current === p ? 'active' : ''}`}
          >
            {p}
          </button>
        ))}
        <button 
          onClick={() => fetchList(tab, current + 1)} 
          disabled={current === totalPages}
          className="page-nav-btn"
        >
          &gt;
        </button>
      </div>
    );
  };

  // 이메일 차단 추가
  const handleAddBanEmail = async (e) => {
    e.preventDefault();
    if (!newBanEmail.trim()) return alert("이메일을 입력해주세요.");

    setLoading(true);
    try {
      await instance.post(
        "/admin/banned-emails",
        { email: newBanEmail },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("이메일이 차단되었습니다.");
      setNewBanEmail("");
      fetchList("bans", 1); // 1페이지로 새로고침
    } catch (error) {
      console.error("이메일 차단 에러:", error);
      alert("이메일 차단 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // ... (다른 핸들러들 수정) ...

  const handleTabChange = (tab) => {
    fetchList(tab, 1);
  };

  // 이메일 차단 해제
  const handleRemoveBanEmail = async (id) => {
    if (!window.confirm("차단을 해제하시겠습니까?")) return;

    setLoading(true);
    try {
      await instance.delete(`/admin/banned-emails/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("차단이 해제되었습니다.");
      setBannedEmails(bannedEmails.filter((b) => b.id !== id));
    } catch (error) {
      console.error("차단 해제 에러:", error);
      alert("차단 해제 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 401 에러 공통 처리 함수
  const handleAuthError = (error) => {
    if (error.response && error.response.status === 401) {
      alert("세션이 만료되었거나 권한이 없습니다. 다시 로그인해주세요.");
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      navigate("/login");
      return true;
    }
    return false;
  };

  // 투표 검색
  const handleSearchVotes = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      alert("검색어를 입력해주세요.");
      return;
    }

    setLoading(true);
    try {
      const response = await instance.get("/admin/votes/search", {
        params: { q: searchQuery },
        headers: { Authorization: `Bearer ${token}` },
      });
      setVotes(response.data.votes);
      setComments([]);
      setSelectedVoteId(null);
    } catch (error) {
      console.error("검색 에러:", error);
      if (!handleAuthError(error)) {
        alert(error.response?.data?.message || "검색 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 투표 상세 참여 기록 조회
  const handleViewVoteDetails = async (voteId, voteTitle) => {
    setLoading(true);
    setSelectedVoteTitle(voteTitle);
    try {
      const response = await instance.get(`/admin/votes/${voteId}/records`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVoteRecords(response.data.records);
      setShowVoteDetails(true);
    } catch (error) {
      console.error("투표 상세 조회 에러:", error);
      if (!handleAuthError(error)) {
        alert("상세 기록을 불러오는 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCloseModal = () => {
    setDeleteModal(null);
    setItemToDelete(null);
    setUserDeleteStep(0);
    setDeleteVerifyCode("");
    setDeleteInputCode("");
    setShowVoteDetails(false);
    setVoteRecords([]);
  };

  // 모든 투표 조회
  const handleLoadAllVotes = async () => {
    setLoading(true);
    try {
      const response = await instance.get("/admin/votes", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setVotes(response.data.votes);
      setComments([]);
      setSelectedVoteId(null);
      setActiveTab("votes");
    } catch (error) {
      console.error("투표 조회 에러:", error);
      if (!handleAuthError(error)) {
        alert("투표 조회 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 투표의 댓글 조회
  const handleViewComments = async (voteId) => {
    setSelectedVoteId(voteId);
    setLoading(true);
    try {
      const response = await instance.get("/admin/comments", {
        params: { postId: voteId },
        headers: { Authorization: `Bearer ${token}` },
      });
      setComments(response.data.comments);
      setActiveTab("comments");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      console.error("댓글 조회 에러:", error);
      if (!handleAuthError(error)) {
        alert("댓글 조회 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 투표 삭제
  const handleDeleteVote = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      await instance.delete(`/admin/votes/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("투표가 삭제되었습니다.");
      
      // 만약 신고 탭에서 삭제한 경우, 해당 신고를 처리 완료로 변경
      if (itemToDelete.reportId) {
        await instance.put(`/admin/reports/${itemToDelete.reportId}/status`, { status: 'resolved' }, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReports(reports.map(r => r.id === itemToDelete.reportId ? { ...r, status: 'resolved' } : r));
      }

      setVotes(votes.filter((v) => v.id !== itemToDelete.id));
      setDeleteModal(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("투표 삭제 에러:", error);
      alert(
        error.response?.data?.message || "투표 삭제 중 에러가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 댓글 삭제
  const handleDeleteComment = async () => {
    if (!itemToDelete) return;

    setLoading(true);
    try {
      await instance.delete(`/admin/comments/${itemToDelete.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("댓글이 삭제되었습니다.");
      setComments(comments.filter((c) => c.id !== itemToDelete.id));
      setDeleteModal(null);
      setItemToDelete(null);
    } catch (error) {
      console.error("댓글 삭제 에러:", error);
      alert(
        error.response?.data?.message || "댓글 삭제 중 에러가 발생했습니다.",
      );
    } finally {
      setLoading(false);
    }
  };

  // 유저 목록 조회
  const handleLoadUsers = async () => {
    setLoading(true);
    try {
      const response = await instance.get("/admin/users", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(response.data.users);
      setActiveTab("users");
    } catch (error) {
      console.error("유저 조회 에러:", error);
      if (!handleAuthError(error)) {
        alert("유저 목록을 불러오는 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 유저 상태 업데이트 (티어, 역할, 테두리 등)
  const handleUpdateUserStatus = async (userId, updates) => {
    setLoading(true);
    try {
      await instance.put(`/admin/users/${userId}/status`, updates, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("유저 정보가 수정되었습니다.");
      // 목록 업데이트
      setUsers(users.map((u) => (u.id === userId ? { ...u, ...updates } : u)));
    } catch (error) {
      console.error("유저 수정 에러:", error);
      alert("유저 수정 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  // 신고 목록 조회
  const handleLoadReports = async () => {
    setLoading(true);
    try {
      const response = await instance.get("/admin/reports", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setReports(response.data.reports);
      setActiveTab("reports");
    } catch (error) {
      console.error("신고 조회 에러:", error);
      if (!handleAuthError(error)) {
        alert("신고 목록을 불러오는 중 에러가 발생했습니다.");
      }
    } finally {
      setLoading(false);
    }
  };

  // 신고 처리 상태 업데이트
  const handleUpdateReportStatus = async (reportId, status) => {
    setLoading(true);
    try {
      await instance.put(
        `/admin/reports/${reportId}/status`,
        { status },
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );
      alert("신고 상태가 변경되었습니다.");
      setReports(
        reports.map((r) => (r.id === reportId ? { ...r, status } : r)),
      );
    } catch (error) {
      console.error("신고 수정 에러:", error);
      alert("신고 수정 중 에러가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser || currentUser.role !== "admin") {
    return null; // 권한 없으면 렌더링 안 함
  }

  // 2차 인증 전 화면
  if (!isVerified) {
    return (
      <div className="admin-page">
        <div className="admin-verification-container">
          <div className="admin-verification-card">
            <h2>보안 인증</h2>
            <p>
              안전한 관리를 위해 등록된 이메일(kdy20716@gmail.com)로 인증이
              필요합니다.
            </p>

            <div className="verification-actions">
              <button
                className="admin-btn send-code-btn"
                onClick={handleSendVerificationCode}
                disabled={isSendingCode}
              >
                {isSendingCode
                  ? "발송 중..."
                  : serverCode
                    ? "코드 재발송"
                    : "인증 코드 발송"}
              </button>
            </div>

            {serverCode && (
              <div className="verification-input-group animate-fade-in">
                <input
                  type="text"
                  placeholder="인증 코드 6자리 입력"
                  value={inputCode}
                  onChange={(e) => setInputCode(e.target.value)}
                  maxLength={6}
                />
                <button
                  className="admin-btn verify-btn"
                  onClick={handleVerifyCode}
                >
                  인증하기
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-wrapper">
        <div className="admin-header">
          <h1>
            관리자 <span>Dashboard</span>
          </h1>
          <p>안녕하세요, {currentUser?.name}님</p>
        </div>

        <div className="admin-container">
          {/* 검색 섹션 */}
          <div className="admin-search-section">
            <h2>투표 검색</h2>
            <form
              onSubmit={handleSearchVotes}
              className="search-form-horizontal"
            >
              <div className="search-input-wrapper">
                <input
                  type="text"
                  placeholder="투표 제목, 선택지명으로 검색..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="search-input"
                />
              </div>
              <div className="search-buttons-group">
                <button type="submit" className="search-btn" disabled={loading}>
                  {loading ? "검색 중..." : "투표 검색"}
                </button>
                <button
                  type="button"
                  className="load-all-btn"
                  onClick={handleLoadAllVotes}
                  disabled={loading}
                >
                  {loading ? "로딩 중..." : "전체 투표 보기"}
                </button>
              </div>
            </form>
          </div>

          {/* 탭 선택 */}
          <div className="tabs">
            <button
              className={`tab ${activeTab === "votes" ? "active" : ""}`}
              onClick={() => fetchList("votes", 1)}
            >
              투표 ({pagination.votes.total})
            </button>
            <button
              className={`tab ${activeTab === "users" ? "active" : ""}`}
              onClick={() => fetchList("users", 1)}
            >
              유저 ({pagination.users.total})
            </button>
            <button
              className={`tab ${activeTab === "reports" ? "active" : ""}`}
              onClick={() => fetchList("reports", 1)}
            >
              신고 ({pagination.reports.total})
            </button>
            <button
              className={`tab ${activeTab === "bans" ? "active" : ""}`}
              onClick={() => fetchList("bans", 1)}
            >
              이메일 차단 ({pagination.bans.total})
            </button>
          </div>

          {/* 이메일 차단 관리 섹션 */}
          {activeTab === "bans" && (
            <div className="content-section animate-fade-in">
              <div className="ban-management-card">
                <h3>새로운 이메일 차단</h3>
                <form
                  onSubmit={handleAddBanEmail}
                  className="ban-form-horizontal"
                >
                  <input
                    type="email"
                    placeholder="차단할 이메일 주소 입력"
                    value={newBanEmail}
                    onChange={(e) => setNewBanEmail(e.target.value)}
                    className="ban-input"
                    required
                  />
                  <button
                    type="submit"
                    className="admin-btn ban-submit-btn"
                    disabled={loading}
                  >
                    이메일 차단하기
                  </button>
                </form>
              </div>

              <div className="banned-list-container">
                <h3>차단된 이메일 목록</h3>
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>이메일 주소</th>
                        <th>차단 일시</th>
                        <th>작업</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bannedEmails.length === 0 ? (
                        <tr>
                          <td colSpan="4" className="no-data">
                            차단된 이메일이 없습니다.
                          </td>
                        </tr>
                      ) : (
                        bannedEmails.map((ban) => (
                          <tr key={ban.id}>
                            <td>{ban.id}</td>
                            <td>{ban.email}</td>
                            <td>{new Date(ban.created_at).toLocaleString()}</td>
                            <td>
                              <button
                                className="clear-btn"
                                onClick={() => handleRemoveBanEmail(ban.id)}
                                disabled={loading}
                              >
                                차단 해제
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                <Pagination tab="bans" />
              </div>
            </div>
          )}

          {/* 투표 목록 */}
          {activeTab === "votes" && (
            <div className="content-section">
              {votes.length === 0 ? (
                <p className="no-data">검색 결과가 없습니다.</p>
              ) : (
                <>
                  <div className="votes-grid">
                    {votes.map((vote) => (
                      <div 
                        key={vote.id} 
                        className="vote-card" 
                        onClick={() => handleViewVoteDetails(vote.id, vote.title)}
                        style={{ cursor: "pointer" }}
                      >
                        <div className="vote-header">
                          <h3>{vote.title}</h3>
                          <span className="vote-id">#{vote.id}</span>
                        </div>
                        <div className="vote-body">
                          <div className="candidates">
                            <div className="candidate">
                              <span className="name">
                                A: {vote.candidate_a_name}
                              </span>
                              <span className="count">
                                {vote.candidate_a_count} votes
                              </span>
                            </div>
                            <span className="vs">VS</span>
                            <div className="candidate">
                              <span className="name">
                                B: {vote.candidate_b_name}
                              </span>
                              <span className="count">
                                {vote.candidate_b_count} votes
                              </span>
                            </div>
                          </div>
                          <div className="vote-info">
                            <p>
                              작성자: {vote.author_nickname} ({vote.author_name})
                            </p>
                            <p>
                              조회: {vote.view_count} | 댓글: {vote.comment_count}
                            </p>
                            <p>
                              작성일: {new Date(vote.created_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                        <div className="vote-actions">
                          <button
                            className="delete-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              setDeleteModal("vote");
                              setItemToDelete(vote);
                            }}
                            disabled={loading}
                          >
                            삭제
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Pagination tab="votes" />
                </>
              )}
            </div>
          )}

          {/* 투표 참여 상세 모달 */}
          {showVoteDetails && (
            <div className="modal-overlay" onClick={handleCloseModal}>
              <div className="modal-content detail-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "800px", width: "90%" }}>
                <h3 className="modal-title">투표 참여 상세 내역</h3>
                <p className="modal-subtitle" style={{ marginBottom: "20px", color: "#666" }}>게시글: <strong>{selectedVoteTitle}</strong></p>
                
                <div className="detail-table-container" style={{ maxHeight: "400px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px" }}>
                  <table className="admin-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead style={{ position: "sticky", top: 0, backgroundColor: "#f8f9fa" }}>
                      <tr>
                        <th style={{ padding: "12px", textAlign: "left", borderBottom: "2px solid #dee2e6" }}>유저 (닉네임/이름)</th>
                        <th style={{ padding: "12px", textAlign: "center", borderBottom: "2px solid #dee2e6" }}>선택</th>
                        <th style={{ padding: "12px", textAlign: "right", borderBottom: "2px solid #dee2e6" }}>투표 일시</th>
                      </tr>
                    </thead>
                    <tbody>
                      {voteRecords.length === 0 ? (
                        <tr>
                          <td colSpan="3" style={{ padding: "40px", textAlign: "center", color: "#999" }}>아직 참여 기록이 없습니다.</td>
                        </tr>
                      ) : (
                        voteRecords.map((record, idx) => (
                          <tr key={idx} style={{ borderBottom: "1px solid #eee" }}>
                            <td style={{ padding: "12px" }}>
                              <strong>{record.nickname}</strong> <span style={{ color: "#888", fontSize: "0.9em" }}>({record.name})</span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "center" }}>
                              <span style={{ 
                                padding: "4px 10px", 
                                borderRadius: "20px", 
                                fontWeight: "bold",
                                backgroundColor: record.selected_side === "A" ? "#e3f2fd" : "#fff3e0",
                                color: record.selected_side === "A" ? "#1976d2" : "#f57c00"
                              }}>
                                {record.selected_side}
                              </span>
                            </td>
                            <td style={{ padding: "12px", textAlign: "right", color: "#666", fontSize: "0.9em" }}>
                              {new Date(record.created_at).toLocaleString("ko-KR", {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              })}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
                
                <div className="modal-actions" style={{ marginTop: "20px" }}>
                  <button className="modal-cancel-btn" onClick={handleCloseModal}>닫기</button>
                </div>
              </div>
            </div>
          )}

          {/* 유저 관리 섹션 */}
          {activeTab === "users" && (
            <div className="content-section">
              <div className="users-table-container">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>닉네임(이름)</th>
                      <th>티어</th>
                      <th>권한</th>
                      <th>특별 테두리</th>
                      <th>가입일</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.id}</td>
                        <td>
                          {user.nickname} ({user.name})
                        </td>
                        <td>
                          <select
                            value={user.tier || "bronze"}
                            onChange={(e) =>
                              handleUpdateUserStatus(user.id, {
                                tier: e.target.value,
                              })
                            }
                          >
                            <option value="bronze">BRONZE</option>
                            <option value="silver">SILVER</option>
                            <option value="gold">GOLD</option>
                            <option value="platinum">PLATINUM</option>
                            <option value="diamond">DIAMOND</option>
                            <option value="master">MASTER</option>
                            <option value="challenger">CHALLENGER</option>
                          </select>
                        </td>
                        <td>
                          {user.role === "admin" ? (
                            <span
                              style={{ color: "#ff4d4f", fontWeight: "bold" }}
                            >
                              ADMIN
                            </span>
                          ) : (
                            <span>USER</span>
                          )}
                        </td>
                        <td>
                          <div className="border-grant-cell">
                            <span className="current-unlocked">
                              {user.unlocked_borders || "없음"}
                            </span>
                            <button
                              className="grant-btn"
                              onClick={() => {
                                const border = "pick";
                                const newList = user.unlocked_borders
                                  ? [
                                      ...new Set([
                                        ...user.unlocked_borders.split(","),
                                        border,
                                      ]),
                                    ].join(",")
                                  : border;
                                handleUpdateUserStatus(user.id, {
                                  unlocked_borders: newList,
                                });
                              }}
                            >
                              Pick 지급
                            </button>
                            {user.unlocked_borders && (
                              <button
                                className="clear-btn"
                                onClick={() =>
                                  handleUpdateUserStatus(user.id, {
                                    unlocked_borders: null,
                                  })
                                }
                              >
                                초기화
                              </button>
                            )}
                          </div>
                        </td>
                        <td>
                          {new Date(user.created_at).toLocaleDateString()}
                        </td>
                        <td>
                          {user.role !== "admin" && (
                            <button
                              className="delete-btn"
                              onClick={() => {
                                setDeleteModal("user");
                                setItemToDelete(user);
                                setUserDeleteStep(1); // 첫 번째 확인 단계로 진입
                              }}
                              disabled={loading}
                            >
                              강제탈퇴
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination tab="users" />
            </div>
          )}

          {/* 신고 관리 섹션 */}
          {activeTab === "reports" && (
            <div className="content-section">
              <div className="reports-table-container">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>신고ID</th>
                      <th>대상 게시물</th>
                      <th>신고 사유</th>
                      <th>신고자</th>
                      <th>상태</th>
                      <th>일시</th>
                      <th>작업</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reports.map((report) => (
                      <tr key={report.id}>
                        <td>{report.id}</td>
                        <td>
                          <div className="post-info">
                            <strong>{report.vote_title}</strong>
                            <span>#{report.post_id}</span>
                          </div>
                        </td>
                        <td>
                          <div className="report-reason-text">
                            {report.reason}
                          </div>
                        </td>
                        <td>{report.reporter_nickname || "익명"}</td>
                        <td>
                          <span
                            className={`status-badge status-${report.status}`}
                          >
                            {report.status === "pending"
                              ? "대기"
                              : "처리완료"}
                          </span>
                        </td>
                        <td>{new Date(report.created_at).toLocaleString()}</td>
                        <td>
                          <div className="action-btns">
                            <button
                              className="ignore-btn"
                              onClick={() =>
                                handleUpdateReportStatus(report.id, "ignored")
                              }
                              disabled={report.status !== "pending"}
                            >
                              무시
                            </button>
                            <button
                              className="delete-post-btn"
                              onClick={() => {
                                setDeleteModal("vote");
                                setItemToDelete({
                                  id: report.post_id,
                                  title: report.vote_title,
                                  reportId: report.id, // 신고 ID 전달
                                });
                              }}
                              disabled={!report.post_id || report.status !== "pending"}
                            >
                              게시물 삭제
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <Pagination tab="reports" />
            </div>
          )}
        </div>

        {/* 삭제 확인 모달 */}
        {deleteModal && (
          <div className="modal-overlay" onClick={handleCloseModal}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
              <h3 className="modal-title">
                {deleteModal === "vote"
                  ? "투표 삭제"
                  : deleteModal === "comment"
                    ? "댓글 삭제"
                    : "유저 강제 탈퇴"}
              </h3>

              {deleteModal === "user" ? (
                <div className="user-delete-steps">
                  {userDeleteStep === 1 && (
                    <div className="step-content animate-fade-in">
                      <p className="modal-text warning-text">
                        <strong>주의:</strong> [{itemToDelete?.nickname}] 유저를
                        정말로 <strong>강제 탈퇴</strong> 시키겠습니까?
                        <br />이 작업은 되돌릴 수 없으며 유저의 모든 활동
                        데이터가 삭제됩니다.
                      </p>
                      <div className="modal-actions">
                        <button
                          className="modal-cancel-btn"
                          onClick={handleCloseModal}
                        >
                          취소
                        </button>
                        <button
                          className="modal-delete-btn"
                          onClick={() => handleSendCode(true)}
                          disabled={isSendingCode}
                        >
                          {isSendingCode
                            ? "발송 중..."
                            : "확인 및 인증번호 받기"}
                        </button>
                      </div>
                    </div>
                  )}

                  {userDeleteStep === 2 && (
                    <div className="step-content animate-fade-in">
                      <p className="modal-text">
                        관리자 보안 인증이 필요합니다.
                        <br />
                        등록된 이메일로 전송된 <strong>인증 번호</strong>를
                        입력해주세요.
                      </p>
                      <div className="verification-input-group">
                        <input
                          type="text"
                          placeholder="6자리 코드 입력"
                          value={deleteInputCode}
                          onChange={(e) => setDeleteInputCode(e.target.value)}
                          maxLength={6}
                          autoFocus
                        />
                      </div>
                      <div className="modal-actions">
                        <button
                          className="modal-cancel-btn"
                          onClick={handleCloseModal}
                        >
                          취소
                        </button>
                        <button
                          className="modal-delete-btn final-delete-btn"
                          onClick={handleDeleteUser}
                          disabled={loading || deleteInputCode.length < 6}
                        >
                          {loading ? "처리 중..." : "최종 강제 탈퇴 승인"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <>
                  <p className="modal-text">
                    {deleteModal === "vote"
                      ? `"${itemToDelete?.title}" 투표를 삭제하시겠습니까?`
                      : `댓글을 삭제하시겠습니까?`}
                  </p>
                  <div className="modal-actions">
                    <button
                      className="modal-cancel-btn"
                      onClick={handleCloseModal}
                      disabled={loading}
                    >
                      취소
                    </button>
                    <button
                      className="modal-delete-btn"
                      onClick={
                        deleteModal === "vote"
                          ? handleDeleteVote
                          : handleDeleteComment
                      }
                      disabled={loading}
                    >
                      {loading ? "처리 중..." : "삭제"}
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
