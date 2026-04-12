import React, { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import emailjs from "@emailjs/browser";

export default function AdminContacts() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [replyingId, setReplyingId] = useState(null);
  const [replySubject, setReplySubject] = useState("");
  const [replyMessage, setReplyMessage] = useState("");
  const [sendingReply, setSendingReply] = useState(false);

  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchMessages();
  }, []);

  const fetchMessages = async () => {
    setLoading(true);

    const { data, error } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching contact messages:", error);
    } else {
      setMessages(data || []);
    }

    setLoading(false);
  };

  const openReplyBox = (msg) => {
    setReplyingId(msg.id);
    setReplySubject(`Re: ${msg.department || "Your Inquiry"}`);
    setReplyMessage(msg.admin_reply || "");
  };

  const closeReplyBox = () => {
    setReplyingId(null);
    setReplySubject("");
    setReplyMessage("");
  };

  const sendGenericEmail = async ({
    toEmail,
    recipientName,
    subject,
    messageLine1,
    messageLine2 = "",
    messageLine3 = "",
  }) => {
    return emailjs.send(
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
  };

  const handleSendReply = async (msg) => {
    if (!replySubject.trim() || !replyMessage.trim()) {
      alert("Please enter both subject and reply message.");
      return;
    }

    try {
      setSendingReply(true);

      await sendGenericEmail({
        toEmail: msg.email,
        recipientName: msg.full_name || "Sender",
        subject: replySubject,
        messageLine1: replyMessage.trim(),
        messageLine2: "",
        messageLine3: "",
      });

      const { error: updateError } = await supabase
        .from("contact_messages")
        .update({
          admin_reply: replyMessage.trim(),
          replied_at: new Date().toISOString(),
          reply_status: "replied",
        })
        .eq("id", msg.id);

      if (updateError) {
        console.error("Error updating contact reply:", updateError);
        alert(
          `Reply email sent, but failed to save reply status: ${updateError.message}`
        );
        return;
      }

      alert("Reply sent successfully.");
      closeReplyBox();
      fetchMessages();
    } catch (error) {
      console.error("EmailJS reply error:", error);
      alert("Failed to send reply email.");
    } finally {
      setSendingReply(false);
    }
  };

  const filteredMessages = messages.filter((msg) => {
    if (filter === "pending") return msg.reply_status !== "replied";
    if (filter === "replied") return msg.reply_status === "replied";
    return true;
  });

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Contact Messages</h1>
        <p>Review submitted concerns and inquiries</p>
      </div>

      <div className="admin-table-wrapper">
        <div className="contact-filter-bar">
          <button
            className={`contact-filter-btn ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            All
          </button>

          <button
            className={`contact-filter-btn ${filter === "pending" ? "active" : ""}`}
            onClick={() => setFilter("pending")}
          >
            Pending
          </button>

          <button
            className={`contact-filter-btn ${filter === "replied" ? "active" : ""}`}
            onClick={() => setFilter("replied")}
          >
            Replied
          </button>
        </div>

        {loading ? (
          <p>Loading messages...</p>
        ) : filteredMessages.length === 0 ? (
          <p>No contact messages found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Department</th>
                <th>Message</th>
                <th>Status</th>
                <th>Sent At</th>
                <th>Action</th>
              </tr>
            </thead>

            <tbody>
              {filteredMessages.map((msg) => (
                <React.Fragment key={msg.id}>
                  <tr>
                    <td>{msg.id}</td>
                    <td>{msg.full_name || "-"}</td>
                    <td>{msg.email || "-"}</td>
                    <td>{msg.department || "-"}</td>
                    <td className="message-cell">{msg.message || "-"}</td>
                    <td>
                      <span
                        className={`status-badge status-${
                          msg.reply_status || "pending"
                        }`}
                      >
                        {msg.reply_status === "replied" ? "Replied" : "Pending"}
                      </span>
                    </td>
                    <td>
                      {msg.created_at
                        ? new Date(msg.created_at).toLocaleString()
                        : "-"}
                    </td>
                    <td>
                      <button
                        className="table-link-btn"
                        onClick={() => openReplyBox(msg)}
                      >
                        {msg.reply_status === "replied"
                          ? "View / Edit Reply"
                          : "Reply"}
                      </button>
                    </td>
                  </tr>

                  {replyingId === msg.id && (
                    <tr>
                      <td colSpan="8">
                        <div className="reply-box">
                          <h4 className="reply-title">
                            Reply to {msg.full_name || "Sender"}
                          </h4>

                          <input
                            type="text"
                            value={replySubject}
                            onChange={(e) => setReplySubject(e.target.value)}
                            placeholder="Enter subject"
                            className="reply-input"
                          />

                          <textarea
                            value={replyMessage}
                            onChange={(e) => setReplyMessage(e.target.value)}
                            placeholder="Type your reply here..."
                            rows="6"
                            className="reply-textarea"
                          />

                          <div className="reply-actions">
                            <button
                              className="approve-btn"
                              onClick={() => handleSendReply(msg)}
                              disabled={sendingReply}
                            >
                              {sendingReply ? "Sending..." : "Send Reply"}
                            </button>

                            <button
                              className="reject-btn"
                              onClick={closeReplyBox}
                              disabled={sendingReply}
                            >
                              Cancel
                            </button>
                          </div>

                          {msg.admin_reply && (
                            <div className="previous-reply">
                              <strong>Previous Reply:</strong>
                              <p>{msg.admin_reply}</p>
                              <small>
                                {msg.replied_at
                                  ? `Last replied: ${new Date(
                                      msg.replied_at
                                    ).toLocaleString()}`
                                  : ""}
                              </small>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}