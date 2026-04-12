import { Routes, Route } from "react-router-dom";

import Home from "./pages/Home";
import About from "./pages/About";
import Programs from "./pages/Programs";
import Enroll from "./pages/Enroll";
import EnrollStep2 from "./pages/EnrollStep2";
import Contact from "./pages/Contact";
import Profile from "./pages/Profile";
import Login from "./pages/Login";
import ForgotPassword from "./pages/ForgotPassword";

import Layout from "./Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import AdminLayout from "./layouts/AdminLayout";
import AdminDashboard from "./pages/admin/AdminDashboard";
import AdminAccountRequests from "./pages/admin/AdminAccountRequests";
import AdminPayables from "./pages/admin/AdminPayables";
import AdminEnrollments from "./pages/admin/AdminEnrollments";
import AdminEnrollmentDetails from "./pages/admin/AdminEnrollmentDetails";
import AdminContacts from "./pages/admin/AdminContacts";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminStudents from "./pages/admin/AdminStudents";

function App() {
  return (
    <Routes>
      {/* PUBLIC */}
      <Route path="/" element={<Login />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />

      {/* USER PAGES */}
      <Route
        path="/home"
        element={
          <ProtectedRoute>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/about"
        element={
          <ProtectedRoute>
            <Layout>
              <About />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/programs"
        element={
          <ProtectedRoute>
            <Layout>
              <Programs />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/enroll"
        element={
          <ProtectedRoute>
            <Layout>
              <Enroll />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/enroll-step2"
        element={
          <ProtectedRoute>
            <Layout>
              <EnrollStep2 />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <Layout>
              <Contact />
            </Layout>
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Layout>
              <Profile />
            </Layout>
          </ProtectedRoute>
        }
      />

      {/* ADMIN PAGES */}
      <Route
        path="/admin"
        element={
          <AdminRoute>
            <AdminLayout />
          </AdminRoute>
        }
      >
        <Route index element={<AdminDashboard />} />
        <Route path="account-requests" element={<AdminAccountRequests />} />
        <Route path="enrollments" element={<AdminEnrollments />} />
        <Route path="enrollments/:id" element={<AdminEnrollmentDetails />} />
        <Route path="payables" element={<AdminPayables />} />
        <Route path="students" element={<AdminStudents />} />
        <Route path="contacts" element={<AdminContacts />} />
        <Route path="users" element={<AdminUsers />} />
      </Route>
    </Routes>
  );
}

export default App;