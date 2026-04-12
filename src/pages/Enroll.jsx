import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../supabase";
import "./Enroll.css";

export default function Enroll() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    enrollment_date: new Date().toLocaleDateString("en-CA"),
    school_year: "",
    grade_level: "",
    family_name: "",
    given_name: "",
    middle_name: "",
    date_of_birth: "",
    place_of_birth: "",
    gender: "",

    father_name: "",
    father_occupation: "",
    father_education: "",
    father_contact: "",

    mother_name: "",
    mother_occupation: "",
    mother_education: "",
    mother_contact: "",
  });

  const [checkingExisting, setCheckingExisting] = useState(true);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  const [existingStatus, setExistingStatus] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  useEffect(() => {
    checkExistingEnrollment();
  }, []);

  const checkExistingEnrollment = async () => {
    try {
      const savedUser = localStorage.getItem("user");
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      if (!currentUser?.id) {
        setCheckingExisting(false);
        return;
      }

      const { data, error } = await supabase
        .from("enrollment_requests")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .in("status", ["pending", "in_review", "approved"])
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setHasExistingRequest(true);
        setExistingStatus(data.status);
      }
    } catch (error) {
      console.error("Error checking existing enrollment:", error);
    } finally {
      setCheckingExisting(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    setFieldErrors((prev) => ({
      ...prev,
      [name]: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.school_year.trim()) {
      errors.school_year = "School year is required.";
    } else if (!/^\d{4}-\d{4}$/.test(formData.school_year)) {
      errors.school_year = "Format must be YYYY-YYYY (e.g. 2025-2026).";
    }

    if (!formData.grade_level.trim()) {
      errors.grade_level = "Grade level is required.";
    }

    if (!formData.family_name.trim()) {
      errors.family_name = "Family name is required.";
    } else if (formData.family_name.trim().length < 2) {
      errors.family_name = "Family name must be at least 2 characters.";
    }

    if (!formData.given_name.trim()) {
      errors.given_name = "Given name is required.";
    } else if (formData.given_name.trim().length < 2) {
      errors.given_name = "Given name must be at least 2 characters.";
    }

    if (!formData.date_of_birth.trim()) {
      errors.date_of_birth = "Date of birth is required.";
    }

    if (!formData.gender.trim()) {
      errors.gender = "Gender is required.";
    }

    return errors;
  };

  const handleNext = () => {
    if (hasExistingRequest) return;

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      const firstErrorField = Object.keys(errors)[0];
      const firstField = document.querySelector(`[name="${firstErrorField}"]`);
      if (firstField) {
        firstField.focus();
      }
      return;
    }

    localStorage.setItem("enrollment_step1", JSON.stringify(formData));
    navigate("/enroll-step2");
  };

  const getStatusMessage = (status) => {
    switch (status) {
      case "pending":
        return {
          title: "Enrollment Submitted",
          message:
            "Your enrollment request has been successfully submitted and is waiting for initial review by the school.",
          note:
            "Please wait while the school checks your application details and requirements.",
        };

      case "in_review":
        return {
          title: "Enrollment Under Review",
          message:
            "Your enrollment request is currently under review by the school administration.",
          note:
            "Please wait for further updates while your documents and information are being evaluated.",
        };

      case "approved":
        return {
          title: "Enrollment Approved",
          message:
            "Your enrollment request has already been approved by the school.",
          note:
            "Please check your profile for your assigned section, and other enrollment details.",
        };

      default:
        return {
          title: "Enrollment Processing",
          message: "Your enrollment request is still being processed.",
          note: "Please wait for further updates from the school.",
        };
    }
  };

  const existingStatusContent = getStatusMessage(existingStatus);

  if (checkingExisting) {
    return (
      <section className="hero">
        <div className="hero-content enrollment-form">
          <h1>Enrollment Form</h1>
          <div className="form-container">
            <h2 className="section-title">Checking Status</h2>
            <p>Checking your enrollment status...</p>
          </div>
        </div>
      </section>
    );
  }

  if (hasExistingRequest) {
    return (
      <section className="hero">
        <div className="hero-content enrollment-form">
          <h1>Enrollment Form</h1>

          <div className="status-card">
            <div className="status-header">
            <h2>{existingStatusContent.title}</h2>

            <div className="status-divider"></div>
            </div>

            <p className="status-line">
              Status:
              <span className={`status-text status-${existingStatus}`}>
                {existingStatus.replace("_", " ")}
              </span>
            </p>

            <p className="status-message">
              {existingStatusContent.message}
            </p>

            <p className="status-note">
              {existingStatusContent.note}
            </p>

            <button
              className="next-btn"
              onClick={() => navigate("/profile")}
            >
              {existingStatus === "approved" ? "Go to Profile" : "View Profile"}
            </button>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="hero">
      <div className="hero-content enrollment-form">
        <h1>Enrollment Form</h1>

        <div className="form-container">
          <h2 className="section-title">Student Information</h2>

          <div className="form-row three-columns">
            <div className="form-group">
              <label>Enrollment Date:</label>
              <input
                type="date"
                name="enrollment_date"
                value={formData.enrollment_date}
                readOnly
              />
            </div>

            <div className="form-group">
              <label>School Year:</label>
              <input
                type="text"
                name="school_year"
                placeholder="YYYY-YYYY"
                value={formData.school_year}
                onChange={handleChange}
                className={fieldErrors.school_year ? "input-error" : ""}
                required
              />
              {fieldErrors.school_year && (
                <p className="field-error">{fieldErrors.school_year}</p>
              )}
            </div>

            <div className="form-group">
              <label>Grade Level:</label>
              <select
                name="grade_level"
                value={formData.grade_level}
                onChange={handleChange}
                className={fieldErrors.grade_level ? "input-error" : ""}
                required
              >
                <option value="">Select Grade</option>
                <option value="Nursery">Nursery</option>
                <option value="Kindergarten">Kindergarten</option>
                {Array.from({ length: 10 }, (_, i) => (
                  <option key={i + 1} value={`Grade ${i + 1}`}>
                    Grade {i + 1}
                  </option>
                ))}
                <option value="Grade 11 - ABM">Grade 11 - ABM</option>
                <option value="Grade 11 - STEM">Grade 11 - STEM</option>
                <option value="Grade 11 - HUMSS">Grade 11 - HUMSS</option>
                <option value="Grade 11 - GAS">Grade 11 - GAS</option>
                <option value="Grade 12 - ABM">Grade 12 - ABM</option>
                <option value="Grade 12 - STEM">Grade 12 - STEM</option>
                <option value="Grade 12 - HUMSS">Grade 12 - HUMSS</option>
                <option value="Grade 12 - GAS">Grade 12 - GAS</option>
              </select>
              {fieldErrors.grade_level && (
                <p className="field-error">{fieldErrors.grade_level}</p>
              )}
            </div>
          </div>

          <div className="form-row three-columns">
            <div className="form-group">
              <label>Family Name:</label>
              <input
                type="text"
                name="family_name"
                placeholder="Family Name"
                value={formData.family_name}
                onChange={handleChange}
                className={fieldErrors.family_name ? "input-error" : ""}
                required
              />
              {fieldErrors.family_name && (
                <p className="field-error">{fieldErrors.family_name}</p>
              )}
            </div>
            <div className="form-group">
              <label>Given Name:</label>
              <input
                type="text"
                name="given_name"
                placeholder="Given Name"
                value={formData.given_name}
                onChange={handleChange}
                className={fieldErrors.given_name ? "input-error" : ""}
                required
              />
              {fieldErrors.given_name && (
                <p className="field-error">{fieldErrors.given_name}</p>
              )}
            </div>
            <div className="form-group">
              <label>Middle Name:</label>
              <input
                type="text"
                name="middle_name"
                placeholder="Middle Name"
                value={formData.middle_name}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row three-columns">
            <div className="form-group">
              <label>Date of Birth:</label>
              <input
                type="date"
                name="date_of_birth"
                value={formData.date_of_birth}
                onChange={handleChange}
                className={fieldErrors.date_of_birth ? "input-error" : ""}
                required
              />
              {fieldErrors.date_of_birth && (
                <p className="field-error">{fieldErrors.date_of_birth}</p>
              )}
            </div>
            <div className="form-group">
              <label>Place of Birth:</label>
              <input
                type="text"
                name="place_of_birth"
                placeholder="Place of Birth (optional)"
                value={formData.place_of_birth}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label>Gender:</label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className={fieldErrors.gender ? "input-error" : ""}
                required
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
              </select>
              {fieldErrors.gender && (
                <p className="field-error">{fieldErrors.gender}</p>
              )}
            </div>
          </div>

          <h2 className="section-title">Parent/Guardian Information</h2>

          <div className="form-row parent-row">
            <div className="form-group parent-name">
              <label>Father's Name:</label>
              <input
                type="text"
                name="father_name"
                placeholder="Full Name (N/A if not applicable)"
                value={formData.father_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group parent-occupation">
              <label>Occupation:</label>
              <input
                type="text"
                name="father_occupation"
                placeholder="Occupation (N/A if not applicable)"
                value={formData.father_occupation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Educational Attainment:</label>
              <select
                name="father_education"
                value={formData.father_education}
                onChange={handleChange}
              >
                <option value="">Select Educational Attainment</option>
                <option value="Not Applicable">N/A</option>
                <option value="High School Graduate">High School Graduate</option>
                <option value="College Graduate">College Graduate</option>
                <option value="Vocational/Technical">Vocational/Technical</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contact No.:</label>
              <input
                type="tel"
                name="father_contact"
                placeholder="09XXXXXXXXX (optional)"
                value={formData.father_contact}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row parent-row">
            <div className="form-group parent-name">
              <label>Mother's Name:</label>
              <input
                type="text"
                name="mother_name"
                placeholder="Full Name (N/A if not applicable)"
                value={formData.mother_name}
                onChange={handleChange}
              />
            </div>
            <div className="form-group parent-occupation">
              <label>Occupation:</label>
              <input
                type="text"
                name="mother_occupation"
                placeholder="Occupation (N/A if not applicable)"
                value={formData.mother_occupation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Educational Attainment:</label>
              <select
                name="mother_education"
                value={formData.mother_education}
                onChange={handleChange}
              >
                <option value="">Select Educational Attainment</option>
                <option value="Not Applicable">N/A</option>
                <option value="High School Graduate">High School Graduate</option>
                <option value="College Graduate">College Graduate</option>
                <option value="Vocational/Technical">Vocational/Technical</option>
                <option value="Postgraduate">Postgraduate</option>
              </select>
            </div>
            <div className="form-group">
              <label>Contact No.:</label>
              <input
                type="tel"
                name="mother_contact"
                placeholder="09XXXXXXXXX (optional)"
                value={formData.mother_contact}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>

        <button className="next-btn" onClick={handleNext}>
          Next
        </button>
      </div>
    </section>
  );
}