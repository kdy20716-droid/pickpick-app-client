import React from "react";
import { Link } from "react-router-dom";
import "./Footer.css";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-top">
          <Link to="/" className="footer-brand">
            PICKPICK
          </Link>
          <nav className="footer-nav">
            <Link to="/about">ABOUT</Link>
            <Link to="/privacy">PRIVACY POLICY</Link>
            <Link to="/terms">TERMS OF SERVICE</Link>
            <Link to="/faq">FAQ</Link>
          </nav>
        </div>
        <div className="footer-bottom">
          <p className="copyright">
            &copy; {currentYear} PICKPICK. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
