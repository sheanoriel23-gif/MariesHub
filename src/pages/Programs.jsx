import "./Programs.css";
import { FaBook, FaPencilAlt, FaMicroscope, FaGraduationCap } from "react-icons/fa";

export default function Programs() {
  return (
    <section className="hero">
      <div className="hero-content">
        <h1>Academic Programs</h1>
        <p>
          We offer a complete educational journey from Nursery to Senior High School, 
          providing learners with a strong academic foundation at every stage.
        </p>

        <div className="program-section">
          <h2><FaBook className="program-icon" /> Early Childhood Education</h2>
          <div className="program-card">
            <span>Nursery</span>
            <span>Kindergarten</span>
          </div>
        </div>

        <div className="program-section">
          <h2><FaPencilAlt className="program-icon" /> Elementary School</h2>
          <div className="program-card">
            <span>Grade 1</span>
            <span>Grade 2</span>
            <span>Grade 3</span>
            <span>Grade 4</span>
            <span>Grade 5</span>
            <span>Grade 6</span>
          </div>
        </div>

        <div className="program-section">
          <h2><FaMicroscope className="program-icon" /> Junior High</h2>
          <div className="program-card">
            <span>Grade 7</span>
            <span>Grade 8</span>
            <span>Grade 9</span>
            <span>Grade 10</span>
          </div>
        </div>

        <div className="program-section">
          <h2><FaGraduationCap className="program-icon" /> Senior High School</h2>
          <div className="program-card">
            <span>Grade 11</span>
            <span>Grade 12</span>
          </div>
        </div>

        <h2>Senior High School Strands</h2>
        <div className="strand-badges">
          <span className="strand abm">ABM</span>
          <span className="strand stem">STEM</span>
          <span className="strand humss">HUMSS</span>
          <span className="strand gas">GAS</span>
        </div>
      </div>
    </section>
  );
}