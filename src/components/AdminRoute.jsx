import { Navigate } from "react-router-dom";

export default function AdminRoute({ children }) {
  const savedUser = localStorage.getItem("user");

  if (!savedUser) {
    return <Navigate to="/" replace />;
  }

  try {
    const user = JSON.parse(savedUser);

    if (user.role !== "admin") {
      return <Navigate to="/" replace />;
    }

    return children;
  } catch (error) {
    localStorage.removeItem("user");
    return <Navigate to="/" replace />;
  }
}