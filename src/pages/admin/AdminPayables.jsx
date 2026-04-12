import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";

export default function AdminPayables() {
  const [payables, setPayables] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchPayables();
  }, []);

  const fetchPayables = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("student_payables")
        .select(`
          id,
          user_id,
          particulars,
          amount_due,
          remarks,
          status,
          payment_mode,
          installment_no,
          created_at,
          users:user_id (
            id,
            full_name,
            email
          )
        `)
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching payables:", error);
        alert("Failed to load payables.");
        return;
      }

      setPayables(data || []);
    } catch (err) {
      console.error(err);
      alert("Something went wrong while loading payables.");
    } finally {
      setLoading(false);
    }
  };

  const updatePayableStatus = async (payableId, nextStatus) => {
    try {
      setActionLoadingId(payableId);

      const remarks =
        nextStatus === "paid" ? "Payment completed." : "Pending payment";

      const { error } = await supabase
        .from("student_payables")
        .update({
          status: nextStatus,
          remarks,
        })
        .eq("id", payableId);

      if (error) {
        console.error("Error updating payable status:", error);
        alert("Failed to update payable status.");
        return;
      }

      setPayables((prev) =>
        prev.map((item) =>
          item.id === payableId
            ? {
                ...item,
                status: nextStatus,
                remarks,
              }
            : item
        )
      );
    } catch (err) {
      console.error(err);
      alert("Something went wrong while updating payable status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusLabel = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "paid") return "Paid";
    if (value === "partial") return "Partial";
    return "Unpaid";
  };

  const getStatusClass = (status) => {
    const value = String(status || "").toLowerCase();

    if (value === "paid") return "status-approved";
    if (value === "partial") return "status-pending";
    return "status-rejected";
  };

  const filteredPayables = useMemo(() => {
    const keyword = search.trim().toLowerCase();

    return payables.filter((item) => {
      const studentName = item.users?.full_name?.toLowerCase() || "";
      const studentEmail = item.users?.email?.toLowerCase() || "";
      const particulars = item.particulars?.toLowerCase() || "";
      const paymentMode = item.payment_mode?.toLowerCase() || "";
      const status = (item.status || "unpaid").toLowerCase();

      const matchesSearch =
        !keyword ||
        studentName.includes(keyword) ||
        studentEmail.includes(keyword) ||
        particulars.includes(keyword) ||
        paymentMode.includes(keyword);

      const matchesStatus =
        statusFilter === "all" ? true : status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [payables, search, statusFilter]);

  const summary = useMemo(() => {
    const totalRecords = filteredPayables.length;
    const paidCount = filteredPayables.filter(
      (item) => String(item.status || "").toLowerCase() === "paid"
    ).length;
    const unpaidCount = filteredPayables.filter(
      (item) => String(item.status || "unpaid").toLowerCase() === "unpaid"
    ).length;
    const totalAmount = filteredPayables.reduce(
      (sum, item) => sum + Number(item.amount_due || 0),
      0
    );

    return {
      totalRecords,
      paidCount,
      unpaidCount,
      totalAmount,
    };
  }, [filteredPayables]);

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Payables</h1>
        <p>Manage student billing records and payment status</p>
      </div>

      <div className="payables-summary">
        <div className="payables-summary-card">
          <h3>Total Records</h3>
          <p>{summary.totalRecords}</p>
        </div>

        <div className="payables-summary-card">
          <h3>Paid</h3>
          <p>{summary.paidCount}</p>
        </div>

        <div className="payables-summary-card">
          <h3>Unpaid</h3>
          <p>{summary.unpaidCount}</p>
        </div>

        <div className="payables-summary-card">
          <h3>Total Amount</h3>
          <p>₱{summary.totalAmount.toLocaleString()}</p>
        </div>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search student, email, particulars, or payment mode"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="admin-search-input"
        />

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Statuses</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partial</option>
          <option value="paid">Paid</option>
        </select>

        <button className="table-link-btn" onClick={fetchPayables}>
          Refresh
        </button>
      </div>

      <div className="admin-table-wrapper payables-table">
        {loading ? (
          <p>Loading payables...</p>
        ) : filteredPayables.length === 0 ? (
          <div className="payables-empty-state">
            No payable records found.
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Student</th>
                <th>Particulars</th>
                <th>Amount Due</th>
                <th>Payment Mode</th>
                <th>Installment</th>
                <th>Status</th>
                <th>Remarks</th>
                <th>Created At</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredPayables.map((item) => (
                <tr key={item.id}>
                  <td>{item.id}</td>

                  <td className="payables-student-cell">
                    <p className="payables-student-name">
                      {item.users?.full_name || "-"}
                    </p>
                    <p className="payables-student-email">
                      {item.users?.email || "-"}
                    </p>
                  </td>

                  <td>{item.particulars || "-"}</td>

                  <td className="payables-amount">
                    {item.amount_due !== null && item.amount_due !== undefined
                      ? `₱${Number(item.amount_due).toLocaleString()}`
                      : "-"}
                  </td>

                  <td>
                    <span className="payables-mode">
                      {item.payment_mode
                        ? String(item.payment_mode).replaceAll("_", " ")
                        : "-"}
                    </span>
                  </td>

                  <td>
                    {item.installment_no ? (
                      <span className="payables-installment">
                        {item.installment_no}
                      </span>
                    ) : (
                      "-"
                    )}
                  </td>

                  <td>
                    <span
                      className={`status-badge ${getStatusClass(item.status)}`}
                    >
                      {getStatusLabel(item.status)}
                    </span>
                  </td>

                  <td className="payables-remarks">{item.remarks || "-"}</td>

                  <td>
                    {item.created_at
                      ? new Date(item.created_at).toLocaleString()
                      : "-"}
                  </td>

                  <td className="admin-actions payables-actions">
                    {String(item.status || "unpaid").toLowerCase() !== "paid" ? (
                      <button
                        className="approve-btn"
                        onClick={() => updatePayableStatus(item.id, "paid")}
                        disabled={actionLoadingId === item.id}
                      >
                        {actionLoadingId === item.id
                          ? "Updating..."
                          : "Mark as Paid"}
                      </button>
                    ) : (
                      <button
                        className="reject-btn"
                        onClick={() => updatePayableStatus(item.id, "unpaid")}
                        disabled={actionLoadingId === item.id}
                      >
                        {actionLoadingId === item.id
                          ? "Updating..."
                          : "Mark as Unpaid"}
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