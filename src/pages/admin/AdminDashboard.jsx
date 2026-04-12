import { useEffect, useState } from "react";
import { supabase } from "../../supabase";
import {
  Users,
  GraduationCap,
  FileText,
  CheckCircle,
  Mail,
  ClipboardList,
} from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalStudents: 0,
    pendingEnrollments: 0,
    approvedEnrollments: 0,
    pendingContacts: 0,
    pendingAccountRequests: 0,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);

      const [
        usersResult,
        studentsResult,
        pendingEnrollmentsResult,
        approvedEnrollmentsResult,
        pendingContactsResult,
        pendingAccountRequestsResult,
      ] = await Promise.all([
        supabase.from("users").select("*", { count: "exact", head: true }),

        supabase
          .from("student_profiles")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),

        supabase
          .from("enrollment_requests")
          .select("*", { count: "exact", head: true })
          .in("status", ["pending", "in_review", "needs_revision"]),

        supabase
          .from("enrollment_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "approved"),

        supabase
          .from("contact_messages")
          .select("*", { count: "exact", head: true })
          .or("reply_status.is.null,reply_status.eq.pending"),

        supabase
          .from("account_requests")
          .select("*", { count: "exact", head: true })
          .eq("status", "pending"),
      ]);

      setStats({
        totalUsers: usersResult.count || 0,
        totalStudents: studentsResult.count || 0,
        pendingEnrollments: pendingEnrollmentsResult.count || 0,
        approvedEnrollments: approvedEnrollmentsResult.count || 0,
        pendingContacts: pendingContactsResult.count || 0,
        pendingAccountRequests: pendingAccountRequestsResult.count || 0,
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const cards = [
    { title: "Total Users", value: stats.totalUsers, icon: <Users size={20} /> },
    { title: "Approved Students", value: stats.totalStudents, icon: <GraduationCap size={20} /> },
    { title: "Pending Enrollments", value: stats.pendingEnrollments, icon: <FileText size={20} /> },
    { title: "Approved Enrollments", value: stats.approvedEnrollments, icon: <CheckCircle size={20} /> },
    { title: "Pending Contacts", value: stats.pendingContacts, icon: <Mail size={20} /> },
    { title: "Pending Requests", value: stats.pendingAccountRequests, icon: <ClipboardList size={20} /> },
  ];

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Dashboard</h1>
        <p>Overview of your school enrollment system</p>
      </div>

      {loading ? (
        <p>Loading dashboard...</p>
      ) : (
        <div className="dashboard-grid">
          {cards.map((card) => (
            <div key={card.title} className="admin-card dashboard-card">
              <div className="dashboard-card-header">
                <div className="dashboard-icon">{card.icon}</div>
              </div>

              <h3>{card.title}</h3>
              <p>{card.value}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}