import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../../supabase";

export default function AdminEnrollments() {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("enrollment_requests")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching enrollments:", error);
        alert("Failed to load enrollments.");
        return;
      }

      setEnrollments(data || []);
    } catch (err) {
      console.error("Unexpected fetch error:", err);
      alert("Something went wrong while loading enrollments.");
    } finally {
      setLoading(false);
    }
  };

  const clearStudentPayables = async (userId) => {
    if (!userId) {
      throw new Error("Missing userId while clearing payables.");
    }

    const normalizedUserId = Number(userId);

    const { error } = await supabase
      .from("student_payables")
      .delete()
      .eq("user_id", normalizedUserId);

    if (error) {
      console.error("Error clearing payables:", error);
      throw error;
    }
  };

  const syncStudentProfileStatus = async (userId, status, enrollment) => {
    if (!userId) {
      throw new Error("Missing userId for student profile sync.");
    }

    const payload = {
      user_id: Number(userId),
      full_name: [
        enrollment.given_name,
        enrollment.middle_name,
        enrollment.family_name,
      ]
        .filter(Boolean)
        .join(" "),
      academic_level: enrollment.grade_level || null,
      school_year: enrollment.school_year || null,
      status,
      updated_at: new Date().toISOString(),
    };

    if (status === "approved") {
    } else {
      payload.section = null;
      payload.lrn = null;
      payload.image_url = null;
    }

    const { error } = await supabase
      .from("student_profiles")
      .upsert([payload], { onConflict: "user_id" });

    if (error) {
      console.error("Error syncing student profile:", error);
      throw error;
    }
  };

  const shouldClearPayables = (status) => {
    return ["in_review", "needs_revision", "rejected"].includes(status);
  };

  const updateStatus = async (item, newStatus) => {
    try {
      setActionLoadingId(item.id);

      let enrollmentPayload = {
        status: newStatus,
        updated_at: new Date().toISOString(),
      };

      if (["in_review", "rejected"].includes(newStatus)) {
        enrollmentPayload = {
          ...enrollmentPayload,
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
        .update(enrollmentPayload)
        .eq("id", item.id);

      if (enrollmentError) {
        console.error("Error updating enrollment status:", enrollmentError);
        alert("Failed to update enrollment status.");
        return;
      }

      if (shouldClearPayables(newStatus)) {
        await clearStudentPayables(item.user_id);
      }

      await syncStudentProfileStatus(item.user_id, newStatus, item);

      await fetchEnrollments();
      alert(`Enrollment updated to ${newStatus.replaceAll("_", " ")}.`);
    } catch (err) {
      console.error("Status update failed:", err);
      alert("Something went wrong while updating status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const filteredEnrollments = useMemo(() => {
    if (statusFilter === "all") return enrollments;

    return enrollments.filter(
      (item) => (item.status || "pending") === statusFilter
    );
  }, [enrollments, statusFilter]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "in_review":
        return "In Review";
      case "needs_revision":
        return "Needs Revision";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status || "Pending";
    }
  };

  const formatPaymentMode = (paymentMode) => {
    if (!paymentMode) return "-";

    const value = String(paymentMode).toLowerCase().trim();

    switch (value) {
      case "cash":
        return "Cash";
      case "semestral":
        return "Semestral";
      case "quarterly":
        return "Quarterly";
      case "monthly":
        return "Monthly";
      default:
        return String(paymentMode).replaceAll("_", " ");
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Enrollments</h1>
        <p>Manage and review enrollment requests</p>
      </div>

      <div className="admin-filters enrollments-filter-bar">
        <div className="enrollments-filter-label">
          <strong>Filter by status:</strong>
        </div>

        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="all">All</option>
          <option value="pending">Pending</option>
          <option value="in_review">In Review</option>
          <option value="needs_revision">Needs Revision</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button className="table-link-btn" onClick={fetchEnrollments}>
          Refresh
        </button>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <p>Loading enrollments...</p>
        ) : filteredEnrollments.length === 0 ? (
          <p>No enrollment requests found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>School Year</th>
                <th>Grade Level</th>
                <th>Payment</th>
                <th>Status</th>
                <th>Date Submitted</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredEnrollments.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>

                  <td>
                    {item.family_name}, {item.given_name}
                    {item.middle_name ? ` ${item.middle_name}` : ""}
                  </td>

                  <td>{item.school_year || "-"}</td>
                  <td>{item.grade_level || "-"}</td>
                  <td>{formatPaymentMode(item.payment_mode)}</td>

                  <td>
                    <span
                      className={`status-badge status-${item.status || "pending"}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>

                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "-"}
                  </td>

                  <td className="admin-actions enrollments-actions-cell">
                    <Link
                      to={`/admin/enrollments/${item.id}`}
                      className="table-link-btn"
                    >
                      Review
                    </Link>

                    {item.status === "pending" && (
                      <button
                        className="approve-btn"
                        disabled={actionLoadingId === item.id}
                        onClick={() => updateStatus(item, "in_review")}
                      >
                        {actionLoadingId === item.id
                          ? "Updating..."
                          : "Mark In Review"}
                      </button>
                    )}

                    {item.status === "needs_revision" && (
                      <button
                        className="approve-btn"
                        disabled={actionLoadingId === item.id}
                        onClick={() => updateStatus(item, "in_review")}
                      >
                        {actionLoadingId === item.id
                          ? "Updating..."
                          : "Re-Review"}
                      </button>
                    )}

                    {["approved", "rejected"].includes(item.status) && (
                      <button
                        className="reject-btn"
                        disabled={actionLoadingId === item.id}
                        onClick={() => updateStatus(item, "in_review")}
                      >
                        {actionLoadingId === item.id
                          ? "Updating..."
                          : "Reopen"}
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}