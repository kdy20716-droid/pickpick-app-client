import { NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Menu = () => {
  const navigate = useNavigate();
  const { logout, isAdmin } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      alert("로그아웃 되었습니다.");
      navigate("/login");
    } catch (error) {
      console.error("로그아웃 중 오류:", error);
    }
  };

  return (
    <nav className="menu-nav">
      <NavLink to="/mypage" end>
        MY PAGE
      </NavLink>
      <NavLink to="/mypage/history">HISTORY</NavLink>
      <NavLink to="/mypage/like">LIKE</NavLink>
      <NavLink to="/mypage/mypoll">MY CREATE</NavLink>
      <NavLink to="/mypage/faq">FAQ</NavLink>
      {isAdmin && (
        <NavLink
          to="/admin"
          style={{
            color: "#ffa500",
            fontWeight: "bold",
            transition: "color 0.3s",
          }}
          onMouseOver={(e) => (e.target.style.color = "#ff8c00")}
          onMouseOut={(e) => (e.target.style.color = "#ffa500")}
        >
          MANAGE
        </NavLink>
      )}
      <button
        type="button"
        className="menu-logout-button"
        onClick={handleLogout}
      >
        LOGOUT
      </button>
    </nav>
  );
};

export default Menu;
