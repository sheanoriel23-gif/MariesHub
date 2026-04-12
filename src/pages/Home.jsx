import "./Home.css";
import { useNavigate } from "react-router-dom";
import enrollImg from "../assets/enroll.jpg";
import statusImg from "../assets/status.jpg";
import profileImg from "../assets/profile.jpg";
import news1 from "../assets/back_to_school.png";
import news2 from "../assets/announcement.png";
import news3 from "../assets/mcsi_notice.png";

export default function Home() {
  const navigate = useNavigate();

  return (
    <main className="home">
      {/* HERO */}
      <section className="hero-home">
        <div className="hero-content">
          <h1>Maries Christian School Enrollment Portal</h1>
          <p>
            Simplify your enrollment process and manage your account in one convenient place.
          </p>
        </div>
      </section>

      {/* ACTION CARDS */}
      <section className="actions">
        <div className="card">
          <img src={enrollImg} alt="Enroll" />
          <button className="card-btn" onClick={() => navigate("/enroll")}>
            Enroll Now
          </button>
        </div>

        <div className="card">
          <img src={statusImg} alt="Check Status" />
          <button className="card-btn" onClick={() => navigate("/profile")}>
            Check Status
          </button>
        </div>

        <div className="card">
          <img src={profileImg} alt="View Profile" />
          <button className="card-btn" onClick={() => navigate("/profile")}>
            View Profile
          </button>
        </div>
      </section>

      {/* NEWS */}
      <section className="news">
        <h2>News and Announcements</h2>

        <div className="news-grid">
          <div className="news-card">
            <img src={news1} alt="News 1" />
          </div>

          <div className="news-card">
            <img src={news2} alt="News 2" />
          </div>

          <div className="news-card">
            <img src={news3} alt="News 3" />
          </div>
        </div>
      </section>
    </main>
  );
}