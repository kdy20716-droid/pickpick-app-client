import { Link } from "react-router-dom";
import "./Header.css";
import accountIcon from "../assets/account-icon.svg";
import { useAuth } from "../contexts/AuthContext";
import { getImageUrl } from "../utils/image";

const Header = () => {
  const { isLoggedIn, user } = useAuth();

  return (
    <header className="site-header">
      <div className="header-inner">
        <Link to="/" className="brand">
          PICKPICK
        </Link>
        <div className="header-right">
          {!isLoggedIn ? (
            <Link to="/login" className="header-login-btn">
              로그인
            </Link>
          ) : (
            <Link to="/mypage" className="account-link" aria-label="계정">
              <div className={`header-profile-avatar ${user?.selected_border ? `profile-border-${user.selected_border}` : ""}`}>
                <div className="header-profile-inner">
                  {user?.profile_image ? (
                    <img
                      src={getImageUrl(user.profile_image)}
                      alt=""
                      className="profile-img-small"
                    />
                  ) : (
                    <img src={accountIcon} alt="" className="profile-img-small default-icon" />
                  )}
                </div>
              </div>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
