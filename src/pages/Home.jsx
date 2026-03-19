import "./Home.css";
import { FaFacebookF, FaTwitter, FaInstagram, FaYoutube } from "react-icons/fa";

export default function Home() {
  return (
    <div className="page-wrapper">
      {/* NAVBAR */}
      <nav className="navbar">
        <div className="navbar-container">
          <div className="logo">
            <img src="src/assets/logo.png" alt="Logo" className="logo-img" />
            <span>Maries Christian School</span>
          </div>
          <ul>
            <li className="active">Home</li>
            <li>About Us</li>
            <li>Program</li>
            <li>Enroll</li>
            <li>Contact Us</li>
            <li>Profile</li>
          </ul>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1>Welcome to Maries Christian School Enrollment Portal!</h1>
          <p>Simplify your enrollment process and manage your account in one convenient place.</p>
        </div>

        {/* ACTION CARDS — inside hero, below hero text */}
        <section className="actions">
          <div className="card">
            <img src="src/assets/enroll.jpg" alt="Enroll" />
            <button className="card-btn">Enroll Now</button>
          </div>
          <div className="card">
            <img src="src/assets/status.jpg" alt="Check Status" />
            <button className="card-btn">Check Status</button>
          </div>
          <div className="card">
            <img src="src/assets/profile.jpg" alt="View Profile" />
            <button className="card-btn">View Profile</button>
          </div>
        </section>
      </section>

      {/* NEWS */}
      <section className="news">
        <h2>News and Announcements</h2>
        <div className="news-grid">
          <div className="news-card">
            <img src="src/assets/back_to_school.png" alt="News 1" />
          </div>
          <div className="news-card">
            <img src="src/assets/announcement.png" alt="News 2" />
          </div>
          <div className="news-card">
            <img src="src/assets/mcsi_notice.png" alt="News 3" />
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        <div className="footer-left">
          <div className="footer-logo">
            <img src="src/assets/logo.png" alt="Logo" className="footer-logo-img" />
            <span>Maries Christian School</span>
          </div>
          <div className="footer-info">
            <p>4 St John Street, Antipolo, 1870 Rizal</p>
            <p>Tel. No: 0286469333</p>
            <p>Email:</p>
            <p>info@mcs.edu.ph</p>
          </div>
        </div>
        <div className="footer-links">
          <h4>Quick Links</h4>
          <p>About M.C.S</p>
          <p>Programs</p>
          <p>How to Enroll</p>
          <p>Contact Us</p>
        </div>
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="social-list">
            <a href="#" className="social-item">
              <FaFacebookF className="social-icon facebook-icon" />
              <span>Facebook</span>
            </a>
            <a href="#" className="social-item">
              <FaTwitter className="social-icon twitter-icon" />
              <span>X</span>
            </a>
            <a href="#" className="social-item">
              <FaInstagram className="social-icon instagram-icon" />
              <span>Instagram</span>
            </a>
            <a href="#" className="social-item">
              <FaYoutube className="social-icon youtube-icon" />
              <span>Youtube</span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}