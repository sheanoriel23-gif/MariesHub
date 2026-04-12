import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import emailjs from "@emailjs/browser";
import "./ForgotPassword.css";

export default function ForgotPassword() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const generateOtp = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const sendOtpEmail = async ({ toEmail, otpCode }) => {
    return emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_OTP_TEMPLATE_ID,
      {
        to_email: toEmail,
        otp_code: otpCode,
      },
      import.meta.env.VITE_EMAILJS_PUBLIC_KEY
    );
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!email.trim()) {
      alert("Please enter your email.");
      return;
    }

    try {
      setLoading(true);

      const { data: user, error: userError } = await supabase
        .from("users")
        .select("id, email")
        .eq("email", email.trim())
        .maybeSingle();

      if (userError) {
        alert(`Failed to check email: ${userError.message}`);
        return;
      }

      if (!user) {
        alert("No account found with that email.");
        return;
      }

      const otpCode = generateOtp();
      const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

      const { error: insertError } = await supabase
        .from("password_reset_otps")
        .insert([
          {
            email: email.trim(),
            otp: otpCode,
            expires_at: expiresAt,
            is_used: false,
          },
        ]);

      if (insertError) {
        alert(`Failed to save OTP: ${insertError.message}`);
        return;
      }

      await sendOtpEmail({
        toEmail: email.trim(),
        otpCode,
      });

      alert("OTP sent successfully.");
      setStep(2);
    } catch (err) {
      console.error(err);
      alert("Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e.preventDefault();

    if (!otp.trim()) {
      alert("Please enter the OTP.");
      return;
    }

    try {
      setLoading(true);

      const nowIso = new Date().toISOString();

      const { data, error } = await supabase
        .from("password_reset_otps")
        .select("*")
        .eq("email", email.trim())
        .eq("otp", otp.trim())
        .eq("is_used", false)
        .gt("expires_at", nowIso)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        alert(`Failed to verify OTP: ${error.message}`);
        return;
      }

      if (!data) {
        alert("Invalid or expired OTP.");
        return;
      }

      const { error: markUsedError } = await supabase
        .from("password_reset_otps")
        .update({ is_used: true })
        .eq("id", data.id);

      if (markUsedError) {
        alert(`Failed to mark OTP as used: ${markUsedError.message}`);
        return;
      }

      alert("OTP verified.");
      setStep(3);
    } catch (err) {
      console.error(err);
      alert("Failed to verify OTP.");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();

    if (!newPassword.trim() || !confirmPassword.trim()) {
      alert("Please enter the new password.");
      return;
    }

    if (newPassword !== confirmPassword) {
      alert("Passwords do not match.");
      navigate("/");
      return;
    }

    if (newPassword.length < 6) {
      alert("Password must be at least 6 characters.");
      navigate("/");
      return;
    }

    try {
      setLoading(true);

      const { error } = await supabase
        .from("users")
        .update({ password: newPassword.trim() })
        .eq("email", email.trim());

      if (error) {
        alert(`Failed to reset password: ${error.message}`);
        navigate("/");
        return;
      }

      alert("Password reset successfully.");
      setStep(1);
      setEmail("");
      setOtp("");
      setNewPassword("");
      setConfirmPassword("");
      navigate("/");
    } catch (err) {
      console.error(err);
      alert("Failed to reset password.");
      navigate("/");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-card">
        <h1>Forgot Password</h1>
        <p className="forgot-subtitle">
          Enter your email and follow the steps to reset your password.
        </p>

        {step === 1 && (
          <form onSubmit={handleSendOtp} className="forgot-form">
            <input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Sending OTP..." : "Send OTP"}
            </button>
          </form>
        )}

        {step === 2 && (
          <form onSubmit={handleVerifyOtp} className="forgot-form">
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              maxLength={6}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
          </form>
        )}

        {step === 3 && (
          <form onSubmit={handleResetPassword} className="forgot-form">
            <input
              type="password"
              placeholder="Enter new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
            <button type="submit" disabled={loading}>
              {loading ? "Updating..." : "Reset Password"}
            </button>
          </form>
        )}

        <button
          type="button"
          className="back-login-btn"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </div>
    </div>
  );
}