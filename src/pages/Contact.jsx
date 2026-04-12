import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Contact.css";

export default function Contact() {
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    department: "",
    message: "",
  });
  const [loading, setLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    const savedUser = localStorage.getItem("user");

    if (!savedUser) {
      navigate("/");
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);
      console.log("Logged in user:", parsedUser); 

      setCurrentUser(parsedUser);
      setFormData((prev) => ({
        ...prev,
        full_name: parsedUser.full_name || "",
        email: parsedUser.email || "",
      }));
    } catch (error) {
      console.error("Invalid user data in localStorage:", error);
      localStorage.removeItem("user");
      navigate("/");
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!currentUser) {
      setStatusMessage("You must be logged in first.");
      return;
    }

    if (!currentUser.id) {
      setStatusMessage("User ID is missing. Please log in again.");
      console.error("Missing user ID in currentUser:", currentUser);
      return;
    }

    setLoading(true);
    setStatusMessage("");

    const payload = {
      user_id: currentUser.id,
      full_name: formData.full_name.trim(),
      email: formData.email.trim(),
      department: formData.department,
      message: formData.message.trim(),
    };

    console.log("Submitting payload:", payload);

    const { error } = await supabase.from("contact_messages").insert([payload]);

    if (error) {
      console.error("Insert error:", error);
      setStatusMessage(`Failed to send message: ${error.message}`);
    } else {
      setStatusMessage("Message sent successfully.");
      setFormData({
        full_name: currentUser.full_name || "",
        email: currentUser.email || "",
        department: "",
        message: "",
      });
    }

    setLoading(false);
  };

  if (!currentUser) return null;

  return (
    <section className="contact-page">
      <div className="hero contact-hero">
        <div className="contact-content">
          <h1>We’re here to assist you</h1>

          <form className="contact-form" onSubmit={handleSubmit}>
            <input
              type="text"
              name="full_name"
              placeholder="Full Name *"
              value={formData.full_name}
              readOnly
              required
            />

            <input
              type="email"
              name="email"
              placeholder="Email *"
              value={formData.email}
              onChange={handleChange}
              required
            />

            <select
              name="department"
              value={formData.department}
              onChange={handleChange}
              required
            >
              <option value="">Select Department *</option>
              <option value="admissions">Admissions</option>
              <option value="finance">Finance</option>
              <option value="support">Support</option>
              <option value="general">General Inquiry</option>
            </select>

            <textarea
              name="message"
              placeholder="Message *"
              rows="6"
              value={formData.message}
              onChange={handleChange}
              required
            />

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? "Sending..." : "Send"}
            </button>

            {statusMessage && <p className="form-status">{statusMessage}</p>}
          </form>
        </div>
      </div>
    </section>
  );
}