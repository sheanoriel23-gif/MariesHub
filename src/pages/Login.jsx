import { useState, useEffect } from "react";
import bg from "../assets/mariesbg1.png";
import logo from "../assets/group.png";
import { useNavigate } from "react-router-dom";
import "./Login.css";
import { supabase } from "../supabase";

export default function Login() {
  const [loginId, setLoginId] = useState("");
  const [password, setPassword] = useState("");
  const [showPopup, setShowPopup] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [middleName, setMiddleName] = useState("");
  const [lastName, setLastName] = useState("");
  const [requestEmail, setRequestEmail] = useState("");

  const [loadingLogin, setLoadingLogin] = useState(false);
  const [loadingRequest, setLoadingRequest] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (user) {
      navigate("/home");
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!loginId.trim() || !password.trim()) {
      alert("Please enter your Login ID and password.");
      return;
    }

    try {
      setLoadingLogin(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("login_id", loginId.trim())
        .eq("password", password.trim())
        .single();

      if (error || !data) {
        alert("Invalid login credentials.");
        return;
      }

      localStorage.setItem("user", JSON.stringify(data));

      if (data.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/home");
      }
    } catch (err) {
      console.error(err);
      alert("Login failed.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();

    if (!firstName.trim() || !lastName.trim() || !requestEmail.trim()) {
      alert("Please enter the student's first name, last name, and email.");
      return;
    }

    try {
      setLoadingRequest(true);

      const { error } = await supabase.from("account_requests").insert([
        {
          first_name: firstName.trim(),
          middle_name: middleName.trim() || null,
          last_name: lastName.trim(),
          email: requestEmail.trim(),
          status: "pending",
        },
      ]);

      if (error) {
        alert(`Failed to submit request: ${error.message}`);
        return;
      }

      alert("Request submitted successfully!");

      setFirstName("");
      setMiddleName("");
      setLastName("");
      setRequestEmail("");
      setShowPopup(false);
    } catch (err) {
      alert("Something went wrong.");
    } finally {
      setLoadingRequest(false);
    }
  };

  return (
    <div
      className="login-container"
      style={{ backgroundImage: `url(${bg})` }}
    >
      <div className="overlay"></div>

      <div className="login-left">
        <h1>MariesHub</h1>
        <p>
          The official online enrollment and student portal of Maries Christian
          School.
        </p>
      </div>

      <div className="login-card">
        <img src={logo} alt="School Logo" className="login-logo" />

        <h1>Sign In</h1>

        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Enter your Login ID"
            value={loginId}
            onChange={(e) => setLoginId(e.target.value)}
            required
          />

          {/* PASSWORD WITH FORGOT TEXT */}
          <div className="password-wrapper">
            <input
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <span
              className="forgot-text"
              onClick={() => navigate("/forgot-password")}
            >
              Forgot Password?
            </span>
          </div>

          <button
            type="submit"
            className="login-btn"
            disabled={loadingLogin}
          >
            {loadingLogin ? "Logging in..." : "Log In"}
          </button>

          <button
            type="button"
            className="apply-btn"
            onClick={() => setShowPopup(true)}
          >
            Apply Now
          </button>
        </form>
      </div>

      {/* POPUP */}
      {showPopup && (
        <div className="popup-overlay">
          <div className="popup-box">
            <h2>Request an Account</h2>

            <form onSubmit={handleRequestSubmit}>
              <input
                type="text"
                placeholder="First Name"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Middle Name"
                value={middleName}
                onChange={(e) => setMiddleName(e.target.value)}
              />

              <input
                type="text"
                placeholder="Last Name"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                required
              />

              <input
                type="email"
                placeholder="Email Address"
                value={requestEmail}
                onChange={(e) => setRequestEmail(e.target.value)}
                required
              />

              <div className="popup-buttons">
                <button type="submit" className="submit-btn">
                  Submit
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={() => setShowPopup(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}