import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaCheckCircle } from "react-icons/fa";
import { supabase } from "../supabase";
import "./EnrollStep2.css";

export default function EnrollStep2() {
  const navigate = useNavigate();

  const [files, setFiles] = useState({
    birthCert: null,
    reportCard: null,
    picture: null,
    parentId: null,
  });

  const [paymentMode, setPaymentMode] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step1Data, setStep1Data] = useState(null);

  useEffect(() => {
    const savedStep1 = localStorage.getItem("enrollment_step1");
    if (savedStep1) {
      setStep1Data(JSON.parse(savedStep1));
    }
  }, []);

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getTuitionAmount = (gradeLevel) => {
    const normalizedGrade = normalizeText(gradeLevel);

    const tuitionMap = {
      nursery: 8000,
      kindergarten: 9000,
      kinder: 9000,
      "grade 1": 12000,
      "grade 2": 12500,
      "grade 3": 13000,
      "grade 4": 13500,
      "grade 5": 14000,
      "grade 6": 14500,
      "grade 7": 16000,
      "grade 8": 16500,
      "grade 9": 17000,
      "grade 10": 17500,
      "grade 11 - abm": 19500,
      "grade 11 - stem": 21000,
      "grade 11 - humss": 19000,
      "grade 11 - gas": 18000,
      "grade 12 - abm": 20000,
      "grade 12 - stem": 21500,
      "grade 12 - humss": 19500,
      "grade 12 - gas": 18500,
    };

    return tuitionMap[normalizedGrade] || 0;
  };

  const tuitionFee = getTuitionAmount(step1Data?.grade_level);

  const getPaymentBreakdown = () => {
    if (!tuitionFee || !paymentMode) return "Please select a payment mode.";

    if (paymentMode === "Cash") {
      return `Full payment: ₱${tuitionFee.toLocaleString()}`;
    }

    if (paymentMode === "Semestral") {
      return `2 payments of ₱${(tuitionFee / 2).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (paymentMode === "Quarterly") {
      return `4 payments of ₱${(tuitionFee / 4).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    if (paymentMode === "Monthly") {
      return `10 payments of ₱${(tuitionFee / 10).toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })}`;
    }

    return "-";
  };

  const handleFileChange = (e, key) => {
    if (e.target.files.length > 0) {
      setFiles((prev) => ({ ...prev, [key]: e.target.files[0] }));
    } else {
      setFiles((prev) => ({ ...prev, [key]: null }));
    }

    setFieldErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
  };

  const handlePaymentChange = (e) => {
    setPaymentMode(e.target.value);

    setFieldErrors((prev) => ({
      ...prev,
      payment: "",
    }));
  };

  const validateForm = () => {
    const errors = {};

    if (!files.birthCert) {
      errors.birthCert = "Birth Certificate is required.";
    }

    if (!files.reportCard) {
      errors.reportCard = "Report Card is required.";
    }

    if (!files.picture) {
      errors.picture = "1x1 Picture is required.";
    }

    if (!files.parentId) {
      errors.parentId = "Valid ID of Parent is required.";
    }

    if (!paymentMode) {
      errors.payment = "Please select a mode of payment.";
    }

    return errors;
  };

  const focusFirstInvalidField = (errors) => {
    const fieldOrder = [
      "birthCert",
      "reportCard",
      "picture",
      "parentId",
      "payment",
    ];

    const firstErrorField = fieldOrder.find((field) => errors[field]);

    if (!firstErrorField) return;

    const selectorMap = {
      birthCert: "#birth-cert",
      reportCard: "#report-card",
      picture: "#picture",
      parentId: "#parent-id",
      payment: 'input[name="payment"]',
    };

    const element = document.querySelector(selectorMap[firstErrorField]);
    if (element) {
      element.focus();
      element.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const uploadFile = async (file, folder) => {
    if (!file) return null;

    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("enrollment-files")
      .upload(filePath, file);

    if (error) throw error;

    return filePath;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      focusFirstInvalidField(errors);
      return;
    }

    setLoading(true);

    try {
      const savedStep1 = localStorage.getItem("enrollment_step1");
      const savedUser = localStorage.getItem("user");

      if (!savedStep1) {
        alert("Step 1 data not found.");
        setLoading(false);
        return;
      }

      const step1 = JSON.parse(savedStep1);
      const currentUser = savedUser ? JSON.parse(savedUser) : null;

      if (!currentUser?.id) {
        alert("User session not found. Please log in again.");
        setLoading(false);
        return;
      }

      const { data: existingRequest, error: existingError } = await supabase
        .from("enrollment_requests")
        .select("id, status")
        .eq("user_id", currentUser.id)
        .in("status", ["pending", "in_review", "approved"])
        .maybeSingle();

      if (existingError) throw existingError;

      if (existingRequest) {
        alert(`Your enrollment request is still ${existingRequest.status}.`);
        setLoading(false);
        return;
      }

      const birthCertPath = await uploadFile(files.birthCert, "birth-cert");
      const reportCardPath = await uploadFile(files.reportCard, "report-card");
      const picturePath = await uploadFile(files.picture, "picture");
      const parentIdPath = await uploadFile(files.parentId, "parent-id");

      const { error: enrollmentError } = await supabase
        .from("enrollment_requests")
        .insert([
          {
            user_id: currentUser.id,
            enrollment_date: step1.enrollment_date,
            school_year: step1.school_year,
            grade_level: step1.grade_level,
            family_name: step1.family_name,
            given_name: step1.given_name,
            middle_name: step1.middle_name,
            date_of_birth: step1.date_of_birth,
            place_of_birth: step1.place_of_birth,
            gender: step1.gender,
            father_name: step1.father_name,
            father_occupation: step1.father_occupation,
            father_education: step1.father_education,
            father_contact: step1.father_contact,
            mother_name: step1.mother_name,
            mother_occupation: step1.mother_occupation,
            mother_education: step1.mother_education,
            mother_contact: step1.mother_contact,
            payment_mode: paymentMode,
            status: "pending",
            birth_cert_path: birthCertPath,
            report_card_path: reportCardPath,
            picture_path: picturePath,
            parent_id_path: parentIdPath,
          },
        ]);

      if (enrollmentError) throw enrollmentError;

      const { error: profileError } = await supabase
        .from("student_profiles")
        .upsert(
          [
            {
              user_id: currentUser.id,
              academic_level: step1.grade_level,
              school_year: step1.school_year,
              status: "pending",
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "user_id" }
        );

      if (profileError) throw profileError;

      localStorage.removeItem("enrollment_step1");
      setShowModal(true);
    } catch (error) {
      console.error("Enrollment submit error:", error);
      alert(error.message || "Failed to submit enrollment.");
    }

    setLoading(false);
  };

  const handleBackHome = () => {
    setShowModal(false);
    navigate("/");
  };

  return (
    <section className="hero">
      <button className="back-btn top-left" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="hero-content enrollment-form">
        <h1>Enrollment Form</h1>

        <form className="form-container" onSubmit={handleSubmit}>
          <h2 className="section-title">Required Documents (Image/File)</h2>

          <div className="form-row">
            <div className="form-group">
              <label>Birth Certificate:</label>
              <input
                type="file"
                id="birth-cert"
                onChange={(e) => handleFileChange(e, "birthCert")}
                accept=".pdf,.jpg,.png"
                className={fieldErrors.birthCert ? "input-error" : ""}
              />
              <label htmlFor="birth-cert" className="file-label">
                Choose File
              </label>
              {files.birthCert && (
                <span className="file-name">{files.birthCert.name}</span>
              )}
              {fieldErrors.birthCert && (
                <p className="field-error">{fieldErrors.birthCert}</p>
              )}
            </div>

            <div className="form-group">
              <label>Report Card:</label>
              <input
                type="file"
                id="report-card"
                onChange={(e) => handleFileChange(e, "reportCard")}
                accept=".pdf,.jpg,.png"
                className={fieldErrors.reportCard ? "input-error" : ""}
              />
              <label htmlFor="report-card" className="file-label">
                Choose File
              </label>
              {files.reportCard && (
                <span className="file-name">{files.reportCard.name}</span>
              )}
              {fieldErrors.reportCard && (
                <p className="field-error">{fieldErrors.reportCard}</p>
              )}
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>1x1 Picture:</label>
              <input
                type="file"
                id="picture"
                onChange={(e) => handleFileChange(e, "picture")}
                accept=".jpg,.png"
                className={fieldErrors.picture ? "input-error" : ""}
              />
              <label htmlFor="picture" className="file-label">
                Choose File
              </label>
              {files.picture && (
                <span className="file-name">{files.picture.name}</span>
              )}
              {fieldErrors.picture && (
                <p className="field-error">{fieldErrors.picture}</p>
              )}
            </div>

            <div className="form-group">
              <label>Valid ID of Parent:</label>
              <input
                type="file"
                id="parent-id"
                onChange={(e) => handleFileChange(e, "parentId")}
                accept=".pdf,.jpg,.png"
                className={fieldErrors.parentId ? "input-error" : ""}
              />
              <label htmlFor="parent-id" className="file-label">
                Choose File
              </label>
              {files.parentId && (
                <span className="file-name">{files.parentId.name}</span>
              )}
              {fieldErrors.parentId && (
                <p className="field-error">{fieldErrors.parentId}</p>
              )}
            </div>
          </div>

          <h2 className="section-title">Mode of Payment</h2>
          <div className="form-row">
            <div className="form-group">
              <div
                className={`payment-options ${
                  fieldErrors.payment ? "payment-error" : ""
                }`}
              >
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="Cash"
                    checked={paymentMode === "Cash"}
                    onChange={handlePaymentChange}
                  />
                  Cash
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="Semestral"
                    checked={paymentMode === "Semestral"}
                    onChange={handlePaymentChange}
                  />
                  Semestral
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="Quarterly"
                    checked={paymentMode === "Quarterly"}
                    onChange={handlePaymentChange}
                  />
                  Quarterly
                </label>
                <label>
                  <input
                    type="radio"
                    name="payment"
                    value="Monthly"
                    checked={paymentMode === "Monthly"}
                    onChange={handlePaymentChange}
                  />
                  Monthly
                </label>
              </div>
              {fieldErrors.payment && (
                <p className="field-error">{fieldErrors.payment}</p>
              )}
            </div>
          </div>

          <div className="tuition-preview">
            <h3>Tuition Fee Preview</h3>
            <p>
              <strong>Grade Level:</strong> {step1Data?.grade_level || "-"}
            </p>
            <p>
              <strong>Total Tuition Fee:</strong> ₱{tuitionFee.toLocaleString()}
            </p>
            <p>
              <strong>Payment Mode:</strong> {paymentMode || "-"}
            </p>
            <p>
              <strong>Breakdown:</strong> {getPaymentBreakdown()}
            </p>
            <small>
              The total tuition fee stays the same. Only the payment breakdown
              changes based on the selected payment mode.
            </small>
          </div>

          <button className="next-btn" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit"}
          </button>
        </form>
      </div>

      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <FaCheckCircle className="modal-icon" />
            <h2>Submission Successful!</h2>
            <p>
              Thank you for your submission. We have received your information
              and will process it shortly. Kindly check your profile for further
              updates.
            </p>
            <button className="modal-btn" onClick={handleBackHome}>
              Back Home
            </button>
          </div>
        </div>
      )}
    </section>
  );
}