import { useState } from "react";
import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  UserPlus,
  FileText,
  GraduationCap,
  Mail,
  Users,
  LogOut,
  CreditCard,
} from "lucide-react";
import logo from "../assets/logo.png";
import "../styles/admin.css";

export default function AdminLayout() {
  const navigate = useNavigate();
  const location = useLocation();

  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const confirmLogout = () => {
    localStorage.removeItem("user");
    navigate("/", { replace: true });
  };

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const navItems = [
    { to: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
    {
      to: "/admin/account-requests",
      label: "Account Requests",
      icon: <UserPlus size={18} />,
    },
    {
      to: "/admin/enrollments",
      label: "Enrollments",
      icon: <FileText size={18} />,
    },
    {
      to: "/admin/payables",
      label: "Payables",
      icon: <CreditCard size={18} />,
    },
    {
      to: "/admin/students",
      label: "Students",
      icon: <GraduationCap size={18} />,
    },
    {
      to: "/admin/contacts",
      label: "Contact Messages",
      icon: <Mail size={18} />,
    },
    { to: "/admin/users", label: "Users", icon: <Users size={18} /> },
  ];

  return (
    <div className="admin-shell">
      <aside className="admin-sidebar">
        <div>
          <div className="admin-brand">
            <img src={logo} alt="School Logo" className="admin-logo" />
            <div className="admin-brand-text">
              <h2>Maries Christian School</h2>
              <p>Admin Management Panel</p>
            </div>
          </div>

          <nav className="admin-nav">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={isActive(item.to) ? "active" : ""}
              >
                <span className="admin-nav-icon">{item.icon}</span>
                <span>{item.label}</span>
              </Link>
            ))}
          </nav>
        </div>

        <button
          className="admin-logout-btn"
          onClick={() => setShowLogoutModal(true)}
        >
          <span className="admin-logout-icon">
            <LogOut size={18} />
          </span>
          <span>Logout</span>
        </button>
      </aside>

      <main className="admin-main">
        <Outlet />
      </main>

      {showLogoutModal && (
        <div className="admin-modal-overlay">
          <div className="admin-modal">
            <h3>Confirm Logout</h3>
            <p>Are you sure you want to logout?</p>

            <div className="admin-modal-actions">
              <button
                className="reject-btn"
                onClick={() => setShowLogoutModal(false)}
              >
                Cancel
              </button>

              <button className="approve-btn" onClick={confirmLogout}>
                Yes, Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}