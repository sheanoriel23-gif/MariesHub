import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../supabase";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .order("id", { ascending: false });

      if (error) {
        console.error("Error fetching users:", error);
      } else {
        setUsers(data || []);
      }
    } catch (error) {
      console.error("Unexpected error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const roles = useMemo(() => {
    const values = users.map((user) => user.role).filter(Boolean);
    return [...new Set(values)];
  }, [users]);

  const filteredUsers = useMemo(() => {
    const search = searchTerm.trim().toLowerCase();

    return users.filter((user) => {
      const matchesSearch =
        !search ||
        (user.full_name || "").toLowerCase().includes(search) ||
        (user.email || "").toLowerCase().includes(search) ||
        (user.login_id || "").toLowerCase().includes(search);

      const matchesRole = roleFilter === "all" || user.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, searchTerm, roleFilter]);

  const getRoleLabel = (role) => {
    switch (role) {
      case "admin":
        return "Admin";
      case "student":
        return "Student";
      case "parent":
        return "Parent";
      default:
        return role || "-";
    }
  };

  return (
    <div className="admin-page">
      <div className="admin-page-header">
        <h1>Users</h1>
        <p>View all created user accounts</p>
      </div>

      <div className="admin-filters">
        <input
          type="text"
          placeholder="Search by name, email, or login ID"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="admin-search"
        />

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="admin-select"
        >
          <option value="all">All Roles</option>
          {roles.map((role) => (
            <option key={role} value={role}>
              {getRoleLabel(role)}
            </option>
          ))}
        </select>
      </div>

      <div className="admin-table-wrapper">
        {loading ? (
          <p>Loading users...</p>
        ) : filteredUsers.length === 0 ? (
          <p>No users found.</p>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Full Name</th>
                <th>Email</th>
                <th>Login ID</th>
                <th>Role</th>
              </tr>
            </thead>

            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id}>
                  <td>{user.id}</td>
                  <td>{user.full_name || "-"}</td>
                  <td>{user.email || "-"}</td>
                  <td>{user.login_id || "-"}</td>
                  <td>
                    <span className={`status-badge role-badge role-${user.role || "default"}`}>
                      {getRoleLabel(user.role)}
                    </span>
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