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
        <nav className="site-nav" aria-label="주요 메뉴">
          <Link to="/create" data-label="+ CREATE">
            + CREATE
          </Link>
          <Link to="/ranking" data-label="RANKING">
            RANKING
          </Link>
          {!isLoggedIn ? (
            <Link to="/login" data-label="LOG IN">
              LOG IN
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
        </nav>
      </div>
    </header>
  );
};

export default Header;
