import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "../../supabase";

export default function AdminEnrollmentDetails() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [record, setRecord] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [fileUrls, setFileUrls] = useState({
    birth_cert_path: null,
    report_card_path: null,
    picture_path: null,
    parent_id_path: null,
  });

  const [remarks, setRemarks] = useState({
    birth_cert: "",
    report_card: "",
    picture: "",
    parent_id: "",
  });

  const [needsUpload, setNeedsUpload] = useState({
    birth_cert: false,
    report_card: false,
    picture: false,
    parent_id: false,
  });

  const [assignment, setAssignment] = useState({
    section: "",
    lrn: "",
  });

  useEffect(() => {
    fetchRecord();
  }, [id]);

  const createSignedFileUrl = async (path) => {
    if (!path) return null;

    const { data, error } = await supabase.storage
      .from("enrollment-files")
      .createSignedUrl(path, 300);

    if (error) {
      console.error("Error creating signed URL:", path, error);
      return null;
    }

    return data.signedUrl;
  };

  const fetchStudentProfile = async (userId) => {
    if (!userId) return null;

    const { data, error } = await supabase
      .from("student_profiles")
      .select("*")
      .eq("user_id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching student profile:", error);
      return null;
    }

    return data || null;
  };

  const fetchRecord = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("enrollment_requests")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        console.error("Error fetching enrollment details:", error);
        return;
      }

      setRecord(data);

      const profile = await fetchStudentProfile(data.user_id);

      setRemarks({
        birth_cert: data.birth_cert_remarks || "",
        report_card: data.report_card_remarks || "",
        picture: data.picture_remarks || "",
        parent_id: data.parent_id_remarks || "",
      });

      setNeedsUpload({
        birth_cert: data.need_birth_cert_upload || false,
        report_card: data.need_report_card_upload || false,
        picture: data.need_picture_upload || false,
        parent_id: data.need_parent_id_upload || false,
      });

      setAssignment({
        section: profile?.section || "",
        lrn: profile?.lrn || "",
      });

      const [birthUrl, reportUrl, pictureUrl, parentIdUrl] = await Promise.all([
        createSignedFileUrl(data.birth_cert_path),
        createSignedFileUrl(data.report_card_path),
        createSignedFileUrl(data.picture_path),
        createSignedFileUrl(data.parent_id_path),
      ]);

      setFileUrls({
        birth_cert_path: birthUrl,
        report_card_path: reportUrl,
        picture_path: pictureUrl,
        parent_id_path: parentIdUrl,
      });
    } catch (err) {
      console.error("Unexpected fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemarkChange = (key, value) => {
    setRemarks((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleNeedUploadChange = (key, checked) => {
    setNeedsUpload((prev) => ({
      ...prev,
      [key]: checked,
    }));
  };

  const handleAssignmentChange = (e) => {
    const { name, value } = e.target;
    setAssignment((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const hasAnyRevisionRequest = () => {
    return (
      needsUpload.birth_cert ||
      needsUpload.report_card ||
      needsUpload.picture ||
      needsUpload.parent_id
    );
  };

  const buildFullName = () => {
    if (!record) return "";
    return [record.given_name, record.middle_name, record.family_name]
      .filter(Boolean)
      .join(" ");
  };

  const normalizeText = (value) =>
    String(value || "")
      .trim()
      .toLowerCase()
      .replace(/\s+/g, " ");

  const getTuitionAmount = () => {
    if (!record) return 0;

    const gradeLevel = normalizeText(record.grade_level);

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

    return tuitionMap[gradeLevel] || 0;
  };

  const buildPayables = (totalTuition) => {
    const paymentMode = normalizeText(record?.payment_mode);

    if (!totalTuition || !record?.user_id) return [];

    const round2 = (value) => Number(value.toFixed(2));

    if (paymentMode === "cash") {
      return [
        {
          user_id: Number(record.user_id),
          particulars: "Full Payment - Cash",
          amount_due: round2(totalTuition),
          payment_mode: "cash",
          installment_no: 1,
          status: "unpaid",
          remarks: "Pending payment",
        },
      ];
    }

    if (paymentMode === "semestral") {
      const amount = round2(totalTuition / 2);
      return [
        {
          user_id: Number(record.user_id),
          particulars: "1st Semester Payment",
          amount_due: amount,
          payment_mode: "semestral",
          installment_no: 1,
          status: "unpaid",
          remarks: "Pending payment",
        },
        {
          user_id: Number(record.user_id),
          particulars: "2nd Semester Payment",
          amount_due: amount,
          payment_mode: "semestral",
          installment_no: 2,
          status: "unpaid",
          remarks: "Pending payment",
        },
      ];
    }

    if (paymentMode === "quarterly") {
      const amount = round2(totalTuition / 4);
      return [
        {
          user_id: Number(record.user_id),
          particulars: "1st Quarter Payment",
          amount_due: amount,
          payment_mode: "quarterly",
          installment_no: 1,
          status: "unpaid",
          remarks: "Pending payment",
        },
        {
          user_id: Number(record.user_id),
          particulars: "2nd Quarter Payment",
          amount_due: amount,
          payment_mode: "quarterly",
          installment_no: 2,
          status: "unpaid",
          remarks: "Pending payment",
        },
        {
          user_id: Number(record.user_id),
          particulars: "3rd Quarter Payment",
          amount_due: amount,
          payment_mode: "quarterly",
          installment_no: 3,
          status: "unpaid",
          remarks: "Pending payment",
        },
        {
          user_id: Number(record.user_id),
          particulars: "4th Quarter Payment",
          amount_due: amount,
          payment_mode: "quarterly",
          installment_no: 4,
          status: "unpaid",
          remarks: "Pending payment",
        },
      ];
    }

    if (paymentMode === "monthly") {
      const amount = round2(totalTuition / 10);
      return Array.from({ length: 10 }, (_, index) => ({
        user_id: Number(record.user_id),
        particulars: `Month ${index + 1} Payment`,
        amount_due: amount,
        payment_mode: "monthly",
        installment_no: index + 1,
        status: "unpaid",
        remarks: "Pending payment",
      }));
    }

    return [
      {
        user_id: Number(record.user_id),
        particulars: "Full Payment",
        amount_due: round2(totalTuition),
        payment_mode: record?.payment_mode || "full",
        installment_no: 1,
        status: "unpaid",
        remarks: "Pending payment",
      },
    ];
  };

  const clearStudentPayables = async () => {
    if (!record?.user_id) {
      return { error: new Error("Missing user_id") };
    }

    const { error } = await supabase
      .from("student_payables")
      .delete()
      .eq("user_id", Number(record.user_id));

    return { error };
  };

  const replaceStudentPayables = async () => {
    if (!record?.user_id) return { error: null };

    const tuitionAmount = getTuitionAmount();

    if (!tuitionAmount) {
      return {
        error: {
          message: "No tuition amount found for this grade level/strand.",
        },
      };
    }

    const payableRows = buildPayables(tuitionAmount);

    const { error: deleteError } = await supabase
      .from("student_payables")
      .delete()
      .eq("user_id", Number(record.user_id));

    if (deleteError) {
      return { error: deleteError };
    }

    if (payableRows.length === 0) {
      return { error: null };
    }

    const { error: insertError } = await supabase
      .from("student_payables")
      .insert(payableRows);

    return { error: insertError };
  };

  const saveReviewOnly = async () => {
    try {
      if (saving) return;
      setSaving(true);

      const { error } = await supabase
        .from("enrollment_requests")
        .update({
          birth_cert_remarks: remarks.birth_cert,
          report_card_remarks: remarks.report_card,
          picture_remarks: remarks.picture,
          parent_id_remarks: remarks.parent_id,
          need_birth_cert_upload: needsUpload.birth_cert,
          need_report_card_upload: needsUpload.report_card,
          need_picture_upload: needsUpload.picture,
          need_parent_id_upload: needsUpload.parent_id,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (error) {
        console.error("Error saving review:", error);
        alert("Failed to save review.");
        return;
      }

      alert("Review saved successfully.");
      await fetchRecord();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while saving the review.");
    } finally {
      setSaving(false);
    }
  };

  const syncStudentProfile = async (status) => {
    if (!record?.user_id) return { error: null };

    const payload = {
      user_id: Number(record.user_id),
      full_name: buildFullName(),
      academic_level: record.grade_level || "",
      school_year: record.school_year || "",
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
      payload.section = assignment.section.trim();
      payload.lrn = assignment.lrn.trim();
      payload.image_url = record.picture_path || null;
    } else {
      payload.section = null;
      payload.lrn = null;
      payload.image_url = null;
    }

    const { error } = await supabase
      .from("student_profiles")
      .upsert([payload], { onConflict: "user_id" });

    return { error };
  };

  const shouldClearPayables = (status) => {
    return ["in_review", "needs_revision", "rejected"].includes(status);
  };

  const handleFinalize = async (status) => {
    if (!record || saving) return;

    const anyRevision = hasAnyRevisionRequest();

    if (status === "approved") {
      if (anyRevision) {
        alert(
          "This request still has requirements marked for re-upload. Remove those flags before approving."
        );
        return;
      }

      if (!assignment.section.trim()) {
        alert("Section is required before approving.");
        return;
      }

      if (!assignment.lrn.trim()) {
        alert("LRN is required before approving.");
        return;
      }
    }

    if (status === "needs_revision" && !anyRevision) {
      alert(
        "Mark at least one requirement as needing re-upload before setting Needs Revision."
      );
      return;
    }

    try {
      setSaving(true);

      let updatePayload = {
        status,
        birth_cert_remarks: remarks.birth_cert,
        report_card_remarks: remarks.report_card,
        picture_remarks: remarks.picture,
        parent_id_remarks: remarks.parent_id,
        need_birth_cert_upload: needsUpload.birth_cert,
        need_report_card_upload: needsUpload.report_card,
        need_picture_upload: needsUpload.picture,
        need_parent_id_upload: needsUpload.parent_id,
        updated_at: new Date().toISOString(),
      };

      if (status === "rejected" || status === "in_review") {
        updatePayload = {
          ...updatePayload,
          birth_cert_remarks: "",
          report_card_remarks: "",
          picture_remarks: "",
          parent_id_remarks: "",
          need_birth_cert_upload: false,
          need_report_card_upload: false,
          need_picture_upload: false,
          need_parent_id_upload: false,
        };
      }

      const { error: enrollmentError } = await supabase
        .from("enrollment_requests")
        .update(updatePayload)
        .eq("id", id);

      if (enrollmentError) {
        console.error("Error updating enrollment status:", enrollmentError);
        alert("Failed to update enrollment request.");
        return;
      }

      const { error: profileError } = await syncStudentProfile(status);

      if (profileError) {
        console.error("Error syncing student profile:", profileError);
        alert("Enrollment updated, but failed to sync student profile.");
        return;
      }

      if (status === "approved") {
        const { error: payableError } = await replaceStudentPayables();

        if (payableError) {
          console.error("Error generating payables:", payableError);
          alert(
            `Enrollment approved, but failed to generate payables: ${payableError.message || "Unknown error"}`
          );
          return;
        }
      } else if (shouldClearPayables(status)) {
        const { error: payableDeleteError } = await clearStudentPayables();

        if (payableDeleteError) {
          console.error("Error clearing payables:", payableDeleteError);
          alert("Enrollment updated, but failed to clear payables.");
          return;
        }
      }

      if (status !== "approved") {
        setAssignment({
          section: "",
          lrn: "",
        });
      }

      if (status === "rejected" || status === "in_review") {
        setRemarks({
          birth_cert: "",
          report_card: "",
          picture: "",
          parent_id: "",
        });

        setNeedsUpload({
          birth_cert: false,
          report_card: false,
          picture: false,
          parent_id: false,
        });
      }

      alert(`Enrollment marked as ${status.replaceAll("_", " ")}.`);
      navigate("/admin/enrollments");
    } catch (err) {
      console.error(err);
      alert("Something went wrong while finalizing the enrollment.");
    } finally {
      setSaving(false);
    }
  };

  const handleReopen = async () => {
    if (!record || saving) return;

    try {
      setSaving(true);

      const { error: enrollmentError } = await supabase
        .from("enrollment_requests")
        .update({
          status: "in_review",
          birth_cert_remarks: "",
          report_card_remarks: "",
          picture_remarks: "",
          parent_id_remarks: "",
          need_birth_cert_upload: false,
          need_report_card_upload: false,
          need_picture_upload: false,
          need_parent_id_upload: false,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id);

      if (enrollmentError) {
        console.error("Error reopening enrollment:", enrollmentError);
        alert("Failed to reopen enrollment.");
        return;
      }

      const { error: profileError } = await supabase
        .from("student_profiles")
        .upsert(
          [
            {
              user_id: Number(record.user_id),
              full_name: buildFullName(),
              academic_level: record.grade_level || "",
              school_year: record.school_year || "",
              status: "in_review",
              section: null,
              lrn: null,
              image_url: null,
              updated_at: new Date().toISOString(),
            },
          ],
          { onConflict: "user_id" }
        );

      if (profileError) {
        console.error("Error clearing student profile:", profileError);
        alert("Enrollment reopened, but failed to clear section/LRN/image.");
        return;
      }

      const { error: payableDeleteError } = await clearStudentPayables();

      if (payableDeleteError) {
        console.error("Error clearing payables on reopen:", payableDeleteError);
        alert("Enrollment reopened, but failed to clear payables.");
        return;
      }

      setRemarks({
        birth_cert: "",
        report_card: "",
        picture: "",
        parent_id: "",
      });

      setNeedsUpload({
        birth_cert: false,
        report_card: false,
        picture: false,
        parent_id: false,
      });

      setAssignment({
        section: "",
        lrn: "",
      });

      alert("Enrollment reopened successfully.");
      await fetchRecord();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while reopening the enrollment.");
    } finally {
      setSaving(false);
    }
  };

  const docs = [
    {
      label: "Birth Certificate",
      key: "birth_cert",
      url: fileUrls.birth_cert_path,
    },
    {
      label: "Report Card",
      key: "report_card",
      url: fileUrls.report_card_path,
    },
    {
      label: "1x1 Picture",
      key: "picture",
      url: fileUrls.picture_path,
    },
    {
      label: "Valid ID of Parent",
      key: "parent_id",
      url: fileUrls.parent_id_path,
    },
  ];

  if (loading) {
    return (
      <div className="admin-page">
        <p>Loading enrollment details...</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="admin-page">
        <p>Enrollment record not found.</p>
      </div>
    );
  }

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Enrollment Details</h1>
        <p>Review submitted student information and documents</p>
      </div>

      <button className="back-button" onClick={() => navigate(-1)}>
        Back
      </button>

      <div className="details-grid">
        <div className="details-card">
          <h3>Student Information</h3>
          <p><strong>Enrollment Date:</strong> {record.enrollment_date}</p>
          <p><strong>School Year:</strong> {record.school_year || "-"}</p>
          <p><strong>Grade Level:</strong> {record.grade_level}</p>
          <p><strong>Family Name:</strong> {record.family_name}</p>
          <p><strong>Given Name:</strong> {record.given_name}</p>
          <p><strong>Middle Name:</strong> {record.middle_name || "-"}</p>
          <p><strong>Date of Birth:</strong> {record.date_of_birth}</p>
          <p><strong>Place of Birth:</strong> {record.place_of_birth || "-"}</p>
          <p><strong>Gender:</strong> {record.gender}</p>
        </div>

        <div className="details-card">
          <h3>Parent / Guardian Information</h3>
          <p><strong>Father's Name:</strong> {record.father_name || "-"}</p>
          <p><strong>Father Occupation:</strong> {record.father_occupation || "-"}</p>
          <p><strong>Father Education:</strong> {record.father_education || "-"}</p>
          <p><strong>Father Contact:</strong> {record.father_contact || "-"}</p>

          <hr className="details-divider" />

          <p><strong>Mother's Name:</strong> {record.mother_name || "-"}</p>
          <p><strong>Mother Occupation:</strong> {record.mother_occupation || "-"}</p>
          <p><strong>Mother Education:</strong> {record.mother_education || "-"}</p>
          <p><strong>Mother Contact:</strong> {record.mother_contact || "-"}</p>
        </div>

        <div className="details-card">
          <h3>Submission Details</h3>
          <p><strong>Payment Mode:</strong> {record.payment_mode || "-"}</p>
          <p><strong>Status:</strong> {record.status || "pending"}</p>
          <p>
            <strong>Submitted At:</strong>{" "}
            {record.created_at
              ? new Date(record.created_at).toLocaleString()
              : "-"}
          </p>
          <p><strong>User ID:</strong> {record.user_id ?? "-"}</p>
          <p><strong>Computed Tuition:</strong> ₱{getTuitionAmount().toLocaleString()}</p>
        </div>

        <div className="details-card">
          <h3>Admission Assignment</h3>

          <div className="admin-form-group">
            <label className="admin-form-label">Grade Level</label>
            <input
              type="text"
              value={record.grade_level || ""}
              disabled
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Assign Section</label>
            <input
              type="text"
              name="section"
              placeholder="Enter assigned section"
              value={assignment.section}
              onChange={handleAssignmentChange}
              className="admin-form-input"
            />
          </div>

          <div className="admin-form-group">
            <label className="admin-form-label">Assign LRN</label>
            <input
              type="text"
              name="lrn"
              placeholder="Enter LRN"
              value={assignment.lrn}
              onChange={handleAssignmentChange}
              className="admin-form-input"
            />
          </div>

          <small className="admin-helper-text">
            Section and LRN are required before approval.
          </small>
        </div>

        <div className="details-card details-card-full">
          <h3>Document Review</h3>

          <div className="document-review-list">
            {docs.map((doc) => (
              <div key={doc.key} className="document-review-item">
                <p className="document-review-title">
                  <strong>{doc.label}</strong>
                </p>

                <p className="document-review-link">
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer">
                      View File
                    </a>
                  ) : (
                    "File not available"
                  )}
                </p>

                <div className="admin-form-group">
                  <label className="admin-form-label">Remarks</label>
                  <input
                    type="text"
                    placeholder={`Enter remarks for ${doc.label}`}
                    value={remarks[doc.key]}
                    onChange={(e) => handleRemarkChange(doc.key, e.target.value)}
                    className="admin-form-input"
                  />
                </div>

                <label className="document-review-checkbox">
                  <input
                    type="checkbox"
                    checked={needsUpload[doc.key]}
                    onChange={(e) =>
                      handleNeedUploadChange(doc.key, e.target.checked)
                    }
                  />
                  <span>Needs Re-upload</span>
                </label>
              </div>
            ))}
          </div>
        </div>

        <div className="details-card details-card-full">
          <h3>Actions</h3>

          <div className="admin-actions">
            <button
              className="table-link-btn"
              onClick={saveReviewOnly}
              disabled={saving}
            >
              {saving ? "Saving..." : "Save Review"}
            </button>

            <button
              className="approve-btn"
              onClick={() => handleFinalize("approved")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Approve"}
            </button>

            <button
              className="table-link-btn"
              onClick={() => handleFinalize("needs_revision")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Needs Revision"}
            </button>

            <button
              className="reject-btn"
              onClick={() => handleFinalize("rejected")}
              disabled={saving}
            >
              {saving ? "Saving..." : "Reject"}
            </button>

            {["approved", "rejected"].includes(record.status) && (
              <button
                className="back-button"
                onClick={handleReopen}
                disabled={saving}
              >
                {saving ? "Saving..." : "Reopen"}
              </button>
            )}
          </div>

          <div className="admin-actions-note">
            <small>
              Use <strong>Needs Revision</strong> when one or more requirements
              must be re-uploaded.
            </small>
          </div>
        </div>
      </div>
    </div>
  );
}