import { useEffect, useMemo, useState } from "react";
import "./Profile.css";
import { supabase } from "../supabase";

export default function Profile() {
  const [user, setUser] = useState(null);
  const [studentInfo, setStudentInfo] = useState(null);
  const [latestEnrollment, setLatestEnrollment] = useState(null);
  const [payables, setPayables] = useState([]);
  const [profileImageSrc, setProfileImageSrc] = useState("");

  const [showEditPopup, setShowEditPopup] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState("");

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");

  const [editForm, setEditForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const showMessage = (text, type = "success") => {
    setMessage(text);
    setMessageType(type);

    setTimeout(() => {
      setMessage("");
      setMessageType("");
    }, 2500);
  };

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));

    if (savedUser) {
      setUser(savedUser);
      fetchAllData(savedUser.id, savedUser);
    } else {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user?.id) return;

    const handleRefresh = () => {
      fetchAllData(user.id, user);
    };

    window.addEventListener("focus", handleRefresh);

    return () => {
      window.removeEventListener("focus", handleRefresh);
    };
  }, [user]);

  useEffect(() => {
    resolveProfileImage(studentInfo?.image_url);
  }, [studentInfo?.image_url]);

  const resolveProfileImage = async (imageValue) => {
    if (!imageValue) {
      setProfileImageSrc("");
      return;
    }

    if (
      String(imageValue).startsWith("http://") ||
      String(imageValue).startsWith("https://")
    ) {
      setProfileImageSrc(imageValue);
      return;
    }

    const { data, error } = await supabase.storage
      .from("enrollment-files")
      .createSignedUrl(imageValue, 300);

    if (error) {
      console.error("Profile image signed URL error:", error);
      setProfileImageSrc("");
      return;
    }

    setProfileImageSrc(data?.signedUrl || "");
  };

  const fetchAllData = async (userId, savedUser) => {
    try {
      setLoading(true);

      const [profileData, enrollmentData] = await Promise.all([
        fetchStudentProfile(userId, savedUser),
        fetchLatestEnrollment(userId),
      ]);

      await fetchPayables(userId, enrollmentData?.status || "");
      await resolveProfileImage(profileData?.image_url || "");
    } catch (err) {
      console.error(err);
      showMessage("Failed to load profile data.", "error");
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentProfile = async (userId, savedUser) => {
    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Profile fetch error:", error);
      return null;
    }

    if (data) {
      setStudentInfo(data);
      return data;
    } else {
      const fallback = {
        full_name: savedUser?.full_name || "",
        lrn: "",
        academic_level: "",
        section: "",
        school_year: "",
        status: "",
        image_url: "",
      };

      setStudentInfo(fallback);
      return fallback;
    }
  };

  const fetchLatestEnrollment = async (userId) => {
    const { data, error } = await supabase
      .from("enrollment_requests")
      .select("*")
      .eq("user_id", userId)
      .order("id", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Enrollment fetch error:", error);
      return null;
    }

    setLatestEnrollment(data || null);
    return data || null;
  };

  const fetchPayables = async (userId, enrollmentStatus = "") => {
    const normalizedStatus = String(enrollmentStatus).toLowerCase().trim();

    if (normalizedStatus !== "approved") {
      setPayables([]);
      return;
    }

    const { data, error } = await supabase
      .from("student_payables")
      .select("*")
      .eq("user_id", userId)
      .order("installment_no", { ascending: true });

    if (error) {
      console.error("Payables fetch error:", error);
      setPayables([]);
      return;
    }

    setPayables(data || []);
  };

  const openEditPopup = () => {
    setEditForm({
      current_password: "",
      new_password: "",
      confirm_password: "",
    });
    setShowEditPopup(true);
  };

  const closeEditPopup = () => {
    setShowEditPopup(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!user) return;

    if (
      editForm.current_password ||
      editForm.new_password ||
      editForm.confirm_password
    ) {
      if (editForm.current_password !== user.password) {
        showMessage("Current password is incorrect.", "error");
        return;
      }

      if (editForm.new_password !== editForm.confirm_password) {
        showMessage("New passwords do not match.", "error");
        return;
      }

      if (editForm.new_password && editForm.new_password.length < 6) {
        showMessage("New password must be at least 6 characters.", "error");
        return;
      }
    }

    try {
      setSaving(true);

      if (editForm.new_password) {
        const { error: passwordError } = await supabase
          .from("users")
          .update({ password: editForm.new_password })
          .eq("id", user.id);

        if (passwordError) {
          console.error(passwordError);
          showMessage("Failed to update password.", "error");
          return;
        }

        const updatedUser = { ...user, password: editForm.new_password };
        setUser(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      }

      await fetchStudentProfile(user.id, user);
      setShowEditPopup(false);
      showMessage("Profile updated successfully.", "success");
    } catch (err) {
      console.error(err);
      showMessage("Something went wrong while saving changes.", "error");
    } finally {
      setSaving(false);
    }
  };

  const uploadRequirementFile = async (file, folder) => {
    const fileExt = file.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random()
      .toString(36)
      .slice(2)}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error } = await supabase.storage
      .from("enrollment-files")
      .upload(filePath, file, { upsert: true });

    if (error) throw error;
    return filePath;
  };

  const handleRequirementUpload = async (e, config) => {
    const file = e.target.files?.[0];
    if (!file || !user || !latestEnrollment?.id) return;

    try {
      setUploadingKey(config.key);

      const uploadedPath = await uploadRequirementFile(file, config.folder);

      const payload = {
        [config.pathField]: uploadedPath,
        [config.needField]: false,
        [config.remarksField]: "Resubmitted. Awaiting review.",
        status: "in_review",
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("enrollment_requests")
        .update(payload)
        .eq("id", latestEnrollment.id)
        .eq("user_id", user.id);

      if (error) throw error;

      const { error: profileError } = await supabase
        .from("student_profiles")
        .update({
          status: "in_review",
          updated_at: new Date().toISOString(),
          section: null,
          lrn: null,
          image_url: null,
        })
        .eq("user_id", user.id);

      if (profileError) {
        console.error(profileError);
      }

      await Promise.all([
        fetchLatestEnrollment(user.id),
        fetchStudentProfile(user.id, user),
      ]);

      setPayables([]);
      setProfileImageSrc("");

      showMessage(`${config.label} uploaded successfully.`, "success");
    } catch (err) {
      console.error(err);
      showMessage("Failed to upload file.", "error");
    } finally {
      setUploadingKey("");
      if (e.target) {
        e.target.value = "";
      }
    }
  };

  const getStatusClass = (status = "") => {
    const s = String(status).toLowerCase().trim();

    if (
      s.includes("approved") ||
      s.includes("uploaded") ||
      s.includes("complete") ||
      s.includes("verified")
    ) {
      return "uploaded";
    }

    if (
      s.includes("pending") ||
      s.includes("missing") ||
      s.includes("resubmit") ||
      s.includes("reupload") ||
      s.includes("re-upload") ||
      s.includes("in_review") ||
      s.includes("needs_revision")
    ) {
      return "pending";
    }

    if (s === "-" || s.includes("rejected")) {
      return "";
    }

    return "";
  };

  const getRequirementDisplay = ({
    enrollmentStatus,
    filePath,
    needUpload,
    remarks,
  }) => {
    if (enrollmentStatus === "rejected") {
      return {
        status: "-",
        remarks: "-",
        needUpload: false,
      };
    }

    if (needUpload) {
      return {
        status: "Pending",
        remarks: remarks?.trim() || "Please upload again.",
        needUpload: true,
      };
    }

    if (enrollmentStatus === "approved" && filePath) {
      return {
        status: "Approved",
        remarks: remarks?.trim() || "-",
        needUpload: false,
      };
    }

    if (filePath) {
      return {
        status: "Uploaded",
        remarks: remarks?.trim() || "-",
        needUpload: false,
      };
    }

    return {
      status: "Pending",
      remarks: remarks?.trim() || "-",
      needUpload: false,
    };
  };

  const requirementRows = useMemo(() => {
    if (!latestEnrollment) return [];

    const enrollmentStatus = latestEnrollment.status || "";

    const birthCertDisplay = getRequirementDisplay({
      enrollmentStatus,
      filePath: latestEnrollment.birth_cert_path,
      needUpload: latestEnrollment.need_birth_cert_upload === true,
      remarks: latestEnrollment.birth_cert_remarks,
    });

    const reportCardDisplay = getRequirementDisplay({
      enrollmentStatus,
      filePath: latestEnrollment.report_card_path,
      needUpload: latestEnrollment.need_report_card_upload === true,
      remarks: latestEnrollment.report_card_remarks,
    });

    const pictureDisplay = getRequirementDisplay({
      enrollmentStatus,
      filePath: latestEnrollment.picture_path,
      needUpload: latestEnrollment.need_picture_upload === true,
      remarks: latestEnrollment.picture_remarks,
    });

    const parentIdDisplay = getRequirementDisplay({
      enrollmentStatus,
      filePath: latestEnrollment.parent_id_path,
      needUpload: latestEnrollment.need_parent_id_upload === true,
      remarks: latestEnrollment.parent_id_remarks,
    });

    return [
      {
        key: "birth_cert",
        label: "Birth Certificate",
        value: latestEnrollment.birth_cert_path,
        status: birthCertDisplay.status,
        remarks: birthCertDisplay.remarks,
        needUpload: birthCertDisplay.needUpload,
        pathField: "birth_cert_path",
        remarksField: "birth_cert_remarks",
        needField: "need_birth_cert_upload",
        folder: "birth-cert",
      },
      {
        key: "report_card",
        label: "Report Card",
        value: latestEnrollment.report_card_path,
        status: reportCardDisplay.status,
        remarks: reportCardDisplay.remarks,
        needUpload: reportCardDisplay.needUpload,
        pathField: "report_card_path",
        remarksField: "report_card_remarks",
        needField: "need_report_card_upload",
        folder: "report-card",
      },
      {
        key: "picture",
        label: "1x1 Picture",
        value: latestEnrollment.picture_path,
        status: pictureDisplay.status,
        remarks: pictureDisplay.remarks,
        needUpload: pictureDisplay.needUpload,
        pathField: "picture_path",
        remarksField: "picture_remarks",
        needField: "need_picture_upload",
        folder: "picture",
      },
      {
        key: "parent_id",
        label: "Valid ID of Parent",
        value: latestEnrollment.parent_id_path,
        status: parentIdDisplay.status,
        remarks: parentIdDisplay.remarks,
        needUpload: parentIdDisplay.needUpload,
        pathField: "parent_id_path",
        remarksField: "parent_id_remarks",
        needField: "need_parent_id_upload",
        folder: "parent-id",
      },
    ];
  }, [latestEnrollment]);

  if (loading) {
    return <div className="profile-page">Loading profile...</div>;
  }

  if (!user) {
    return <div className="profile-page">No logged-in user found.</div>;
  }

  const displayName =
    studentInfo?.full_name ||
    [
      latestEnrollment?.given_name,
      latestEnrollment?.middle_name,
      latestEnrollment?.family_name,
    ]
      .filter(Boolean)
      .join(" ") ||
    user?.full_name ||
    "-";

  const displayLrn = studentInfo?.lrn || "-";
  const displaySection = studentInfo?.section || "-";
  const displayAcademicLevel =
    studentInfo?.academic_level || latestEnrollment?.grade_level || "-";
  const displaySchoolYear =
    studentInfo?.school_year || latestEnrollment?.school_year || "-";
  const displayStatus = latestEnrollment?.status || studentInfo?.status || "-";

  const displayAcademicAssignment =
    displayAcademicLevel !== "-" && displaySection !== "-"
      ? `${displayAcademicLevel} - ${displaySection}`
      : displayAcademicLevel !== "-"
      ? displayAcademicLevel
      : displaySection !== "-"
      ? displaySection
      : "-";

  const isApproved = latestEnrollment?.status === "approved";
  const hasSection = !!studentInfo?.section;
  const hasLrn = !!studentInfo?.lrn;
  const isFullyEnrolled = isApproved && hasSection && hasLrn;

  return (
    <div className="profile-page">
      {message && (
        <div className={`profile-message ${messageType}`}>
          {message}
        </div>
      )}

      <div className="profile-content full-width-content">
        <h1>Student Profile</h1>

        {latestEnrollment && (
          <div
            className={`enrollment-summary-card ${
              isFullyEnrolled
                ? "summary-approved"
                : latestEnrollment.status === "in_review"
                ? "summary-review"
                : latestEnrollment.status === "pending"
                ? "summary-pending"
                : latestEnrollment.status === "approved"
                ? "summary-approved"
                : "summary-default"
            }`}
          >
            {isFullyEnrolled ? (
              <>
                <h2>Enrollment Completed</h2>
                <p>
                  You are officially enrolled for <strong>{displaySchoolYear}</strong>.
                </p>
                <p className="summary-note">
                  Your academic assignment is{" "}
                  <strong>{displayAcademicAssignment}</strong>.
                </p>
              </>
            ) : latestEnrollment.status === "approved" ? (
              <>
                <h2>Enrollment Approved</h2>
                <p>Your enrollment request has been approved by the school.</p>
                <p className="summary-note">
                  Please wait while your section and LRN are being finalized.
                </p>
              </>
            ) : latestEnrollment.status === "in_review" ? (
              <>
                <h2>Enrollment Under Review</h2>
                <p>
                  Your enrollment request is currently being reviewed by the
                  school administration.
                </p>
                <p className="summary-note">
                  Please wait for updates regarding your submitted requirements.
                </p>
              </>
            ) : latestEnrollment.status === "pending" ? (
              <>
                <h2>Enrollment Submitted</h2>
                <p>Your enrollment request has been submitted successfully.</p>
                <p className="summary-note">
                  Please wait for the school to begin reviewing your application.
                </p>
              </>
            ) : latestEnrollment.status === "rejected" ? (
              <>
                <h2>Enrollment Rejected</h2>
                <p>Your enrollment request was not approved.</p>
                <p className="summary-note">
                  Please contact the school for further clarification.
                </p>
              </>
            ) : (
              <>
                <h2>Enrollment Status</h2>
                <p>Your enrollment information is being processed.</p>
              </>
            )}
          </div>
        )}

        <div className="profile-section student-info">
          <h2>Student Information</h2>

          <div className="info-card student-card">
            <div className="student-main-info">
              <div className="student-image-wrap">
                {profileImageSrc ? (
                  <img
                    src={profileImageSrc}
                    alt="Student"
                    className="student-img"
                  />
                ) : (
                  <div className="student-img student-img-placeholder">
                    No Image
                  </div>
                )}
              </div>

              <div className="info-details">
                <div className="row">
                  <div>
                    <strong>Name:</strong> {displayName}
                  </div>
                  <div>
                    <strong>LRN:</strong> {displayLrn}
                  </div>
                </div>

                <div className="row">
                  <div>
                    <strong>Academic Level:</strong> {displayAcademicLevel}
                  </div>
                  <div>
                    <strong>Section:</strong> {displaySection}
                  </div>
                </div>

                <div className="row">
                  <div>
                    <strong>School Year:</strong> {displaySchoolYear}
                  </div>
                  <div>
                    <strong>Status:</strong>{" "}
                    <span className={getStatusClass(displayStatus)}>
                      {String(displayStatus).replaceAll("_", " ")}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="student-card-actions">
              <button className="edit-profile-btn" onClick={openEditPopup}>
                Edit Profile
              </button>
            </div>
          </div>
        </div>

        <div className="profile-section">
          <h2>Enrollment Information</h2>

          {latestEnrollment?.status === "rejected" && (
            <p className="admin-helper-text">
              This enrollment request was rejected. Please contact the school or
              submit a new application if allowed.
            </p>
          )}

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Requirements</th>
                  <th>Status</th>
                  <th>Remarks</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {requirementRows.length > 0 ? (
                  requirementRows.map((item) => (
                    <tr key={item.key}>
                      <td>{item.label}</td>
                      <td className={getStatusClass(item.status)}>
                        {item.status}
                      </td>
                      <td>{item.remarks || "-"}</td>
                      <td>
                        {item.needUpload ? (
                          <label className="upload-btn">
                            {uploadingKey === item.key ? "Uploading..." : "Upload"}
                            <input
                              type="file"
                              style={{ display: "none" }}
                              accept=".pdf,.jpg,.jpeg,.png"
                              disabled={uploadingKey === item.key}
                              onChange={(e) => handleRequirementUpload(e, item)}
                            />
                          </label>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="empty-cell">
                      No enrollment submission found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="profile-section">
          <h2>Enrollment Payables</h2>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Particulars</th>
                  <th>Amount Due</th>
                  <th>Remarks</th>
                </tr>
              </thead>
              <tbody>
                {latestEnrollment?.status !== "approved" ? (
                  <tr>
                    <td colSpan="3" className="empty-cell">
                      Payables will appear only after the enrollment is approved.
                    </td>
                  </tr>
                ) : payables.length > 0 ? (
                  payables.map((item) => (
                    <tr key={item.id}>
                      <td>{item.particulars || "-"}</td>
                      <td>
                        {item.amount_due !== null && item.amount_due !== undefined
                          ? `₱${Number(item.amount_due).toLocaleString()}`
                          : "-"}
                      </td>
                      <td>{item.remarks || "-"}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="empty-cell">
                      No payables found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showEditPopup && (
        <div className="popup-overlay">
          <div className="popup-box profile-popup">
            <h2>Edit Profile</h2>
            <p>You may update your password here.</p>

            <form onSubmit={handleSave}>
              <input
                type="password"
                name="current_password"
                placeholder="Current Password"
                value={editForm.current_password}
                onChange={handleChange}
              />

              <input
                type="password"
                name="new_password"
                placeholder="New Password"
                value={editForm.new_password}
                onChange={handleChange}
              />

              <input
                type="password"
                name="confirm_password"
                placeholder="Confirm New Password"
                value={editForm.confirm_password}
                onChange={handleChange}
              />

              <div className="popup-buttons">
                <button type="submit" className="submit-btn" disabled={saving}>
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  type="button"
                  className="cancel-btn"
                  onClick={closeEditPopup}
                  disabled={saving}
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