import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";
import emailjs from "@emailjs/browser";

export default function AdminAccountRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);
  const [statusFilter, setStatusFilter] = useState("all");

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("account_requests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching account requests:", error);
    } else {
      setRequests(data || []);
    }

    setLoading(false);
  };

  const buildFullName = (request) => {
    return [request.first_name, request.middle_name, request.last_name]
      .filter(Boolean)
      .join(" ");
  };

  const generateLoginId = (request) => {
    const lastName = (request.last_name || "student")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]/g, "");

    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `${lastName}${randomNum}`;
  };

  const generatePassword = () => {
    const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";

    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return result;
  };

  const sendGenericEmail = async ({
    toEmail,
    recipientName,
    subject,
    messageLine1,
    messageLine2 = "",
    messageLine3 = "",
  }) => {
    try {
      await emailjs.send(
        "service_3osc2tp",
        "template_938b4b9",
        {
          to_email: toEmail,
          recipient_name: recipientName,
          subject,
          message_line1: messageLine1,
          message_line2: messageLine2,
          message_line3: messageLine3,
        },
        "q9NeyY6muacFLd_Vj"
      );
    } catch (error) {
      console.error("Email error:", error);
      throw error;
    }
  };

  const approveRequest = async (request) => {
    try {
      setActionLoadingId(request.id);

      const fullName = buildFullName(request);
      const loginId = generateLoginId(request);
      const password = generatePassword();

      const { data: existingUserByEmail, error: existingEmailError } =
        await supabase
          .from("users")
          .select("id")
          .eq("email", request.email)
          .maybeSingle();

      if (existingEmailError) {
        console.error("Existing email check error:", existingEmailError);
        alert(`Failed checking email: ${existingEmailError.message}`);
        return;
      }

      if (existingUserByEmail) {
        alert("A user with this email already exists.");
        return;
      }

      const { data: existingUserByLogin, error: existingLoginError } =
        await supabase
          .from("users")
          .select("id")
          .eq("login_id", loginId)
          .maybeSingle();

      if (existingLoginError) {
        console.error("Existing login ID check error:", existingLoginError);
        alert(`Failed checking login ID: ${existingLoginError.message}`);
        return;
      }

      if (existingUserByLogin) {
        alert("Login ID already exists. Try approving again.");
        return;
      }

      const { data: newUser, error: userError } = await supabase
        .from("users")
        .insert([
          {
            full_name: fullName,
            email: request.email,
            login_id: loginId,
            password,
            role: "student",
          },
        ])
        .select()
        .single();

      if (userError) {
        console.error("User creation error:", userError);
        alert(`Failed to create user account: ${userError.message}`);
        return;
      }

      const { error: requestError } = await supabase
        .from("account_requests")
        .update({
          status: "approved",
          processed_at: new Date().toISOString(),
          approved_user_id: newUser.id,
          generated_login_id: loginId,
        })
        .eq("id", request.id);

      if (requestError) {
        console.error("Request update error:", requestError);
        alert("Account created, but failed to update request.");
        return;
      }

      try {
        await sendGenericEmail({
          toEmail: request.email,
          recipientName: fullName,
          subject: "Your MariesHub Account Details",
          messageLine1: "Your MariesHub account has been approved.",
          messageLine2: `Login ID: ${loginId}`,
          messageLine3: `Password: ${password}`,
        });
      } catch (emailError) {
        alert("Account created, but email failed to send.");
      }

      alert("Account approved! Credentials sent via email.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while approving the request.");
    } finally {
      setActionLoadingId(null);
    }
  };

    const rejectRequest = async (request) => {
    try {
      setActionLoadingId(request.id);

      const fullName = buildFullName(request);

      const { error } = await supabase
        .from("account_requests")
        .update({
          status: "rejected",
          processed_at: new Date().toISOString(),
        })
        .eq("id", request.id);

      if (error) {
        console.error("Reject error:", error);
        alert("Failed to reject request.");
        return;
      }

      try {
        await sendGenericEmail({
          toEmail: request.email,
          recipientName: fullName,
          subject: "Your MariesHub Account Request Update",
          messageLine1: "Your MariesHub account request was not approved at this time.",
          messageLine2: "Please contact the school administration for more information.",
          messageLine3: "You may submit a new request if advised by the school.",
        });
      } catch (emailError) {
        console.error("Rejection email error:", emailError);
        alert("Request rejected, but rejection email failed to send.");
        fetchRequests();
        return;
      }

      alert("Account request rejected. Email notification sent.");
      fetchRequests();
    } catch (err) {
      console.error(err);
      alert("Something went wrong while rejecting the request.");
    } finally {
      setActionLoadingId(null);
    }
  };


  const filteredRequests = useMemo(() => {
    if (statusFilter === "all") return requests;
    return requests.filter((req) => (req.status || "pending") === statusFilter);
  }, [requests, statusFilter]);

  const getStatusLabel = (status) => {
    switch (status) {
      case "pending":
        return "Pending";
      case "approved":
        return "Approved";
      case "rejected":
        return "Rejected";
      default:
        return status || "Pending";
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Account Requests</h1>
        <p>Review new student account applications</p>
      </div>

      <div className="admin-filters">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>

        <button className="table-link-btn" onClick={fetchRequests}>
          Refresh
        </button>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <p>Loading account requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p>No account requests found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Requested At</th>
                <th>Generated Login ID</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredRequests.map((req) => (
                <tr key={req.id}>
                  <td>{req.id}</td>
                  <td>{[req.first_name, req.middle_name, req.last_name].filter(Boolean).join(" ")}</td>
                  <td>{req.email || "-"}</td>
                  <td>
                    <span className={`status-badge status-${req.status || "pending"}`}>
                      {getStatusLabel(req.status)}
                    </span>
                  </td>
                  <td>
                    {req.created_at
                      ? new Date(req.created_at).toLocaleString()
                      : "-"}
                  </td>
                  <td>{req.generated_login_id || "-"}</td>
                  <td className="admin-actions">
                    {req.status === "pending" ? (
                      <>
                        <button
                          className="approve-btn"
                          onClick={() => approveRequest(req)}
                          disabled={actionLoadingId === req.id}
                        >
                          {actionLoadingId === req.id ? "Processing..." : "Approve"}
                        </button>

                        <button
                          className="reject-btn"
                          onClick={() => rejectRequest(req.id)}
                          disabled={actionLoadingId === req.id}
                        >
                          Reject
                        </button>
                      </>
                    ) : (
                      <span className="admin-muted-text">No actions available</span>
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