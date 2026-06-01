import { useRef, useState } from "react";
import "./Default.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Eye, EyeOff } from "lucide-react";
import instance from "../../api/instance";
import {
  updateProfile,
  getLoginHistory,
  changePassword,
} from "../../api/users";
import { TEXT } from "./Language.js";

const AccountSettings = () => {
  const navigate = useNavigate();
  const { user: currentUser, updateUser, logout } = useAuth();
  const profileFileInputRef = useRef(null);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNicknameModalOpen, setIsNicknameModalOpen] = useState(false);
  const [newNickname, setNewNickname] = useState("");
  const [isSecurityOpen, setIsSecurityOpen] = useState(false);
  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isDisplayOpen, setIsDisplayOpen] = useState(false);
  const [displaySettings, setDisplaySettings] = useState({
    language: "한국어",
    fontSize: "보통",
  });
  const [loginHistory, setLoginHistory] = useState(null);
  const text = TEXT[displaySettings.language] || TEXT.한국어;
  const displayNickname =
    currentUser?.name ||
    currentUser?.nickname ||
    currentUser?.email?.split("@")[0] ||
    "-";

  const handleLogout = async () => {
    const isConfirmed = window.confirm(text.logoutConfirm);
    if (!isConfirmed) return;

    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
    }
  };

  const handleDeleteAccount = async () => {
    if (!currentUser) return;

    const isConfirmed = window.confirm(text.deleteConfirm);
    if (!isConfirmed) return;

    try {
      await instance.delete(`/users/account/${currentUser.id}`);
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("회원 탈퇴 중 오류:", error);
      alert(error.response?.data?.message || text.deleteFail);
    }
  };

  const applyProfileUpdate = async (formData) => {
    if (!currentUser) return;

    try {
      const res = await updateProfile(currentUser.id, formData);
      if (res.success) {
        updateUser(res.user);
        alert(text.profileUpdated);
        setIsProfileOpen(false);
      }
    } catch (error) {
      console.error("프로필 이미지 변경 실패:", error);
      alert(error.response?.data?.message || text.profileUpdateFail);
    }
  };

  const handleProfileFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("profile_image", file);
    await applyProfileUpdate(formData);
    event.target.value = "";
  };

  const handleResetProfileImage = async () => {
    const formData = new FormData();
    formData.append("remove_profile_image", "true");
    await applyProfileUpdate(formData);
  };

  const handlePasswordChange = (event) => {
    const { name, value } = event.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSavePassword = async () => {
    if (!passwordForm.currentPassword || !passwordForm.newPassword) {
      alert(text.passwordRequired);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      alert(text.passwordMismatch);
      return;
    }

    try {
      const res = await changePassword({
        userId: currentUser.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      if (res.success) {
        alert(text.passwordSaved);
        setPasswordForm({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        setIsPasswordModalOpen(false);
      }
    } catch (error) {
      console.error("비밀번호 변경 실패:", error);
      alert(error.response?.data?.message || text.passwordChangeFail);
    }
  };

  const handleNicknameSave = async () => {
    if (!newNickname.trim()) {
      alert(text.nicknameRequired);
      return;
    }

    if (newNickname.length > 5) {
      alert(text.nicknameTooLong);
      return;
    }

    try {
      const res = await updateProfile(currentUser.id, { name: newNickname });
      if (res.success) {
        updateUser(res.user);
        alert(text.nicknameUpdated);
        setIsNicknameModalOpen(false);
        setNewNickname("");
      }
    } catch (error) {
      console.error("닉네임 변경 실패:", error);
      alert(error.response?.data?.message || text.nicknameUpdateFail);
    }
  };

  const handleDisplaySettingChange = (key, value) => {
    setDisplaySettings((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  return (
    <div className="profile-container">
      <div className="breadcrumb">{text.breadcrumb}</div>

      <div className={`profile-card font-${displaySettings.fontSize}`}>
        <div className="card-content">
          <div className="profile-form">
            <div className="form-grid">
              <div className="account-info-list">
                <div className="account-info-item">
                  <div>
                    <strong>{text.nickname}</strong>
                    <span>{displayNickname}</span>
                  </div>
                  <div className="account-info-actions">
                    <button
                      type="button"
                      className="change-btn"
                      onClick={() => {
                        setNewNickname(displayNickname);
                        setIsNicknameModalOpen(true);
                      }}
                    >
                      {text.change}
                    </button>
                  </div>
                </div>

                <div className="account-info-item">
                  <div>
                    <strong>{text.currentEmail}</strong>
                    <span>{currentUser?.email || "-"}</span>
                  </div>
                </div>

                <div className="account-info-item">
                  <div>
                    <strong>{text.currentPassword}</strong>
                    <span>••••••••</span>
                  </div>
                  <div className="account-info-actions">
                    <button
                      type="button"
                      className="change-btn"
                      onClick={() => setIsPasswordModalOpen(true)}
                    >
                      {text.change}
                    </button>
                  </div>
                </div>
              </div>

              <div className="settings-menu">
                <div className="settings-menu-item">
                  <div>
                    <strong>{text.profileChange}</strong>
                    <span>{text.profileChangeDesc}</span>
                  </div>
                  <button type="button" onClick={() => setIsProfileOpen(true)}>
                    {text.change}
                  </button>
                </div>

                <div className="settings-menu-item">
                  <div>
                    <strong>{text.security}</strong>
                    <span>{text.securityDesc}</span>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      if (currentUser) {
                        try {
                          const res = await getLoginHistory(currentUser.id);
                          setLoginHistory(res.lastLogin);
                        } catch (error) {
                          console.error("로그인 기록 조회 실패:", error);
                          setLoginHistory(null);
                        }
                      }
                      setIsSecurityOpen(true);
                    }}
                  >
                    {text.check}
                  </button>
                </div>

                <div className="settings-menu-item">
                  <div>
                    <strong>{text.display}</strong>
                    <span>{text.displayDesc}</span>
                  </div>
                  <button type="button" onClick={() => setIsDisplayOpen(true)}>
                    {text.settings}
                  </button>
                </div>
              </div>

              <div className="account-actions">
                <button className="account-link-btn" onClick={handleLogout}>
                  {text.logout}
                </button>
                <button
                  className="account-danger-btn"
                  onClick={handleDeleteAccount}
                >
                  {text.deleteAccount}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {isProfileOpen && (
        <div
          className="settings-modal-layer"
          onClick={() => setIsProfileOpen(false)}
        >
          <button
            type="button"
            className="settings-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsProfileOpen(false)}
          />
          <section
            className="settings-modal profile-settings-modal"
            aria-label={text.profileChange}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <span>{text.profileChange}</span>
                <h2>{text.profileChangeDesc}</h2>
              </div>
              <button type="button" onClick={() => setIsProfileOpen(false)}>
                {text.close}
              </button>
            </header>

            <div className="profile-image-panel">
              <button
                type="button"
                className="profile-image-option"
                onClick={() => profileFileInputRef.current?.click()}
              >
                {text.choosePhoto}
              </button>
              <button
                type="button"
                className="profile-image-option"
                onClick={handleResetProfileImage}
              >
                {text.defaultImage}
              </button>
              <input
                ref={profileFileInputRef}
                type="file"
                accept="image/*"
                className="profile-image-file-input"
                onChange={handleProfileFileChange}
              />
            </div>
          </section>
        </div>
      )}

      {isSecurityOpen && (
        <div
          className="settings-modal-layer"
          onClick={() => setIsSecurityOpen(false)}
        >
          <button
            type="button"
            className="settings-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsSecurityOpen(false)}
          />
          <section
            className="settings-modal security-settings-modal"
            aria-label={text.security}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <span>{text.security}</span>
                <h2>{text.securityDesc}</h2>
              </div>
              <button type="button" onClick={() => setIsSecurityOpen(false)}>
                {text.close}
              </button>
            </header>

            <div className="security-panel">
              <div className="security-section">
                <strong>{text.loginHistory}</strong>
                <div className="login-history-item">
                  <span>{text.currentSession}</span>
                  <em>{text.currentSessionDesc}</em>
                </div>
                <div className="login-history-item">
                  <span>{text.recentLogin}</span>
                  <em>
                    {loginHistory
                      ? new Date(loginHistory).toLocaleString()
                      : text.noHistory}
                  </em>
                </div>
              </div>
            </div>
          </section>
        </div>
      )}

      {isPasswordModalOpen && (
        <div
          className="settings-modal-layer"
          onClick={() => setIsPasswordModalOpen(false)}
        >
          <button
            type="button"
            className="settings-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsPasswordModalOpen(false)}
          />
          <section
            className="settings-modal password-settings-modal"
            aria-label={text.changePassword}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <span>{text.security}</span>
                <h2>{text.changePassword}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsPasswordModalOpen(false)}
              >
                {text.close}
              </button>
            </header>

            <div className="security-panel">
              <div className="security-section">
                <strong>{text.changePassword}</strong>
                <div className="password-input-wrapper">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    name="currentPassword"
                    placeholder={text.currentPassword}
                    value={passwordForm.currentPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    name="newPassword"
                    placeholder={text.newPassword}
                    value={passwordForm.newPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <div className="password-input-wrapper">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder={text.confirmPassword}
                    value={passwordForm.confirmPassword}
                    onChange={handlePasswordChange}
                  />
                  <button
                    type="button"
                    className="password-toggle-btn"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <button type="button" onClick={handleSavePassword}>
                  {text.saveChange}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {isNicknameModalOpen && (
        <div
          className="settings-modal-layer"
          onClick={() => setIsNicknameModalOpen(false)}
        >
          <button
            type="button"
            className="settings-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsNicknameModalOpen(false)}
          />
          <section
            className="settings-modal nickname-settings-modal"
            aria-label={text.changeNickname}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <span>{text.nickname}</span>
                <h2>{text.changeNickname}</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsNicknameModalOpen(false)}
              >
                {text.close}
              </button>
            </header>

            <div className="security-panel">
              <div className="security-section">
                <strong>{text.changeNickname}</strong>
                <input
                  type="text"
                  placeholder={text.enterNickname}
                  value={newNickname}
                  onChange={(e) => setNewNickname(e.target.value)}
                  maxLength={5}
                />
                <button type="button" onClick={handleNicknameSave}>
                  {text.saveChange}
                </button>
              </div>
            </div>
          </section>
        </div>
      )}

      {isDisplayOpen && (
        <div
          className="settings-modal-layer"
          onClick={() => setIsDisplayOpen(false)}
        >
          <button
            type="button"
            className="settings-modal-backdrop"
            aria-label={text.close}
            onClick={() => setIsDisplayOpen(false)}
          />
          <section
            className="settings-modal display-settings-modal"
            aria-label={text.display}
            onClick={(e) => e.stopPropagation()}
          >
            <header className="settings-modal-header">
              <div>
                <span>{text.display}</span>
                <h2>{text.displayDesc}</h2>
              </div>
              <button type="button" onClick={() => setIsDisplayOpen(false)}>
                {text.close}
              </button>
            </header>

            <div className="display-panel">
              <label className="display-option">
                <span>{text.language}</span>
                <select
                  value={displaySettings.language}
                  onChange={(event) =>
                    handleDisplaySettingChange("language", event.target.value)
                  }
                >
                  <option>한국어</option>
                  <option>English</option>
                </select>
              </label>

              <label className="display-option">
                <span>{text.fontSize}</span>
                <select
                  value={displaySettings.fontSize}
                  onChange={(event) =>
                    handleDisplaySettingChange("fontSize", event.target.value)
                  }
                >
                  <option value="작게">{text.small}</option>
                  <option value="보통">{text.normal}</option>
                  <option value="크게">{text.large}</option>
                </select>
              </label>

              <button
                type="button"
                className="display-save-btn"
                onClick={() => {
                  alert(text.displaySaved);
                  setIsDisplayOpen(false);
                }}
              >
                {text.save}
              </button>
            </div>
          </section>
        </div>
      )}
    </div>
  );
};

export default AccountSettings;
