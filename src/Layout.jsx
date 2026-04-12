import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  FaFacebookF,
  FaTwitter,
  FaInstagram,
  FaYoutube,
  FaBars,
  FaTimes,
} from "react-icons/fa";
import "./Layout.css";

export default function Layout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();

  const [menuOpen, setMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    navigate("/");
    setMenuOpen(false);
    setShowLogoutModal(false);
  };

  const goTo = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  return (
    <div className="page-wrapper">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <img src="/src/assets/logo.png" alt="Logo" className="logo-img" />
            <span>Maries Christian School</span>
          </div>

          <button
            className="menu-toggle"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <FaTimes /> : <FaBars />}
          </button>

          <ul className={menuOpen ? "nav-menu open" : "nav-menu"}>
            <li
              onClick={() => goTo("/home")}
              className={location.pathname === "/home" ? "active" : ""}
            >
              Home
            </li>
            <li
              onClick={() => goTo("/about")}
              className={location.pathname === "/about" ? "active" : ""}
            >
              About Us
            </li>
            <li
              onClick={() => goTo("/programs")}
              className={location.pathname === "/programs" ? "active" : ""}
            >
              Programs
            </li>
            <li
              onClick={() => goTo("/enroll")}
              className={location.pathname === "/enroll" ? "active" : ""}
            >
              Enroll
            </li>
            <li
              onClick={() => goTo("/contact")}
              className={location.pathname === "/contact" ? "active" : ""}
            >
              Contact Us
            </li>
            <li
              onClick={() => goTo("/profile")}
              className={location.pathname === "/profile" ? "active" : ""}
            >
              Profile
            </li>
            <li onClick={() => setShowLogoutModal(true)}>Logout</li>
          </ul>
        </div>
      </nav>

      {/* LOGOUT CONFIRMATION MODAL */}
      {showLogoutModal && (
        <div
          className="logout-modal-overlay"
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            className="logout-modal"
            onClick={(e) => e.stopPropagation()}
          >
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to log out?</p>

            <div className="logout-modal-actions">
              <button
                className="logout-cancel-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>
              <button
                className="logout-confirm-btn"
                onClick={confirmLogout}
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <main>{children}</main>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-container">
          {/* LEFT */}
          <div className="footer-left">
            <div className="footer-logo">
              <img
                src="/src/assets/logo.png"
                alt="Logo"
                className="footer-logo-img"
              />
              <span>Maries Christian School</span>
            </div>
            <div className="footer-info">
              <p>4 St John Street, Antipolo, 1870 Rizal</p>
              <p>Tel. No: 0286469333</p>
              <p>Email: info@mcs.edu.ph</p>
            </div>
          </div>

          {/* MIDDLE */}
          <div className="footer-links">
            <h4>Quick Links</h4>
            <p onClick={() => navigate("/about")}>About M.C.S</p>
            <p onClick={() => navigate("/programs")}>Programs</p>
            <p onClick={() => navigate("/enroll")}>How to Enroll</p>
            <p onClick={() => navigate("/contact")}>Contact Us</p>
          </div>

          {/* RIGHT */}
          <div className="footer-social">
            <h4>Follow Us</h4>
            <div className="social-list">
              <a href="#" className="social-item">
                <FaFacebookF /> Facebook
              </a>
              <a href="#" className="social-item">
                <FaTwitter /> X
              </a>
              <a href="#" className="social-item">
                <FaInstagram /> Instagram
              </a>
              <a href="#" className="social-item">
                <FaYoutube /> YouTube
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}