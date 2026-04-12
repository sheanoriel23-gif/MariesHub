import "./Home.css";
import { useNavigate } from "react-router-dom";

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
          <img src="/src/assets/enroll.jpg" alt="Enroll" />
          <button className="card-btn" onClick={() => navigate("/enroll")}>
            Enroll Now
          </button>
        </div>

        <div className="card">
          <img src="/src/assets/status.jpg" alt="Check Status" />
          <button className="card-btn" onClick={() => navigate("/profile")}>
            Check Status
          </button>
        </div>

        <div className="card">
          <img src="/src/assets/profile.jpg" alt="View Profile" />
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
            <img src="/src/assets/back_to_school.png" alt="News 1" />
          </div>

          <div className="news-card">
            <img src="/src/assets/announcement.png" alt="News 2" />
          </div>

          <div className="news-card">
            <img src="/src/assets/mcsi_notice.png" alt="News 3" />
          </div>
        </div>
      </section>
    </main>
  );
}